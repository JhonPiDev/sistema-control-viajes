import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StopsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTrip(tripId: string) {
    return this.prisma.stop.findMany({
      where: { tripId },
      orderBy: { order: 'asc' },
    });
  }

  async add(tripId: string, city: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Viaje no encontrado');

    const last = await this.prisma.stop.findFirst({
      where: { tripId },
      orderBy: { order: 'desc' },
    });
    const nextOrder = (last?.order ?? 0) + 1;

    return this.prisma.stop.create({
      data: { tripId, city, order: nextOrder },
    });
  }
}
