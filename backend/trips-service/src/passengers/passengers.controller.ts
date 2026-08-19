import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PassengersService } from './passengers.service';
import { CreatePassengerDto } from '../common/dto/create-passenger.dto';
import { BoardingStatus } from '@prisma/client';

@Controller()
export class PassengersController {
  constructor(private readonly passengersService: PassengersService) {}

  @MessagePattern('passenger.findByTrip')
  findByTrip(@Payload() data: { tripId: string }) {
    return this.passengersService.findByTrip(data.tripId);
  }

  @MessagePattern('passenger.add')
  add(@Payload() dto: CreatePassengerDto) {
    return this.passengersService.add(dto);
  }

  @MessagePattern('passenger.checkIn')
  checkIn(@Payload() data: { id: string; status: BoardingStatus }) {
    return this.passengersService.checkIn(data.id, data.status);
  }
}
