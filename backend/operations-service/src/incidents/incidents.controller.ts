import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from '../common/dto/create-incident.dto';

@Controller()
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @MessagePattern('incident.create')
  create(@Payload() dto: CreateIncidentDto) {
    return this.incidentsService.create(dto);
  }

  @MessagePattern('incident.findByTrip')
  findByTrip(@Payload() data: { tripId: string }) {
    return this.incidentsService.findByTrip(data.tripId);
  }
}
