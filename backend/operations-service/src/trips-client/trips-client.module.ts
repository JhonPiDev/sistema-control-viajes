import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TripsClientService } from './trips-client.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'TRIPS_SERVICE',
        useFactory: () => ({
          transport: Transport.TCP,
          options: {
            host: process.env.TRIPS_SERVICE_HOST || 'trips-service',
            port: parseInt(process.env.TRIPS_SERVICE_PORT || '3001', 10),
          },
        }),
      },
    ]),
  ],
  providers: [TripsClientService],
  exports: [TripsClientService],
})
export class TripsClientModule {}
