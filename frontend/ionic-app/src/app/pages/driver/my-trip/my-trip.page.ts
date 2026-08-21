import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
  IonBadge, IonSpinner, IonRefresher, IonRefresherContent, IonList, IonItem,
  IonLabel, IonAvatar, AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  settingsOutline, peopleOutline, createOutline, playOutline, navigateOutline,
  flagOutline, checkmarkDoneOutline, busOutline, lockClosedOutline,
} from 'ionicons/icons';
import { TripsService } from '../../../core/services/trips.service';
import { Trip, TripStatus } from '../../../core/models/models';

const STATUS_LABEL: Record<TripStatus, string> = {
  PENDING: 'Por iniciar',
  IN_PROGRESS: 'En ruta',
  FINISHED: 'Finalizado',
};
const STATUS_COLOR: Record<TripStatus, string> = {
  PENDING: 'medium',
  IN_PROGRESS: 'warning',
  FINISHED: 'success',
};

@Component({
  selector: 'app-my-trip',
  standalone: true,
  imports: [
    CommonModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonButton, IonIcon, IonBadge, IonSpinner, IonRefresher, IonRefresherContent,
    IonList, IonItem, IonLabel, IonAvatar,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Mi Viaje</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/driver/settings">
            <ion-icon slot="icon-only" name="settings-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (loading()) {
        <div class="empty-state"><ion-spinner></ion-spinner></div>
      } @else if (!trip() && chooser().length > 1) {
        <p class="chooser-hint">Tienes {{ chooser().length }} viajes activos. Elige uno para continuar:</p>
        <ion-list class="list-cards">
          @for (t of chooser(); track t.id) {
            <ion-item (click)="onChooseTrip(t)" button detail="true" lines="none">
              <ion-avatar slot="start" class="trip-avatar" [style.background]="avatarBg(t.status)">
                <ion-icon name="bus-outline"></ion-icon>
              </ion-avatar>
              <ion-label>
                <h2>{{ t.name }}</h2>
                <p>{{ t.origin }} → {{ t.destination }}</p>
                <p>{{ t.passengers.length }} pasajeros</p>
              </ion-label>
              <ion-badge slot="end" [color]="STATUS_COLOR[t.status]">{{ STATUS_LABEL[t.status] }}</ion-badge>
            </ion-item>
          }
        </ion-list>
      } @else if (!trip()) {
        <div class="empty-state">
          <ion-icon name="navigate-outline"></ion-icon>
          <p>No tienes ningún viaje asignado por ahora.</p>
        </div>
      } @else {
        @if (chooser().length > 1) {
          <ion-button fill="clear" size="small" routerLink="/driver/my-trip" class="back-to-list">
            ← Ver mis {{ chooser().length }} viajes
          </ion-button>
        }
        <div class="hero-card">
          <ion-badge style="--background:rgba(255,255,255,.2); color:#fff;">
            {{ trip()!.status === 'PENDING' ? 'Por iniciar' : 'En ruta' }}
          </ion-badge>
          <h2 class="hero-title">{{ trip()!.name }}</h2>
          <p class="hero-route">
            <ion-icon name="navigate-outline"></ion-icon>
            {{ trip()!.origin }}
            @for (s of trip()!.stops; track s.id) { → {{ s.city }} }
            → {{ trip()!.destination }}
          </p>
          <p class="hero-route">
            <ion-icon name="people-outline"></ion-icon>
            {{ trip()!.passengers.length }} pasajeros
          </p>
        </div>

        @if (trip()!.status === 'IN_PROGRESS' && trip()!.stops.length > 0) {
          <div class="card-surface ion-margin-top">
            <p class="section-title"><ion-icon name="navigate-outline"></ion-icon> Paradas de este viaje</p>
            <ion-list class="list-cards">
              @for (s of trip()!.stops; track s.id) {
                <ion-item lines="none">
                  <ion-label>
                    <p class="stop-order">Parada {{ s.order }}</p>
                    <h3>{{ s.city }}</h3>
                  </ion-label>
                  <ion-badge slot="end" color="tertiary">{{ passengersAtStop(s.id) }} abordaron</ion-badge>
                </ion-item>
              }
            </ion-list>
          </div>
        }

        <div class="trip-stepper">
          <div class="step done"></div>
          <div class="step" [class.done]="hasSignature()" [class.active]="!hasSignature()"></div>
          <div class="step" [class.done]="isInProgress()" [class.active]="hasSignature() && !isInProgress()"></div>
          <div class="step" [class.active]="isInProgress()"></div>
        </div>
        <div class="step-labels">
          <span>Asignado</span><span>Firma</span><span>Inicio</span><span>En ruta</span>
        </div>

        @if (trip()!.status === 'PENDING') {
          <div class="cta-list">
            <button class="cta-row" [routerLink]="['/driver/checkin', trip()!.id]">
              <div class="cta-icon" style="background: rgba(var(--app-color-primary-rgb),.12); color: var(--app-color-primary);">
                <ion-icon name="people-outline"></ion-icon>
              </div>
              <div class="cta-text">
                <strong>Check-in de pasajeros</strong>
                <span>Marca quién abordó el vehículo</span>
              </div>
            </button>

            <button class="cta-row" [routerLink]="['/driver/signature', trip()!.id]">
              <div class="cta-icon" style="background: rgba(var(--app-color-secondary-rgb),.14); color: var(--app-color-secondary);">
                <ion-icon name="create-outline"></ion-icon>
              </div>
              <div class="cta-text">
                <strong>{{ trip()!.signatureData ? 'Firma capturada ✓' : 'Capturar firma digital' }}</strong>
                <span>{{ trip()!.signatureData ? 'Toca para ver o volver a firmar' : 'Requerida para iniciar el viaje' }}</span>
              </div>
            </button>
          </div>

          <ion-button
            expand="block"
            color="success"
            class="ion-margin-top"
            [disabled]="!trip()!.signatureData || !!otherTripInProgress() || starting()"
            (click)="startTrip()">
            @if (starting()) {
              <ion-spinner name="dots"></ion-spinner>
            } @else {
              <ion-icon [name]="trip()!.signatureData ? 'play-outline' : 'lock-closed-outline'" slot="start"></ion-icon>
              Iniciar viaje
            }
          </ion-button>
          @if (!trip()!.signatureData) {
            <p class="lock-hint">
              <ion-icon name="lock-closed-outline"></ion-icon>
              Debes capturar la firma digital antes de poder iniciar el viaje.
            </p>
          } @else {
            @if (otherTripInProgress(); as blocker) {
              <p class="lock-hint">
                <ion-icon name="lock-closed-outline"></ion-icon>
                Ya tienes "{{ blocker.name }}" en curso. Ciérralo antes de iniciar este.
              </p>
              <ion-button fill="clear" size="small" expand="block" [routerLink]="['/driver/my-trip', blocker.id]">
                Ir a "{{ blocker.name }}"
              </ion-button>
            }
          }
          @if (error()) {
            <p class="lock-hint error-hint">{{ error() }}</p>
          }
        }

        @if (trip()!.status === 'IN_PROGRESS') {
          <div class="cta-list">
            <button class="cta-row" [routerLink]="['/driver/en-route', trip()!.id]">
              <div class="cta-icon" style="background: rgba(245,158,11,.16); color: var(--app-color-warning);">
                <ion-icon name="flag-outline"></ion-icon>
              </div>
              <div class="cta-text">
                <strong>Gastos y novedades</strong>
                <span>Registra eventos durante la ruta</span>
              </div>
            </button>
          </div>
          <ion-button expand="block" color="success" class="ion-margin-top" [routerLink]="['/driver/close-trip', trip()!.id]">
            <ion-icon name="checkmark-done-outline" slot="start"></ion-icon>
            Cerrar viaje
          </ion-button>
        }
      }
    </ion-content>
  `,
  styles: [`
    .chooser-hint {
      color: var(--app-color-text-muted);
      font-size: 0.9rem;
      margin: 4px 0 var(--app-space-md);
    }
    .trip-avatar {
      width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
      color: #fff;
      ion-icon { font-size: 20px; }
    }
    .back-to-list {
      margin: 0 0 4px -8px;
    }
    .hero-title {
      font-family: var(--app-font-family-heading);
      font-size: 1.35rem;
      font-weight: 800;
      margin: 10px 0 6px;
    }
    .hero-route {
      display: flex; align-items: center; gap: 6px;
      margin: 4px 0; opacity: 0.95; font-size: 0.92rem;
    }
    .step-labels {
      display: flex; justify-content: space-between;
      font-size: 0.68rem; color: var(--app-color-text-muted);
      margin-bottom: var(--app-space-md);
      span { flex: 1; text-align: center; }
      span:first-child { text-align: left; }
      span:last-child { text-align: right; }
    }
    .cta-list { display: flex; flex-direction: column; gap: 10px; }
    .cta-row {
      display: flex; align-items: center; gap: 12px;
      width: 100%;
      text-align: left;
      background: var(--app-color-surface);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-md);
      padding: 14px;
      box-shadow: var(--app-shadow-sm);
      cursor: pointer;
      font-family: inherit;
      transition: box-shadow var(--app-transition-base), transform var(--app-transition-base);
    }
    .cta-row:active { transform: scale(0.98); }
    .cta-icon {
      width: 42px; height: 42px; flex-shrink: 0;
      border-radius: var(--app-radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }
    .cta-text { display: flex; flex-direction: column; }
    .cta-text strong { color: var(--app-color-text); font-size: 0.95rem; }
    .cta-text span { color: var(--app-color-text-muted); font-size: 0.78rem; margin-top: 2px; }
    .lock-hint {
      display: flex; align-items: center; gap: 6px;
      justify-content: center;
      font-size: 0.8rem;
      color: var(--app-color-text-muted);
      margin-top: 10px;
    }
    .error-hint {
      color: var(--app-color-danger, #dc2626);
    }
    .stop-order { font-size: 0.72rem; color: var(--app-color-text-muted); margin: 0 0 2px; }
  `],
})
export class MyTripPage implements OnDestroy {
  trip = signal<Trip | null>(null);
  // Todos los viajes activos (no finalizados) del conductor. Si hay más de
  // uno y la URL no trae un :id específico, se usa para mostrar el
  // selector; si hay uno o el :id ya identifica cuál, sirve para el enlace
  // "Ver mis otros viajes" dentro del detalle.
  chooser = signal<Trip[]>([]);
  loading = signal(true);
  starting = signal(false);
  error = signal<string | null>(null);
  STATUS_LABEL = STATUS_LABEL;
  STATUS_COLOR = STATUS_COLOR;

  // Igual que en el dashboard del admin: sondeo en segundo plano mientras
  // la página está visible, para que un viaje recién asignado por el
  // admin (o un cambio de estado) le aparezca al conductor sin que tenga
  // que jalar para refrescar.
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private readonly POLL_MS = 8000;

  constructor(
    private tripsService: TripsService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
  ) {
    addIcons({
      settingsOutline, peopleOutline, createOutline, playOutline, navigateOutline,
      flagOutline, checkmarkDoneOutline, busOutline, lockClosedOutline,
    });
  }

  async ionViewWillEnter() {
    await this.load();
    this.stopPolling();
    this.pollTimer = setInterval(() => this.load({ silent: true }), this.POLL_MS);
  }

  ionViewWillLeave() {
    this.stopPolling();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  private stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  async load(opts?: { silent?: boolean }) {
    if (!opts?.silent) this.loading.set(true);
    try {
      const result = await this.tripsService.list(1, 20, undefined, { silent: true });
      const active = result.data.filter((t) => t.status !== 'FINISHED');
      this.chooser.set(active);

      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        // Puede venir de la lista que ya cargamos (evita una llamada extra)
        // o, si no está ahí por lo que sea, se pide directo por id.
        this.trip.set(active.find((t) => t.id === id) || await this.tripsService.getById(id));
      } else if (active.length === 1) {
        this.trip.set(active[0]);
      } else {
        this.trip.set(null);
      }
    } finally {
      if (!opts?.silent) this.loading.set(false);
    }
  }

  /**
   * Se llama al tocar un viaje en el selector (cuando hay varios activos).
   * Si el que se quiere abrir está PENDIENTE y ya hay otro EN RUTA, ni
   * siquiera deja entrar: avisa de una vez con una alerta y ofrece ir
   * directo al que está en curso, en vez de dejar que el conductor entre
   * y se tope con el botón "Iniciar viaje" bloqueado.
   */
  async onChooseTrip(t: Trip) {
    if (t.status === 'PENDING') {
      const blocker = this.chooser().find((o) => o.id !== t.id && o.status === 'IN_PROGRESS');
      if (blocker) {
        const alert = await this.alertController.create({
          header: 'Ya tienes un viaje en curso',
          message: `Debes cerrar "${blocker.name}" antes de poder entrar a "${t.name}".`,
          buttons: [
            { text: 'Cancelar', role: 'cancel' },
            {
              text: `Ir a "${blocker.name}"`,
              handler: () => this.router.navigate(['/driver/my-trip', blocker.id]),
            },
          ],
        });
        await alert.present();
        return;
      }
    }
    this.router.navigate(['/driver/my-trip', t.id]);
  }

  /** Cuántos pasajeros de este viaje abordaron en una parada específica. */
  passengersAtStop(stopId: string): number {
    return (this.trip()?.passengers || []).filter(
      (p) => p.stopId === stopId && p.boardingStatus === 'BOARDED',
    ).length;
  }

  avatarBg(status: Trip['status']) {
    const map: Record<Trip['status'], string> = {
      PENDING: 'linear-gradient(135deg,#94A3B8,#64748B)',
      IN_PROGRESS: 'linear-gradient(135deg,#FBBF24,#F59E0B)',
      FINISHED: 'linear-gradient(135deg,#34D399,#059669)',
    };
    return map[status];
  }

  hasSignature() {
    return !!this.trip()?.signatureData;
  }

  isInProgress() {
    return this.trip()?.status === 'IN_PROGRESS';
  }

  /**
   * Un conductor no puede tener dos viajes EN RUTA a la vez. Si dentro de
   * sus viajes activos hay otro (distinto al que se está viendo) que ya
   * está IN_PROGRESS, ese es el que bloquea el botón "Iniciar viaje".
   * El backend valida esto mismo (trips-service), esto es solo para
   * mostrarlo claro en la UI antes de que el conductor lo intente.
   */
  otherTripInProgress(): Trip | null {
    const current = this.trip();
    if (!current || current.status !== 'PENDING') return null;
    return this.chooser().find((t) => t.id !== current.id && t.status === 'IN_PROGRESS') || null;
  }

  async startTrip() {
    if (!this.trip() || this.otherTripInProgress()) return;
    this.error.set(null);
    this.starting.set(true);
    try {
      const updated = await this.tripsService.start(this.trip()!.id);
      this.trip.set(updated);
    } catch (e: any) {
      this.error.set(e?.error?.message || 'No se pudo iniciar el viaje. Intenta de nuevo.');
    } finally {
      this.starting.set(false);
    }
  }

  async doRefresh(ev: CustomEvent) {
    await this.load();
    (ev.target as any).complete();
  }
}
