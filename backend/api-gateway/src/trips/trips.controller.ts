import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { sendRpc } from '../common/rpc.helper';
import { CreateTripDto } from './dto/create-trip.dto';
import { SignatureDto } from './dto/signature.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('trips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trips')
export class TripsController {
  constructor(@Inject('TRIPS_SERVICE') private readonly tripsClient: ClientProxy) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateTripDto, @CurrentUser() user: CurrentUserPayload) {
    return sendRpc(this.tripsClient, 'trip.create', {
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
    // Un conductor solo ve sus propios viajes; el admin ve todos
    const driverId = user.role === 'DRIVER' ? user.id : undefined;
    return sendRpc(this.tripsClient, 'trip.findAll', { pagination, driverId });
  }

  @Get(':id')
  @Roles('ADMIN', 'DRIVER')
  findOne(@Param('id') id: string) {
    return sendRpc(this.tripsClient, 'trip.findOne', { id });
  }

  @Post(':id/signature')
  @Roles('DRIVER')
  saveSignature(@Param('id') id: string, @Body() dto: SignatureDto) {
    return sendRpc(this.tripsClient, 'trip.saveSignature', {
      id,
      signatureData: dto.signatureData,
    });
  }

  @Post(':id/start')
  @Roles('DRIVER')
  start(@Param('id') id: string) {
    return sendRpc(this.tripsClient, 'trip.start', { id });
  }

  @Post(':id/finish')
  @Roles('DRIVER')
  finish(@Param('id') id: string) {
    return sendRpc(this.tripsClient, 'trip.finish', { id });
  }
}
