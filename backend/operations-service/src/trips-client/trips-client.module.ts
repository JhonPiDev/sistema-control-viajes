import { Module } from '@nestjs/common';
import { TripsClientService } from './trips-client.service';

@Module({
  providers: [TripsClientService],
  exports: [TripsClientService],
})
export class TripsClientModule {}
