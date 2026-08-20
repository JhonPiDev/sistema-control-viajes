import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TripsClientService } from '../trips-client/trips-client.service';
import { CreateIncidentDto } from '../common/dto/create-incident.dto';

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tripsClient: TripsClientService,
  ) {}

  async create(dto: CreateIncidentDto) {
    await this.tripsClient.assertTripInProgress(dto.tripId);

    return this.prisma.incident.create({
      data: {
        tripId: dto.tripId,
        type: dto.type as any,
        description: dto.description,
        createdById: dto.createdById,
      },
    });
  }

  async findByTrip(tripId: string) {
    return this.prisma.incident.findMany({
      where: { tripId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Usado por el gateway al borrar un viaje (manual o por limpieza automática) */
  async deleteByTrip(tripId: string) {
    const { count } = await this.prisma.incident.deleteMany({ where: { tripId } });
    return { deleted: count };
  }
}
