import { Module } from '@nestjs/common';
import { IncidentsController } from './incidents.controller';
import { AppClientsModule } from '../clients/clients.module';

@Module({
  imports: [AppClientsModule],
  controllers: [IncidentsController],
})
export class IncidentsModule {}
