import { Module } from '@nestjs/common';
import { PassengersController } from './passengers.controller';
import { AppClientsModule } from '../clients/clients.module';

@Module({
  imports: [AppClientsModule],
  controllers: [PassengersController],
})
export class PassengersModule {}
