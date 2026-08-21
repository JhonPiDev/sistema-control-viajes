import { Component, Input, signal } from '@angular/core';
import { TripStatus, BoardingStatus, Passenger } from '../../core/models/models';

export type PillTone = 'pending' | 'progress' | 'done' | 'absent';

const TRIP_TONE: Record<TripStatus, PillTone> = {
  PENDING: 'pending',
  IN_PROGRESS: 'progress',
  FINISHED: 'done',
};

const BOARDING_TONE: Record<BoardingStatus, PillTone> = {
  PENDING: 'pending',
  BOARDED: 'done',
  ABSENT: 'absent',
};

/**
 * Píldora de estado. Recibe el estado del dominio (no un color), para que la
 * correspondencia estado → tono → texto viva en un solo sitio.
 *
 *   <app-status-pill [trip]="trip.status"></app-status-pill>
 *   <app-status-pill [trip]="t.status" pendingLabel="Por iniciar"></app-status-pill>
 *   <app-status-pill [boarding]="passenger"></app-status-pill>
 */
@Component({
  selector: 'app-status-pill',
  standalone: true,
  template: `<span class="status-pill" [class]="'status-pill status-pill--' + tone()">{{ text() }}</span>`,
})
export class StatusPillComponent {
  readonly tone = signal<PillTone>('pending');
  readonly text = signal<string>('');

  /** Etiqueta para el estado PENDING de un viaje ("Pendiente" o "Por iniciar"). */
  @Input() pendingLabel = 'Pendiente';

  /** Estado de un viaje. */
  @Input() set trip(status: TripStatus | undefined | null) {
    if (!status) return;
    this.tone.set(TRIP_TONE[status]);
    this.text.set(
      status === 'PENDING' ? this.pendingLabel : status === 'IN_PROGRESS' ? 'En ruta' : 'Finalizado',
    );
  }

  /** Pasajero: cómo terminó su abordaje, nombrando la parada si aplica. */
  @Input() set boarding(p: Passenger | undefined | null) {
    if (!p) return;
    this.tone.set(BOARDING_TONE[p.boardingStatus]);
    this.text.set(
      p.boardingStatus === 'BOARDED'
        ? p.stop
          ? `Abordó en ${p.stop.city}`
          : 'Abordó en el origen'
        : p.boardingStatus === 'ABSENT'
          ? 'No se presentó'
          // Pendiente: se nombra dónde debe subir, que es el dato accionable.
          : p.stop
            ? `Sube en ${p.stop.city}`
            : 'Pendiente en el origen',
    );
  }
}
