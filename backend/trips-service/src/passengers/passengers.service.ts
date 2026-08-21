import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePassengerDto } from '../common/dto/create-passenger.dto';
import { BoardingStatus, TripStatus } from '@prisma/client';

@Injectable()
export class PassengersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTrip(tripId: string) {
    return this.prisma.passenger.findMany({
      where: { tripId },
      orderBy: { name: 'asc' },
      include: { stop: true },
    });
  }

  async add(dto: CreatePassengerDto) {
    // Con parada (agregado en ruta por el conductor) ya está abordando: se
    // registra BOARDED directo. Sin parada (por el admin, al crear el
    // viaje) sigue el check-in normal y queda PENDING.
    let boardingStatus: BoardingStatus | undefined;
    let checkedAt: Date | undefined;
    if (dto.stopId) {
      const stop = await this.prisma.stop.findUnique({
        where: { id: dto.stopId },
        include: { trip: { select: { status: true } } },
      });
      if (!stop || stop.tripId !== dto.tripId) {
        throw new NotFoundException('La parada no pertenece a este viaje');
      }
      // Solo tiene sentido abordar en una parada mientras el bus está
      // efectivamente en ruta (si no, ese pasajero debería quedar en la
      // lista general del origen, sin stopId).
      if (stop.trip.status !== TripStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'Solo se pueden agregar pasajeros en una parada mientras el viaje está en curso',
        );
      }
      boardingStatus = BoardingStatus.BOARDED;
      checkedAt = new Date();
    }
    return this.prisma.passenger.create({
      data: { ...dto, boardingStatus, checkedAt },
      include: { stop: true },
    });
  }

  async checkIn(id: string, status: BoardingStatus) {
    const passenger = await this.prisma.passenger.findUnique({ where: { id } });
    if (!passenger) throw new NotFoundException('Pasajero no encontrado');

    return this.prisma.passenger.update({
      where: { id },
      data: { boardingStatus: status, checkedAt: new Date() },
      include: { stop: true },
    });
  }
}
