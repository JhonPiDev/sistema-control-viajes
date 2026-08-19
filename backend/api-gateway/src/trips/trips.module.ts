import { Module } from '@nestjs/common';
import { TripsController } from './trips.controller';
import { DriversController } from './drivers.controller';
import { AppClientsModule } from '../clients/clients.module';

@Module({
  imports: [AppClientsModule],
  controllers: [TripsController, DriversController],
})
export class TripsModule {}
