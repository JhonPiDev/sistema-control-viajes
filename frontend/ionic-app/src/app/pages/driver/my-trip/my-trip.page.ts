import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonContent, IonIcon,
  IonSpinner, IonRefresher, IonRefresherContent, AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  settingsOutline, peopleOutline, createOutline, playOutline, navigateOutline, chevronForwardOutline,
  flagOutline, checkmarkDoneOutline, busOutline, lockClosedOutline, star, checkmarkCircle,
  locationOutline,
} from 'ionicons/icons';
import { TripsService } from '../../../core/services/trips.service';
import { Trip } from '../../../core/models/models';
import { PhoneShellComponent } from '../../../shared/components/phone-shell.component';
import { StatusPillComponent } from '../../../shared/components/status-pill.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';

@Component({
  selector: 'app-my-trip',
  standalone: true,
  imports: [
    CommonModule, RouterLink, IonContent, IonIcon, IonSpinner,
    IonRefresher, IonRefresherContent,
    PhoneShellComponent, StatusPillComponent, EmptyStateComponent,
  ],
  template: `
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <app-phone-shell title="Mi viaje">
        <a shellAction class="phone-shell__action" routerLink="/driver/settings" aria-label="Ajustes">
          <ion-icon name="settings-outline"></ion-icon>
        </a>

      @if (loading()) {
        <app-empty-state loading></app-empty-state>
      } @else if (!trip() && chooser().length > 1) {
        <p class="chooser-hint">Tienes {{ chooser().length }} viajes activos, ordenados del más antiguo al más nuevo:</p>
        <div class="data-list">
          @for (t of chooser(); track t.id; let i = $index) {
            <div class="data-row data-row--link" (click)="onChooseTrip(t)">
              <div class="trip-icon">
                @if (i === 0) {
                  <ion-icon name="star"></ion-icon>
                } @else {
                  <ion-icon name="bus-outline"></ion-icon>
                }
              </div>
              <div class="data-row__text">
                <div class="data-row__title">{{ t.origin }} – {{ t.destination }}</div>
                <div class="data-row__meta">{{ t.passengers.length }} pasajeros · Creado {{ elapsedLabel(t.createdAt) }}</div>
              </div>
              <app-status-pill [trip]="t.status" pendingLabel="Por iniciar"></app-status-pill>
            </div>
          }
        </div>
      } @else if (!trip()) {
        <app-empty-state icon="navigate-outline" text="No tienes ningún viaje asignado por ahora."></app-empty-state>
      } @else {
        @if (chooser().length > 1) {
          <a routerLink="/driver/my-trip" class="back-to-list">← Ver mis {{ chooser().length }} viajes</a>
        }
        <div class="hero-card">
          <span class="hero-badge">
            {{ trip()!.status === 'PENDING' ? 'Por iniciar' : 'En ruta' }}
          </span>
          <h2 class="hero-title">{{ trip()!.origin }} – {{ trip()!.destination }}</h2>
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
          <div class="card-surface stops-card">
            <p class="stops-card__title">Paradas de este viaje</p>
            @for (s of trip()!.stops; track s.id) {
              <div class="stops-card__row">
                <div>
                  <div class="stop-order">Parada {{ s.order }}</div>
                  <div class="stop-city">{{ s.city }}</div>
                </div>
                <span class="boarded-pill">{{ passengersAtStop(s.id) }} abordaron</span>
              </div>
            }
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
              <div class="cta-icon icon-avatar--tertiary">
                <ion-icon name="people-outline"></ion-icon>
              </div>
              <div class="cta-text">
                <strong>Check-in de pasajeros</strong>
                <span>{{ checkinComplete() ? 'Todos los pasajeros marcados' : 'Marca quién abordó el vehículo' }}</span>
              </div>
              @if (checkinComplete()) {
                <ion-icon name="checkmark-circle" class="cta-check"></ion-icon>
              } @else {
                <ion-icon name="chevron-forward-outline" class="cta-chev"></ion-icon>
              }
            </button>

            <button class="cta-row" [routerLink]="['/driver/signature', trip()!.id]">
              <div class="cta-icon icon-avatar--accent">
                <ion-icon name="create-outline"></ion-icon>
              </div>
              <div class="cta-text">
                <strong>{{ trip()!.signatureData ? 'Firma capturada' : 'Capturar firma digital' }}</strong>
                <span>{{ trip()!.signatureData ? 'Toca para ver o volver a firmar' : 'Requerida para iniciar el viaje' }}</span>
              </div>
              @if (hasSignature()) {
                <ion-icon name="checkmark-circle" class="cta-check"></ion-icon>
              } @else {
                <ion-icon name="chevron-forward-outline" class="cta-chev"></ion-icon>
              }
            </button>
          </div>

          @if (checkinComplete() && hasSignature()) {
            <div class="ready-banner">
              <ion-icon name="checkmark-circle"></ion-icon>
              <span>Todo listo: check-in y firma completos. Ya puedes iniciar el viaje.</span>
            </div>
          }

          <button
            type="button"
            class="btn btn--block start-btn"
            [class.btn--primary]="canStart()"
            [class.btn--locked]="!canStart()"
            [disabled]="!canStart() || starting()"
            (click)="startTrip()">
            @if (starting()) {
              <ion-spinner name="dots"></ion-spinner>
            } @else {
              <ion-icon [name]="trip()!.signatureData ? 'play-outline' : 'lock-closed-outline'"></ion-icon>
              Iniciar viaje
            }
          </button>
          @if (!trip()!.signatureData) {
            <p class="lock-hint">Debes capturar la firma digital antes de poder iniciar el viaje.</p>
          } @else {
            @if (otherTripInProgress(); as blocker) {
              <p class="lock-hint">
                Ya tienes "{{ blocker.name }}" en curso. Ciérralo antes de iniciar este.
              </p>
              <a class="blocker-link" [routerLink]="['/driver/my-trip', blocker.id]">
                Ir a "{{ blocker.name }}"
              </a>
            }
          }
          @if (error()) {
            <p class="lock-hint error-hint">{{ error() }}</p>
          }
        }

        @if (trip()!.status === 'IN_PROGRESS') {
          <div class="cta-list">
            <button class="cta-row" [routerLink]="['/driver/en-route', trip()!.id]" [queryParams]="{ tab: 'stops' }">
              <div class="cta-icon icon-avatar--tertiary">
                <ion-icon name="location-outline"></ion-icon>
              </div>
              <div class="cta-text">
                <strong>Paradas</strong>
                <span>Consulta las paradas y quién abordó en cada una</span>
              </div>
              <ion-icon name="chevron-forward-outline" class="cta-chev"></ion-icon>
            </button>

            <button class="cta-row" [routerLink]="['/driver/en-route', trip()!.id]" [queryParams]="{ tab: 'expenses' }">
              <div class="cta-icon icon-avatar--warning">
                <ion-icon name="flag-outline"></ion-icon>
              </div>
              <div class="cta-text">
                <strong>Gastos y novedades</strong>
                <span>Registra eventos durante la ruta</span>
              </div>
              <ion-icon name="chevron-forward-outline" class="cta-chev"></ion-icon>
            </button>
          </div>
          <button type="button" class="btn btn--primary btn--block start-btn" [routerLink]="['/driver/close-trip', trip()!.id]">
            Cerrar viaje
          </button>
        }
      }
      </app-phone-shell>
    </ion-content>
  `,
  styles: [`
    .chooser-hint {
      color: var(--app-color-text-muted);
      font-size: 0.82rem;
      margin: 0 0 14px;
    }
    /* Icono cuadrado del selector de viajes (mismo que el listado del admin) */
    .trip-icon {
      width: 38px; height: 38px;
      flex-shrink: 0;
      border-radius: 10px;
      background: rgba(var(--app-color-primary-rgb), .12);
      color: var(--app-color-primary-shade);
      display: flex; align-items: center; justify-content: center;
      ion-icon { font-size: 18px; }
    }
    .back-to-list {
      display: inline-block;
      margin: 0 0 12px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--app-color-primary);
      text-decoration: none;
    }
    .hero-badge {
      display: inline-block;
      background: rgba(255, 255, 255, .2);
      padding: 4px 10px;
      border-radius: var(--app-radius-full);
      font-size: 0.7rem;
      font-weight: 700;
    }
    .hero-title {
      font-family: var(--app-font-family-heading);
      font-size: 1.2rem;
      font-weight: 800;
      margin: 10px 0 6px;
    }
    .hero-route {
      display: flex; align-items: center; gap: 6px;
      margin: 4px 0; opacity: 0.9; font-size: 0.82rem;
    }

    .stops-card { margin-top: var(--app-space-md); padding: 14px; }
    .stops-card__title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--app-color-text-muted);
      margin: 0 0 10px;
    }
    .stops-card__row {
      display: flex; align-items: center; justify-content: space-between;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid var(--app-color-border);
      &:last-child { border-bottom: none; }
    }
    .stop-city { font-size: 0.875rem; font-weight: 600; }
    .boarded-pill {
      background: rgba(var(--app-color-primary-rgb), .12);
      color: var(--app-color-primary-shade);
      font-size: 0.7rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: var(--app-radius-full);
      white-space: nowrap;
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
    .cta-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .cta-text strong { color: var(--app-color-text); font-size: 0.95rem; }
    .cta-check {
      flex-shrink: 0;
      font-size: 20px;
      color: var(--app-color-success);
    }
    .cta-chev { flex-shrink: 0; font-size: 16px; color: var(--app-color-text-subtle); }

    /* El botón de iniciar/cerrar viaje usa el acento; bloqueado queda gris
       (como el mockup), no verde de Ionic. */
    .start-btn {
      margin-top: var(--app-space-md);
      border-radius: 12px;
      padding: 14px;
    }
    .btn--locked {
      background: var(--app-color-border);
      color: var(--app-color-text-subtle);
      cursor: not-allowed;
    }
    .blocker-link {
      display: block;
      text-align: center;
      margin-top: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--app-color-primary);
      text-decoration: none;
    }
    .ready-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: var(--app-space-md);
      padding: 12px 14px;
      border-radius: var(--app-radius-md);
      background: rgba(22, 163, 74, .12);
      color: var(--app-color-success);
      font-weight: 700;
      font-size: 0.85rem;
      ion-icon { font-size: 20px; flex-shrink: 0; }
    }
    .cta-text span { color: var(--app-color-text-muted); font-size: 0.78rem; margin-top: 2px; }
    .lock-hint {
      text-align: center;
      font-size: 0.75rem;
      color: var(--app-color-text-subtle);
      margin-top: 8px;
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

  // Sondeo en segundo plano (como el dashboard) para que un viaje recién
  // asignado le aparezca al conductor sin refrescar a mano.
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private readonly POLL_MS = 8000;

  constructor(
    private tripsService: TripsService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
  ) {
    addIcons({
      settingsOutline, peopleOutline, createOutline, playOutline, navigateOutline, chevronForwardOutline,
      flagOutline, checkmarkDoneOutline, busOutline, lockClosedOutline, star, checkmarkCircle,
      locationOutline,
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
      const active = result.data
        .filter((t) => t.status !== 'FINISHED')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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

  /** Al elegir un viaje PENDIENTE con otro ya EN RUTA, avisa y ofrece ir directo a ese en vez de dejarlo entrar bloqueado. */
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

  /** "hace 5 min" / "hace 2 h" — para priorizar cuál viaje atender primero. */
  elapsedLabel(createdAt: string): string {
    const minutes = Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000));
    if (minutes < 1) return 'hace instantes';
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours} h`;
    const days = Math.floor(hours / 24);
    return `hace ${days} d`;
  }

  hasSignature() {
    return !!this.trip()?.signatureData;
  }

  /** Sólo se puede arrancar con firma capturada y sin otro viaje en curso. */
  canStart(): boolean {
    return this.hasSignature() && !this.otherTripInProgress();
  }

  /** Check-in del origen completo: todos los pasajeros ya quedaron abordados o ausentes (ninguno pendiente). */
  checkinComplete(): boolean {
    const passengers = this.trip()?.passengers || [];
    return passengers.every((p) => p.boardingStatus !== 'PENDING');
  }

  isInProgress() {
    return this.trip()?.status === 'IN_PROGRESS';
  }

  /** Otro viaje ya IN_PROGRESS del conductor, si lo hay (bloquea "Iniciar viaje"; el backend valida lo mismo). */
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
