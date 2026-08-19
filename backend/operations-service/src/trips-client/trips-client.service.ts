import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError } from 'rxjs';

/**
 * Comunicación inter-microservicio (TCP): operations-service consulta a
 * trips-service el estado real del viaje antes de permitir registrar un
 * gasto o una novedad. Esta es la regla de negocio:
 * "no reportar gastos de un viaje que no ha iniciado".
 */
@Injectable()
export class TripsClientService {
  constructor(@Inject('TRIPS_SERVICE') private readonly client: ClientProxy) {}

  async assertTripInProgress(tripId: string): Promise<void> {
    const trip = await firstValueFrom(
      this.client.send<{ id: string; status: string }>('trip.checkStatus', {
        id: tripId,
      }).pipe(
        timeout(5000),
        catchError(() => {
          throw new BadRequestException(
            'No fue posible validar el estado del viaje con trips-service',
          );
        }),
      ),
    );

    if (!trip) {
      throw new BadRequestException('El viaje referenciado no existe');
    }

    if (trip.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'No se pueden reportar gastos ni novedades de un viaje que no está en curso',
      );
    }
  }
}
