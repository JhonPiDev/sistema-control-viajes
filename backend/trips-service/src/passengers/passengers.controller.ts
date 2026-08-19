import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { InternalAuthGuard } from '../common/guards/internal-auth.guard';
import { PassengersService } from './passengers.service';
import { AddPassengerBodyDto } from '../common/dto/create-passenger.dto';
import { BoardingStatus } from '@prisma/client';

@UseGuards(InternalAuthGuard)
@Controller()
export class PassengersController {
  constructor(private readonly passengersService: PassengersService) {}

  @Get('trips/:tripId/passengers')
  findByTrip(@Param('tripId') tripId: string) {
    return this.passengersService.findByTrip(tripId);
  }

  @Post('trips/:tripId/passengers')
  add(@Param('tripId') tripId: string, @Body() dto: AddPassengerBodyDto) {
    return this.passengersService.add({ ...dto, tripId });
  }

  @Patch('passengers/:id/check-in')
  checkIn(@Param('id') id: string, @Body() body: { status: BoardingStatus }) {
    return this.passengersService.checkIn(id, body.status);
  }
}
