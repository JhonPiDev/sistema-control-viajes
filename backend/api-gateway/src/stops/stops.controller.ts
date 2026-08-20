import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { callService } from '../common/rpc.helper';
import { TRIPS_SERVICE_URL } from '../common/service-urls';
import { CreateStopDto } from './dto/create-stop.dto';

@ApiTags('stops')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class StopsController {
  @Get('trips/:tripId/stops')
  @Roles('ADMIN', 'DRIVER')
  findByTrip(@Param('tripId') tripId: string) {
    return callService(TRIPS_SERVICE_URL, 'GET', `/trips/${tripId}/stops`);
  }

  // Las paradas del viaje normalmente se definen al crearlo (ver
  // CreateTripDto.stops), esto es para agregarlas después si hace falta.
  @Post('trips/:tripId/stops')
  @Roles('ADMIN')
  add(@Param('tripId') tripId: string, @Body() dto: CreateStopDto) {
    return callService(TRIPS_SERVICE_URL, 'POST', `/trips/${tripId}/stops`, dto);
  }
}
