import { Module } from '@nestjs/common';
import { TripsController } from './trips.controller';
import { DriversController } from './drivers.controller';

@Module({
  controllers: [TripsController, DriversController],
})
export class TripsModule {}
