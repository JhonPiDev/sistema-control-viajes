import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { InternalAuthGuard } from '../common/guards/internal-auth.guard';
import { TripsService } from './trips.service';
import { CreateTripDto } from '../common/dto/create-trip.dto';
import { UpdateTripDto } from '../common/dto/update-trip.dto';

@UseGuards(InternalAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  create(@Body() dto: CreateTripDto) {
    return this.tripsService.create(dto);
  }

  // Sin @Query(PaginationDto): esa clase no declara "driverId" y el
  // ValidationPipe (whitelist) rechazaría la petición. La validación real
  // ya la hizo el api-gateway; aquí solo se parsea con defaults.
  @Get()
  findAll(
    @Query('page') pageRaw?: string,
    @Query('limit') limitRaw?: string,
    @Query('status') status?: string,
    @Query('driverId') driverId?: string,
  ) {
    const page = Number(pageRaw) > 0 ? Number(pageRaw) : 1;
    const limit = Number(limitRaw) > 0 ? Number(limitRaw) : 10;
    return this.tripsService.findAll({ page, limit, status }, driverId);
  }

  // Declarado ANTES de ":id" a propósito: si no, Nest interpretaría
  // "stats" como el parámetro :id de la ruta de abajo.
  @Get('stats')
  getStats(@Query('driverId') driverId?: string) {
    return this.tripsService.getStats(driverId);
  }

  // Igual que "stats": declarado antes de ":id" para que Nest no lo
  // confunda con el parámetro de ruta. Usado por la tarea programada de
  // limpieza automática en el gateway.
  @Get('expired')
  findExpired(@Query('days') daysRaw?: string) {
    const days = Number(daysRaw) > 0 ? Number(daysRaw) : 90;
    return this.tripsService.findExpired(days);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tripsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTripDto) {
    return this.tripsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tripsService.remove(id);
  }

  // Usado por operations-service para validar la regla de negocio "no
  // reportar gastos/novedades de un viaje que no está en curso" sin tener
  // que traer el objeto completo del viaje.
  @Get(':id/status')
  checkStatus(@Param('id') id: string) {
    return this.tripsService.checkStatus(id);
  }

  @Post(':id/signature')
  saveSignature(@Param('id') id: string, @Body() body: { signatureData: string }) {
    return this.tripsService.saveSignature(id, body.signatureData);
  }

  @Post(':id/start')
  start(@Param('id') id: string) {
    return this.tripsService.start(id);
  }

  @Post(':id/finish')
  finish(@Param('id') id: string) {
    return this.tripsService.finish(id);
  }

  @Get(':id/summary')
  getSummary(@Param('id') id: string) {
    return this.tripsService.getSummary(id);
  }
}
