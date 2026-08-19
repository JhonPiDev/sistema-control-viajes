import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { callService } from '../common/rpc.helper';
import { OPERATIONS_SERVICE_URL } from '../common/service-urls';
import { CreateIncidentDto } from './dto/create-incident.dto';

@ApiTags('incidents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trips/:tripId/incidents')
export class IncidentsController {
  @Post()
  @Roles('DRIVER')
  create(
    @Param('tripId') tripId: string,
    @Body() dto: CreateIncidentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return callService(OPERATIONS_SERVICE_URL, 'POST', '/incidents', {
      tripId,
      ...dto,
      createdById: user.id,
    });
  }

  @Get()
  @Roles('ADMIN', 'DRIVER')
  findByTrip(@Param('tripId') tripId: string) {
    return callService(OPERATIONS_SERVICE_URL, 'GET', `/incidents/trip/${tripId}`);
  }
}
