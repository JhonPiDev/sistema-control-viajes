import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { AppClientsModule } from '../clients/clients.module';

@Module({
  imports: [AppClientsModule],
  controllers: [ExpensesController],
})
export class ExpensesModule {}
