import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { AppClientsModule } from '../clients/clients.module';

@Module({
  imports: [AppClientsModule],
  controllers: [ReportsController],
})
export class ReportsModule {}
