import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TripsClientService } from '../trips-client/trips-client.service';
import { CreateExpenseDto } from '../common/dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tripsClient: TripsClientService,
  ) {}

  async create(dto: CreateExpenseDto) {
    // Regla de negocio transaccional: valida contra trips-service antes de escribir
    await this.tripsClient.assertTripInProgress(dto.tripId);

    return this.prisma.expense.create({
      data: {
        tripId: dto.tripId,
        type: dto.type as any,
        amount: dto.amount,
        concept: dto.concept,
        createdById: dto.createdById,
      },
    });
  }

  async findByTrip(tripId: string) {
    return this.prisma.expense.findMany({
      where: { tripId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async totalByTrip(tripId: string) {
    const result = await this.prisma.expense.aggregate({
      where: { tripId },
      _sum: { amount: true },
      _count: true,
    });
    return {
      total: result._sum.amount ?? 0,
      count: result._count,
    };
  }

  /** Usado por el gateway al borrar un viaje (manual o por limpieza automática) */
  async deleteByTrip(tripId: string) {
    const { count } = await this.prisma.expense.deleteMany({ where: { tripId } });
    return { deleted: count };
  }
}
