import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TripsService } from './trips.service';
import { CreateTripDto } from '../common/dto/create-trip.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller()
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @MessagePattern('trip.create')
  create(@Payload() dto: CreateTripDto) {
    return this.tripsService.create(dto);
  }

  @MessagePattern('trip.findAll')
  findAll(@Payload() data: { pagination: PaginationDto; driverId?: string }) {
    return this.tripsService.findAll(data.pagination, data.driverId);
  }

  @MessagePattern('trip.findOne')
  findOne(@Payload() data: { id: string }) {
    return this.tripsService.findOne(data.id);
  }

  @MessagePattern('trip.checkStatus')
  checkStatus(@Payload() data: { id: string }) {
    return this.tripsService.checkStatus(data.id);
  }

  @MessagePattern('trip.saveSignature')
  saveSignature(@Payload() data: { id: string; signatureData: string }) {
    return this.tripsService.saveSignature(data.id, data.signatureData);
  }

  @MessagePattern('trip.start')
  start(@Payload() data: { id: string }) {
    return this.tripsService.start(data.id);
  }

  @MessagePattern('trip.finish')
  finish(@Payload() data: { id: string }) {
    return this.tripsService.finish(data.id);
  }

  @MessagePattern('trip.getSummary')
  getSummary(@Payload() data: { id: string }) {
    return this.tripsService.getSummary(data.id);
  }
}
