import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

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
      {
        name: 'OPERATIONS_SERVICE',
        useFactory: () => ({
          transport: Transport.TCP,
          options: {
            host: process.env.OPERATIONS_SERVICE_HOST || 'operations-service',
            port: parseInt(process.env.OPERATIONS_SERVICE_PORT || '3002', 10),
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class AppClientsModule {}
