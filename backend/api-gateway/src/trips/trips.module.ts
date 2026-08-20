import { Module } from '@nestjs/common';
import { TripsController } from './trips.controller';
import { DriversController } from './drivers.controller';
import { TripsCleanupService } from './trips-cleanup.service';

@Module({
  controllers: [TripsController, DriversController],
  providers: [TripsCleanupService],
})
export class TripsModule {}
