import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { callService } from '../common/rpc.helper';
import { TRIPS_SERVICE_URL, OPERATIONS_SERVICE_URL } from '../common/service-urls';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trips/:tripId/report')
export class ReportsController {
  /**
   * Reporte resumen de cierre de viaje. Agrega datos de AMBOS microservicios:
   *  - trips-service: pasajeros transportados / viaje
   *  - operations-service: total de gastos y listado de novedades
   * Esta es la orquestación típica de un API Gateway sobre una arquitectura
   * de microservicios.
   */
  @Get()
  @Roles('ADMIN', 'DRIVER')
  async getReport(@Param('tripId') tripId: string) {
    const [summary, expenses, incidents] = await Promise.all([
      callService<any>(TRIPS_SERVICE_URL, 'GET', `/trips/${tripId}/summary`),
      callService<any>(OPERATIONS_SERVICE_URL, 'GET', `/expenses/trip/${tripId}/total`),
      callService<any>(OPERATIONS_SERVICE_URL, 'GET', `/incidents/trip/${tripId}`),
    ]);

    return {
      trip: {
        id: summary.trip.id,
        name: summary.trip.name,
        origin: summary.trip.origin,
        destination: summary.trip.destination,
        status: summary.trip.status,
        driver: summary.trip.driver,
        startedAt: summary.trip.startedAt,
        finishedAt: summary.trip.finishedAt,
      },
      passengers: {
        total: summary.passengersTotal,
        boarded: summary.passengersBoarded,
        list: summary.trip.passengers,
      },
      expenses: {
        total: expenses.total,
        count: expenses.count,
      },
      incidents: {
        total: incidents.length,
        list: incidents,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}
