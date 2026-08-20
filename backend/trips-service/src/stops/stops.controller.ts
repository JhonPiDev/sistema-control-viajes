import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { InternalAuthGuard } from '../common/guards/internal-auth.guard';
import { StopsService } from './stops.service';
import { AddStopBodyDto } from '../common/dto/create-stop.dto';

@UseGuards(InternalAuthGuard)
@Controller()
export class StopsController {
  constructor(private readonly stopsService: StopsService) {}

  @Get('trips/:tripId/stops')
  findByTrip(@Param('tripId') tripId: string) {
    return this.stopsService.findByTrip(tripId);
  }

  @Post('trips/:tripId/stops')
  add(@Param('tripId') tripId: string, @Body() dto: AddStopBodyDto) {
    return this.stopsService.add(tripId, dto.city);
  }
}
