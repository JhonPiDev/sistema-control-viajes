import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { InternalAuthGuard } from '../common/guards/internal-auth.guard';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from '../common/dto/create-incident.dto';

@UseGuards(InternalAuthGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  create(@Body() dto: CreateIncidentDto) {
    return this.incidentsService.create(dto);
  }

  @Get('trip/:tripId')
  findByTrip(@Param('tripId') tripId: string) {
    return this.incidentsService.findByTrip(tripId);
  }
}
