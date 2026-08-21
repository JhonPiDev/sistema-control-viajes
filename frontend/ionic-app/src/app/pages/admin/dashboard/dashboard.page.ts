import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonButton, IonIcon, IonRefresher,
  IonRefresherContent, IonSpinner, AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, busOutline, chevronForwardOutline, trashOutline,
  chevronBackOutline, createOutline, addCircleOutline, personAddOutline,
} from 'ionicons/icons';
import { TripsService } from '../../../core/services/trips.service';
import { AuthService } from '../../../core/services/auth.service';
import { Trip, TripStats } from '../../../core/models/models';
import { AdminPageComponent } from '../../../shared/components/admin-page.component';
import { StatCardComponent } from '../../../shared/components/stat-card.component';
import { StatusPillComponent } from '../../../shared/components/status-pill.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink, IonContent, IonButton, IonIcon,
    IonRefresher, IonRefresherContent, AdminPageComponent, StatCardComponent,
    StatusPillComponent, EmptyStateComponent,
  ],
  template: `
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <app-admin-page title="Resumen" subtitle="Estado general de la operación">
        <button pageActions type="button" class="btn btn--primary" routerLink="/admin/trips/new">
          <ion-icon name="add-outline"></ion-icon>
          Nuevo viaje
        </button>

        @if (stats() === null) {
          <app-empty-state loading></app-empty-state>
        } @else if (stats()!.total === 0) {
          <!-- Sin ningún viaje todavía (instalación nueva / recién limpiada):
               en vez del panel normal, dos accesos directos grandes para
               arrancar — crear el primer viaje o dar de alta un conductor. -->
          <div class="onboarding-row">
            <a class="onboarding-card" routerLink="/admin/trips/new">
              <div class="onboarding-card__icon">
                <ion-icon name="add-circle-outline"></ion-icon>
              </div>
              <h2>Crear viaje</h2>
              <p>Registra el primer viaje: origen, destino, conductor y paradas.</p>
            </a>
            <a class="onboarding-card" routerLink="/admin/drivers">
              <div class="onboarding-card__icon">
                <ion-icon name="person-add-outline"></ion-icon>
              </div>
              <h2>Crear conductor</h2>
              <p>Da de alta al conductor que va a manejar los viajes.</p>
            </a>
          </div>
        } @else {
          <div class="stat-grid">
            <app-stat-card [value]="stats()?.total ?? 0" label="Viajes totales"></app-stat-card>
            <app-stat-card [value]="stats()?.byStatus?.PENDING ?? 0" label="Pendientes" tone="warning"></app-stat-card>
            <app-stat-card [value]="stats()?.byStatus?.IN_PROGRESS ?? 0" label="En ruta" tone="info"></app-stat-card>
            <app-stat-card [value]="stats()?.byStatus?.FINISHED ?? 0" label="Finalizados" tone="success"></app-stat-card>
          </div>

          <div class="filter-bar">
            <button type="button" class="filter-pill" [class.is-active]="statusFilter() === ''" (click)="setFilter('')">Todos</button>
            <button type="button" class="filter-pill" [class.is-active]="statusFilter() === 'PENDING'" (click)="setFilter('PENDING')">Pendientes</button>
            <button type="button" class="filter-pill" [class.is-active]="statusFilter() === 'IN_PROGRESS'" (click)="setFilter('IN_PROGRESS')">En ruta</button>
            <button type="button" class="filter-pill" [class.is-active]="statusFilter() === 'FINISHED'" (click)="setFilter('FINISHED')">Finalizados</button>
          </div>

          @if (trips.loading()) {
            <app-empty-state loading></app-empty-state>
          } @else if (trips.trips().length === 0) {
            <app-empty-state icon="bus-outline" text="No hay viajes registrados con este filtro."></app-empty-state>
          } @else {
            <div class="data-list">
              @for (trip of trips.trips(); track trip.id) {
                <div class="data-row">
                  <div class="trip-icon">
                    <ion-icon name="bus-outline"></ion-icon>
                  </div>
                  <div class="data-row__text trip-link" [routerLink]="['/admin/trips', trip.id]">
                    <div class="data-row__title">{{ trip.origin }} – {{ trip.destination }}</div>
                    <div class="data-row__meta">
                      Conductor: {{ trip.driver?.name }} · {{ trip.passengers.length }} pasajeros
                    </div>
                  </div>
                  <div class="data-row__actions">
                    @if (trip.status === 'PENDING') {
                      <ion-button fill="clear" size="small" [routerLink]="['/admin/trips', trip.id, 'edit']" (click)="$event.stopPropagation()">
                        <ion-icon name="create-outline" slot="icon-only"></ion-icon>
                      </ion-button>
                    } @else if (trip.status === 'FINISHED') {
                      <ion-button fill="clear" color="danger" size="small" (click)="confirmDelete(trip, $event)">
                        <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                      </ion-button>
                    }
                    <app-status-pill [trip]="trip.status"></app-status-pill>
                    <ion-icon
                      name="chevron-forward-outline" class="chev"
                      [routerLink]="['/admin/trips', trip.id]">
                    </ion-icon>
                  </div>
                </div>
              }
            </div>

            @if (meta().totalPages > 1) {
              <div class="pagination-bar">
                <button type="button" class="btn btn--ghost btn--sm" [disabled]="page() <= 1" (click)="goToPage(page() - 1)">
                  <ion-icon name="chevron-back-outline"></ion-icon>
                  Anterior
                </button>
                <span class="pagination-label">Página {{ page() }} de {{ meta().totalPages }} · {{ meta().total }} viajes</span>
                <button type="button" class="btn btn--ghost btn--sm" [disabled]="page() >= meta().totalPages" (click)="goToPage(page() + 1)">
                  Siguiente
                  <ion-icon name="chevron-forward-outline"></ion-icon>
                </button>
              </div>
            }
          }
        }
      </app-admin-page>
    </ion-content>
  `,
  styles: [`
    .onboarding-row {
      display: flex;
      gap: var(--app-space-md);
      flex-wrap: wrap;
      margin-top: var(--app-space-lg, 24px);
    }
    .onboarding-card {
      flex: 1 1 240px;
      display: block;
      background: var(--app-color-surface);
      border: 1px solid var(--app-color-border);
      border-radius: 16px;
      padding: 28px;
      text-decoration: none;
      color: inherit;
      cursor: pointer;
      transition: border-color var(--app-transition-base);
      h2 { margin: 0 0 4px; font-family: var(--app-font-family-heading); font-size: 1rem; font-weight: 700; color: var(--app-color-text); }
      p { margin: 0; font-size: 0.82rem; color: var(--app-color-text-muted); line-height: 1.5; }
      &:hover { border-color: var(--app-color-primary); }
    }
    .onboarding-card__icon {
      width: 42px; height: 42px;
      border-radius: 11px;
      background: rgba(var(--app-color-primary-rgb), .12);
      color: var(--app-color-primary-shade);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 14px;
      ion-icon { font-size: 20px; }
    }
    /* Icono cuadrado de la fila de viaje (mockup: 38px, radio 10, acento suave) */
    .trip-icon {
      width: 38px; height: 38px;
      flex-shrink: 0;
      border-radius: 10px;
      background: rgba(var(--app-color-primary-rgb), .12);
      color: var(--app-color-primary-shade);
      display: flex; align-items: center; justify-content: center;
      ion-icon { font-size: 18px; }
    }
    .trip-link { cursor: pointer; }
    .chev { color: var(--app-color-text-subtle); font-size: 16px; padding: 4px; cursor: pointer; }
    .btn--sm { padding: 8px 14px; font-size: 0.8rem; font-weight: 600; }
    .pagination-bar {
      display: flex; align-items: center; justify-content: space-between;
      gap: 10px;
      margin: var(--app-space-md) 0;
      flex-wrap: wrap;
    }
    .pagination-label {
      font-size: 0.8rem;
      color: var(--app-color-text-muted);
      text-align: center;
      flex: 1;
    }
  `],
})
export class DashboardPage implements OnDestroy {
  statusFilter = signal<string>('');

  // Independiente del filtro de la lista de abajo: siempre refleja los
  // conteos globales, para que las tarjetas no cambien según el filtro
  // de estado activo (antes se calculaban sobre `trips.trips()`, que es
  // justo la lista YA filtrada por el segmento seleccionado).
  stats = signal<TripStats | null>(null);

  // Paginación real (no todo en una sola lista con scroll infinito): la
  // API ya soportaba page/limit, aquí se expone en la UI con botones
  // Anterior/Siguiente en vez de traer 50 viajes de una.
  page = signal(1);
  meta = signal<{ total: number; totalPages: number }>({ total: 0, totalPages: 1 });

  // Refresco en vivo: ionViewWillEnter (no ngOnInit, que solo corre una
  // vez) recarga cada vez que se vuelve a esta página, y mientras queda
  // visible se sondea el backend en silencio cada POLL_MS.
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private readonly POLL_MS = 8000;

  constructor(
    public trips: TripsService,
    public auth: AuthService,
    private alertController: AlertController,
  ) {
    addIcons({
      addOutline, busOutline, chevronForwardOutline, trashOutline,
      chevronBackOutline, createOutline, addCircleOutline, personAddOutline,
    });
  }

  ionViewWillEnter() {
    this.load();
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
    const [result] = await Promise.all([
      this.trips.list(this.page(), PAGE_SIZE, this.statusFilter() || undefined, { silent: opts?.silent }),
      this.loadStats(),
    ]);
    this.meta.set({ total: result.meta.total, totalPages: result.meta.totalPages });
  }

  async loadStats() {
    this.stats.set(await this.trips.getStats());
  }

  setFilter(status: string) {
    if (this.statusFilter() === status) return;
    this.statusFilter.set(status);
    this.page.set(1);
    this.load();
  }

  goToPage(p: number) {
    if (p < 1 || p > this.meta().totalPages) return;
    this.page.set(p);
    this.load();
  }

  async confirmDelete(trip: Trip, ev: Event) {
    ev.stopPropagation();
    const alert = await this.alertController.create({
      header: 'Eliminar viaje',
      message: `¿Seguro que quieres eliminar "${trip.name}"? Se borrarán también sus pasajeros, paradas, gastos y novedades. Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.deleteTrip(trip),
        },
      ],
    });
    await alert.present();
  }

  private async deleteTrip(trip: Trip) {
    try {
      await this.trips.remove(trip.id);
      // Si la página se quedó sin viajes tras borrar (ej. estabas en la
      // última página con un solo item), retrocede una página.
      if (this.trips.trips().length === 0 && this.page() > 1) {
        this.page.update((p) => p - 1);
      }
      await this.load();
    } catch (e: any) {
      const alert = await this.alertController.create({
        header: 'No se pudo eliminar',
        message: e?.error?.message || 'Ocurrió un error al eliminar el viaje.',
        buttons: ['OK'],
      });
      await alert.present();
    }
  }

  async doRefresh(ev: CustomEvent) {
    await this.load();
    (ev.target as any).complete();
  }
}
