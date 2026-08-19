import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { sendRpc } from '../common/rpc.helper';
import { CreatePassengerDto } from './dto/create-passenger.dto';
import { CheckInDto } from './dto/check-in.dto';

@ApiTags('passengers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PassengersController {
  constructor(@Inject('TRIPS_SERVICE') private readonly tripsClient: ClientProxy) {}

  @Get('trips/:tripId/passengers')
  @Roles('ADMIN', 'DRIVER')
  findByTrip(@Param('tripId') tripId: string) {
    return sendRpc(this.tripsClient, 'passenger.findByTrip', { tripId });
  }

  @Post('trips/:tripId/passengers')
  @Roles('ADMIN')
  add(@Param('tripId') tripId: string, @Body() dto: CreatePassengerDto) {
    return sendRpc(this.tripsClient, 'passenger.add', { tripId, ...dto });
  }

  @Patch('passengers/:id/check-in')
  @Roles('DRIVER')
  checkIn(@Param('id') id: string, @Body() dto: CheckInDto) {
    return sendRpc(this.tripsClient, 'passenger.checkIn', {
      id,
      status: dto.status,
    });
  }
}
