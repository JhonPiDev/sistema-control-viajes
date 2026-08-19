import { BadRequestException, Injectable } from '@nestjs/common';

/**
 * Comunicación inter-microservicio (ahora por HTTP, no TCP):
 * operations-service consulta a trips-service el estado real del viaje
 * antes de permitir registrar un gasto o una novedad. Esta es la regla de
 * negocio: "no reportar gastos de un viaje que no ha iniciado".
 */
@Injectable()
export class TripsClientService {
  private readonly baseUrl =
    process.env.TRIPS_SERVICE_URL || 'http://trips-service:3001';

  async assertTripInProgress(tripId: string): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/trips/${tripId}/status`, {
        headers: { 'x-internal-key': process.env.INTERNAL_API_KEY || '' },
        signal: controller.signal,
      });
    } catch {
      throw new BadRequestException(
        'No fue posible validar el estado del viaje con trips-service',
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status === 404) {
      throw new BadRequestException('El viaje referenciado no existe');
    }
    if (!response.ok) {
      throw new BadRequestException(
        'No fue posible validar el estado del viaje con trips-service',
      );
    }

    const trip = (await response.json()) as { status: string };
    if (trip.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'No se pueden reportar gastos ni novedades de un viaje que no está en curso',
      );
    }
  }
}
