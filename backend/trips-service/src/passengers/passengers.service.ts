import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePassengerDto } from '../common/dto/create-passenger.dto';
import { BoardingStatus } from '@prisma/client';

@Injectable()
export class PassengersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTrip(tripId: string) {
    return this.prisma.passenger.findMany({
      where: { tripId },
      orderBy: { name: 'asc' },
    });
  }

  async add(dto: CreatePassengerDto) {
    return this.prisma.passenger.create({ data: dto });
  }

  async checkIn(id: string, status: BoardingStatus) {
    const passenger = await this.prisma.passenger.findUnique({ where: { id } });
    if (!passenger) throw new NotFoundException('Pasajero no encontrado');

    return this.prisma.passenger.update({
      where: { id },
      data: { boardingStatus: status, checkedAt: new Date() },
    });
  }
}
