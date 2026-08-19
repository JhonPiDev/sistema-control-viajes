import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { callService } from '../common/rpc.helper';
import { TRIPS_SERVICE_URL } from '../common/service-urls';
import { CreatePassengerDto } from './dto/create-passenger.dto';
import { CheckInDto } from './dto/check-in.dto';

@ApiTags('passengers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PassengersController {
  @Get('trips/:tripId/passengers')
  @Roles('ADMIN', 'DRIVER')
  findByTrip(@Param('tripId') tripId: string) {
    return callService(TRIPS_SERVICE_URL, 'GET', `/trips/${tripId}/passengers`);
  }

  @Post('trips/:tripId/passengers')
  @Roles('ADMIN')
  add(@Param('tripId') tripId: string, @Body() dto: CreatePassengerDto) {
    return callService(TRIPS_SERVICE_URL, 'POST', `/trips/${tripId}/passengers`, dto);
  }

  @Patch('passengers/:id/check-in')
  @Roles('DRIVER')
  checkIn(@Param('id') id: string, @Body() dto: CheckInDto) {
    return callService(TRIPS_SERVICE_URL, 'PATCH', `/passengers/${id}/check-in`, {
      status: dto.status,
    });
  }
}
