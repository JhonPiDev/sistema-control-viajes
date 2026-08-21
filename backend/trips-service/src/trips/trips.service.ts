import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto } from '../common/dto/create-trip.dto';
import { UpdateTripDto } from '../common/dto/update-trip.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { TripStatus } from '@prisma/client';

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTripDto) {
    return this.prisma.trip.create({
      data: {
        name: dto.name,
        origin: dto.origin,
        destination: dto.destination,
        driverId: dto.driverId,
        createdById: dto.createdById,
        passengers: dto.passengers?.length
          ? {
              create: dto.passengers.map((p) => ({
                name: p.name,
                document: p.document,
              })),
            }
          : undefined,
        // El orden de la parada es su posición en el arreglo (1-indexed),
        // así el recorrido queda origin -> stops[0] -> stops[1] -> ... -> destination.
        stops: dto.stops?.length
          ? {
              create: dto.stops.map((city, index) => ({
                city,
                order: index + 1,
              })),
            }
          : undefined,
      },
      include: {
        passengers: { include: { stop: true } },
        driver: true,
        stops: { orderBy: { order: 'asc' } },
      },
    });
  }

  async findAll(pagination: PaginationDto, driverId?: string) {
    const { page, limit, status } = pagination;
    const where: any = {};
    if (status) where.status = status;
    if (driverId) where.driverId = driverId;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.trip.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          driver: { select: { id: true, name: true, email: true } },
          passengers: { include: { stop: true } },
          stops: { orderBy: { order: 'asc' } },
        },
      }),
      this.prisma.trip.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  /**
   * Conteos agregados para las tarjetas de estadísticas del dashboard.
   * Se calculan sobre TODA la tabla (o todo lo del conductor, si aplica),
   * sin importar el filtro/paginación que esté usando la pantalla que
   * lista los viajes — así las tarjetas no cambian según el filtro activo.
   */
  async getStats(driverId?: string) {
    const where: any = {};
    if (driverId) where.driverId = driverId;

    const [total, statusGroups, passengersTotal] = await Promise.all([
      this.prisma.trip.count({ where }),
      this.prisma.trip.groupBy({ by: ['status'], where, _count: { _all: true } }),
      this.prisma.passenger.count({
        where: driverId ? { trip: { driverId } } : undefined,
      }),
    ]);

    const byStatus: Record<string, number> = {
      PENDING: 0,
      IN_PROGRESS: 0,
      FINISHED: 0,
    };
    for (const group of statusGroups) {
      byStatus[group.status] = group._count._all;
    }

    return { total, byStatus, passengersTotal };
  }

  async findOne(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        driver: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        passengers: { include: { stop: true } },
        stops: { orderBy: { order: 'asc' } },
      },
    });
    if (!trip) throw new NotFoundException('Viaje no encontrado');
    return trip;
  }

  /**
   * Solo editable en PENDIENTE (evita inconsistencias una vez hay firma o
   * pasajeros abordados). Las paradas se reemplazan completas.
   */
  async update(id: string, dto: UpdateTripDto) {
    const trip = await this.findOne(id);
    if (trip.status !== TripStatus.PENDING) {
      throw new BadRequestException(
        'Solo se pueden editar viajes pendientes. Este ya inició o finalizó.',
      );
    }
    return this.prisma.trip.update({
      where: { id },
      data: {
        name: dto.name,
        origin: dto.origin,
        destination: dto.destination,
        driverId: dto.driverId,
        stops: dto.stops
          ? {
              deleteMany: {},
              create: dto.stops.map((city, index) => ({ city, order: index + 1 })),
            }
          : { deleteMany: {} },
      },
      include: {
        passengers: { include: { stop: true } },
        driver: true,
        stops: { orderBy: { order: 'asc' } },
      },
    });
  }

  /** Viajes FINALIZADOS hace más de `days` días: candidatos a limpieza automática. */
  async findExpired(days: number) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.prisma.trip.findMany({
      where: { status: TripStatus.FINISHED, finishedAt: { lt: cutoff } },
      select: { id: true },
    });
  }

  /**
   * Solo se puede eliminar un viaje FINALIZADO (uno en curso tumbaría la
   * app al conductor a mitad de ruta). Pasajeros/paradas se borran en
   * cascada; gastos/novedades viven en operations-service y los borra
   * antes TripsCleanupService (gateway).
   */
  async remove(id: string) {
    const trip = await this.findOne(id);
    if (trip.status !== TripStatus.FINISHED) {
      throw new BadRequestException(
        trip.status === TripStatus.PENDING
          ? 'No se puede eliminar un viaje pendiente. Edítalo o espera a que se complete.'
          : 'No se puede eliminar un viaje en curso. Debe cerrarse primero.',
      );
    }
    await this.prisma.trip.delete({ where: { id } });
    return { deleted: true };
  }

  /** Usado por operations-service (vía gateway/TCP) para validar reglas de negocio */
  async checkStatus(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      select: { id: true, status: true, driverId: true },
    });
    if (!trip) throw new NotFoundException('Viaje no encontrado');
    return trip;
  }

  async saveSignature(id: string, signatureData: string) {
    const trip = await this.findOne(id);
    if (trip.status !== TripStatus.PENDING) {
      throw new BadRequestException(
        'Solo se puede capturar la firma antes de iniciar el viaje',
      );
    }
    return this.prisma.trip.update({
      where: { id },
      data: { signatureData, signedAt: new Date() },
      include: {
        driver: true,
        passengers: { include: { stop: true } },
        stops: { orderBy: { order: 'asc' } },
      },
    });
  }

  async start(id: string) {
    const trip = await this.findOne(id);
    if (trip.status !== TripStatus.PENDING) {
      throw new BadRequestException('El viaje ya fue iniciado o finalizado');
    }
    if (!trip.signatureData) {
      throw new BadRequestException(
        'No se puede iniciar el viaje sin la firma digital del despachador/cliente',
      );
    }
    // Un conductor no puede tener dos viajes EN RUTA al mismo tiempo: debe
    // cerrar el que tiene en curso antes de iniciar otro.
    const activeTrip = await this.prisma.trip.findFirst({
      where: { driverId: trip.driverId, status: TripStatus.IN_PROGRESS },
    });
    if (activeTrip) {
      throw new BadRequestException(
        `Ya tienes el viaje "${activeTrip.name}" en curso. Debes cerrarlo antes de iniciar otro.`,
      );
    }
    return this.prisma.trip.update({
      where: { id },
      data: { status: TripStatus.IN_PROGRESS, startedAt: new Date() },
      include: {
        driver: true,
        passengers: { include: { stop: true } },
        stops: { orderBy: { order: 'asc' } },
      },
    });
  }

  async finish(id: string) {
    const trip = await this.findOne(id);
    if (trip.status !== TripStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Solo se puede cerrar un viaje que está en curso',
      );
    }
    return this.prisma.trip.update({
      where: { id },
      data: { status: TripStatus.FINISHED, finishedAt: new Date() },
      include: {
        driver: true,
        passengers: { include: { stop: true } },
        stops: { orderBy: { order: 'asc' } },
      },
    });
  }

  /** Datos base del viaje + pasajeros para el reporte de cierre (el gateway añade gastos/novedades) */
  async getSummary(id: string) {
    const trip = await this.findOne(id);
    const boarded = trip.passengers.filter((p) => p.boardingStatus === 'BOARDED').length;
    const boardedAtOrigin = trip.passengers.filter(
      (p) => p.boardingStatus === 'BOARDED' && !p.stopId,
    ).length;
    // Desglose de cuántos pasajeros abordaron en cada parada intermedia,
    // para que el reporte de cierre no solo muestre el total sino de dónde
    // vino cada uno (origen vs. cada parada).
    const stopsSummary = trip.stops.map((s) => ({
      stopId: s.id,
      city: s.city,
      order: s.order,
      boarded: trip.passengers.filter(
        (p) => p.stopId === s.id && p.boardingStatus === 'BOARDED',
      ).length,
    }));
    return {
      trip,
      passengersTotal: trip.passengers.length,
      passengersBoarded: boarded,
      passengersBoardedAtOrigin: boardedAtOrigin,
      stopsSummary,
    };
  }
}
