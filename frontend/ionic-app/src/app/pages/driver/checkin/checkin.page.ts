import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonIcon, IonSpinner,
  AlertController, ToastController, Platform,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline, closeOutline, personOutline, arrowBackOutline } from 'ionicons/icons';
import { PassengersService } from '../../../core/services/passengers.service';
import { Passenger, BoardingStatus } from '../../../core/models/models';
import { PhoneShellComponent } from '../../../shared/components/phone-shell.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';

@Component({
  selector: 'app-checkin',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, PhoneShellComponent, EmptyStateComponent],
  template: `
    <ion-content>
      <app-phone-shell title="Check-in de pasajeros" (back)="attemptLeave()">
      @if (loading()) {
        <app-empty-state loading></app-empty-state>
      } @else {
        @if (pendingCount() > 0) {
          <p class="hint">Marca a todos los pasajeros (abordó o no se presentó) para volver a Mi Viaje.</p>
        }
        <div class="stat-chip-row">
          <span class="stat-chip stat-chip--success"><ion-icon name="checkmark-outline"></ion-icon>{{ boardedCount() }} abordaron</span>
          <span class="stat-chip stat-chip--danger"><ion-icon name="close-outline"></ion-icon>{{ absentCount() }} ausentes</span>
          <span class="stat-chip stat-chip--medium"><ion-icon name="person-outline"></ion-icon>{{ pendingCount() }} pendientes</span>
        </div>

        @for (p of passengers(); track p.id) {
          <div class="passenger-card">
            <div class="passenger-avatar">
              <ion-icon name="person-outline"></ion-icon>
            </div>
            <div class="passenger-text">
              <div class="passenger-name">{{ p.name }}</div>
              <div class="passenger-doc">{{ p.document }}</div>
              <div class="passenger-status" [class]="'passenger-status is-' + p.boardingStatus.toLowerCase()">
                {{ label(p.boardingStatus) }} · {{ p.stop?.city ? 'Aborda en ' + p.stop!.city : 'Aborda en el origen' }}
              </div>
            </div>
            <button
              type="button"
              class="round-btn round-btn--board"
              [class.is-on]="p.boardingStatus === 'BOARDED'"
              (click)="setStatus(p, 'BOARDED')"
              aria-label="Marcar como abordó">
              <ion-icon name="checkmark-outline"></ion-icon>
            </button>
            <button
              type="button"
              class="round-btn round-btn--absent"
              [class.is-on]="p.boardingStatus === 'ABSENT'"
              (click)="setStatus(p, 'ABSENT')"
              aria-label="Marcar como no se presentó">
              <ion-icon name="close-outline"></ion-icon>
            </button>
          </div>
        }
      }
      </app-phone-shell>
    </ion-content>
  `,
  styles: [`
    .hint {
      color: var(--app-color-text-muted);
      font-size: 0.8rem;
      margin: 0 0 14px;
    }

    /* Tarjeta de pasajero del mockup: avatar + datos + 2 botones redondos */
    .passenger-card {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--app-color-surface);
      border: 1px solid var(--app-color-border);
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 10px;
    }
    .passenger-avatar {
      width: 36px; height: 36px;
      flex-shrink: 0;
      border-radius: 50%;
      background: var(--app-color-background);
      color: var(--app-color-text-subtle);
      display: flex; align-items: center; justify-content: center;
      ion-icon { font-size: 17px; }
    }
    .passenger-text { flex: 1; min-width: 0; }
    .passenger-name { font-size: 0.875rem; font-weight: 700; }
    .passenger-doc { font-size: 0.75rem; color: var(--app-color-text-subtle); }
    .passenger-status {
      font-size: 0.72rem;
      font-weight: 600;
      margin-top: 2px;
      color: var(--app-color-text-muted);
      &.is-boarded { color: var(--app-color-success); }
      &.is-absent { color: var(--app-color-danger); }
    }

    .round-btn {
      width: 38px; height: 38px;
      flex-shrink: 0;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      border: 1px solid transparent;
      transition: background var(--app-transition-fast), border-color var(--app-transition-fast);
      ion-icon { font-size: 17px; }
    }
    /* Sin marcar quedan tenues; al marcarlos toman su color pleno. */
    .round-btn--board {
      background: rgba(var(--app-color-success-rgb), .12);
      color: var(--app-color-success);
      &.is-on { background: var(--app-color-success); color: #fff; }
    }
    .round-btn--absent {
      background: var(--app-color-surface);
      border-color: rgba(var(--app-color-danger-rgb), .45);
      color: var(--app-color-danger);
      &.is-on { background: var(--app-color-danger); border-color: var(--app-color-danger); color: #fff; }
    }
  `],
})
export class CheckinPage implements OnInit, OnDestroy {
  passengers = signal<Passenger[]>([]);
  loading = signal(true);
  private tripId = '';
  private backButtonSub?: { unsubscribe: () => void };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private passengersService: PassengersService,
    private alertController: AlertController,
    private toastController: ToastController,
    private platform: Platform,
  ) {
    addIcons({ checkmarkOutline, closeOutline, personOutline, arrowBackOutline });
  }

  async ngOnInit() {
    this.tripId = this.route.snapshot.paramMap.get('id')!;
    this.passengers.set(await this.passengersService.findByTrip(this.tripId));
    this.loading.set(false);

    // Intercepta el botón físico de volver de Android: mientras falten
    // pasajeros por marcar, no deja salir de la pantalla.
    this.backButtonSub = this.platform.backButton.subscribeWithPriority(10, (processNextHandler) => {
      if (this.pendingCount() > 0) {
        this.showIncompleteAlert();
      } else {
        processNextHandler();
      }
    });
  }

  ngOnDestroy() {
    this.backButtonSub?.unsubscribe();
  }

  label(status: BoardingStatus) {
    return status === 'BOARDED' ? 'Abordó' : status === 'ABSENT' ? 'No se presentó' : 'Pendiente';
  }

  boardedCount() {
    return this.passengers().filter((p) => p.boardingStatus === 'BOARDED').length;
  }
  absentCount() {
    return this.passengers().filter((p) => p.boardingStatus === 'ABSENT').length;
  }
  pendingCount() {
    return this.passengers().filter((p) => p.boardingStatus === 'PENDING').length;
  }

  /** Botón de volver del header: mismo bloqueo que el físico, mientras falten pasajeros por marcar. */
  async attemptLeave() {
    if (this.pendingCount() > 0) {
      await this.showIncompleteAlert();
      return;
    }
    this.router.navigate(['/driver/my-trip', this.tripId]);
  }

  private async showIncompleteAlert() {
    const alert = await this.alertController.create({
      header: 'Check-in incompleto',
      message: `Aún faltan ${this.pendingCount()} pasajero(s) por marcar como abordado o no presentado. Termina de marcarlos a todos para poder salir de esta pantalla.`,
      buttons: ['Entendido'],
    });
    await alert.present();
  }

  async setStatus(p: Passenger, status: BoardingStatus) {
    const updated = await this.passengersService.checkIn(p.id, status);
    this.passengers.update((list) => list.map((x) => (x.id === p.id ? updated : x)));

    // Ya se marcó el último pasajero: check-in completo, vuelve solo.
    if (this.pendingCount() === 0) {
      const toast = await this.toastController.create({
        message: 'Check-in completo. Volviendo a Mi Viaje...',
        duration: 1200,
        color: 'success',
        position: 'top',
      });
      await toast.present();
      setTimeout(() => this.router.navigate(['/driver/my-trip', this.tripId]), 900);
    }
  }
}
