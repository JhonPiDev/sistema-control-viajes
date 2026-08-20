import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { TripsModule } from './trips/trips.module';
import { PassengersModule } from './passengers/passengers.module';
import { StopsModule } from './stops/stops.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    TripsModule,
    PassengersModule,
    StopsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
