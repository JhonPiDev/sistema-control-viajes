import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { callService } from '../common/rpc.helper';
import { TRIPS_SERVICE_URL } from '../common/service-urls';
import { CreateTripDto } from './dto/create-trip.dto';
import { SignatureDto } from './dto/signature.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('trips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trips')
export class TripsController {
  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateTripDto, @CurrentUser() user: CurrentUserPayload) {
    return callService(TRIPS_SERVICE_URL, 'POST', '/trips', {
      ...dto,
      createdById: user.id,
    });
  }

  @Get()
  @Roles('ADMIN', 'DRIVER')
  findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const driverId = user.role === 'DRIVER' ? user.id : undefined;
    const params = new URLSearchParams({
      page: String(pagination.page),
      limit: String(pagination.limit),
    });
    if (pagination.status) params.set('status', pagination.status);
    if (driverId) params.set('driverId', driverId);
    return callService(TRIPS_SERVICE_URL, 'GET', `/trips?${params.toString()}`);
  }

  @Get(':id')
  @Roles('ADMIN', 'DRIVER')
  findOne(@Param('id') id: string) {
    return callService(TRIPS_SERVICE_URL, 'GET', `/trips/${id}`);
  }

  @Post(':id/signature')
  @Roles('DRIVER')
  saveSignature(@Param('id') id: string, @Body() dto: SignatureDto) {
    return callService(TRIPS_SERVICE_URL, 'POST', `/trips/${id}/signature`, {
      signatureData: dto.signatureData,
    });
  }

  @Post(':id/start')
  @Roles('DRIVER')
  start(@Param('id') id: string) {
    return callService(TRIPS_SERVICE_URL, 'POST', `/trips/${id}/start`);
  }

  @Post(':id/finish')
  @Roles('DRIVER')
  finish(@Param('id') id: string) {
    return callService(TRIPS_SERVICE_URL, 'POST', `/trips/${id}/finish`);
  }
}
