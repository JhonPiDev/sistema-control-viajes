import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { InternalAuthGuard } from '../common/guards/internal-auth.guard';
import { TripsService } from './trips.service';
import { CreateTripDto } from '../common/dto/create-trip.dto';

@UseGuards(InternalAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  create(@Body() dto: CreateTripDto) {
    return this.tripsService.create(dto);
  }

  // No se usa @Query() con la clase PaginationDto aquí a propósito: el
  // ValidationPipe global (whitelist + forbidNonWhitelisted) rechazaría la
  // petición completa por traer "driverId", que esa clase no declara. La
  // validación "real" de estos parámetros ya la hace el api-gateway antes
  // de reenviar la llamada; aquí solo se parsean con valores por defecto.
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tripsService.findOne(id);
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
