import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto } from '../common/dto/create-trip.dto';
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
      },
      include: { passengers: true, driver: true },
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
          passengers: true,
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

  async findOne(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        driver: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        passengers: true,
      },
    });
    if (!trip) throw new NotFoundException('Viaje no encontrado');
    return trip;
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
      include: { driver: true, passengers: true },
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
    return this.prisma.trip.update({
      where: { id },
      data: { status: TripStatus.IN_PROGRESS, startedAt: new Date() },
      include: { driver: true, passengers: true },
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
      include: { driver: true, passengers: true },
    });
  }

  /** Datos base del viaje + pasajeros para el reporte de cierre (el gateway añade gastos/novedades) */
  async getSummary(id: string) {
    const trip = await this.findOne(id);
    const boarded = trip.passengers.filter((p) => p.boardingStatus === 'BOARDED').length;
    return {
      trip,
      passengersTotal: trip.passengers.length,
      passengersBoarded: boarded,
    };
  }
}
