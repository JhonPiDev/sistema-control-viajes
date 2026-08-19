import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { TripsClientModule } from './trips-client/trips-client.module';
import { ExpensesModule } from './expenses/expenses.module';
import { IncidentsModule } from './incidents/incidents.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TripsClientModule,
    ExpensesModule,
    IncidentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
