import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { callService } from '../common/rpc.helper';
import { TRIPS_SERVICE_URL, OPERATIONS_SERVICE_URL } from '../common/service-urls';

/**
 * Borra un viaje "en cascada" a través de los tres servicios:
 *  - operations-service: gastos y novedades del viaje (no tienen FK real
 *    porque viven en otra base de datos, así que hay que borrarlos a mano
 *    ANTES de borrar el viaje, o quedarían huérfanos).
 *  - trips-service: el viaje en sí (pasajeros y paradas se van en cascada
 *    por la relación de Prisma).
 * La usa tanto el borrado manual del admin (TripsController) como la tarea
 * programada de limpieza automática de este mismo archivo.
 */
@Injectable()
export class TripsCleanupService {
  private readonly logger = new Logger(TripsCleanupService.name);

  async deleteTripCascade(tripId: string): Promise<void> {
    await Promise.all([
      callService(OPERATIONS_SERVICE_URL, 'DELETE', `/expenses/trip/${tripId}`),
      callService(OPERATIONS_SERVICE_URL, 'DELETE', `/incidents/trip/${tripId}`),
    ]);
    await callService(TRIPS_SERVICE_URL, 'DELETE', `/trips/${tripId}`);
  }

  /**
   * Limpieza automática: una vez al día borra los viajes FINALIZADOS hace
   * más de TRIP_RETENTION_DAYS días (90 por defecto), para no acumular
   * indefinidamente datos históricos en el plan gratuito de Postgres.
   * Los viajes PENDIENTES o EN RUTA nunca se tocan, sin importar la fecha.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredTrips() {
    const days = Number(process.env.TRIP_RETENTION_DAYS) > 0
      ? Number(process.env.TRIP_RETENTION_DAYS)
      : 90;
    try {
      const expired = await callService<{ id: string }[]>(
        TRIPS_SERVICE_URL, 'GET', `/trips/expired?days=${days}`,
      );
      if (!expired.length) return;
      this.logger.log(`Limpieza automática: borrando ${expired.length} viaje(s) finalizados hace más de ${days} días`);
      for (const trip of expired) {
        try {
          await this.deleteTripCascade(trip.id);
        } catch (err: any) {
          this.logger.error(`No se pudo borrar el viaje ${trip.id}: ${err?.message || err}`);
        }
      }
    } catch (err: any) {
      this.logger.error(`Falló la limpieza automática de viajes: ${err?.message || err}`);
    }
  }
}
