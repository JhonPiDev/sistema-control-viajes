import { Body, Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { sendRpc } from '../common/rpc.helper';
import { CreateIncidentDto } from './dto/create-incident.dto';

@ApiTags('incidents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trips/:tripId/incidents')
export class IncidentsController {
  constructor(
    @Inject('OPERATIONS_SERVICE') private readonly operationsClient: ClientProxy,
  ) {}

  @Post()
  @Roles('DRIVER')
  create(
    @Param('tripId') tripId: string,
    @Body() dto: CreateIncidentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return sendRpc(this.operationsClient, 'incident.create', {
      tripId,
      ...dto,
      createdById: user.id,
    });
  }

  @Get()
  @Roles('ADMIN', 'DRIVER')
  findByTrip(@Param('tripId') tripId: string) {
    return sendRpc(this.operationsClient, 'incident.findByTrip', { tripId });
  }
}
