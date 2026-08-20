import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
  IonList, IonItem, IonLabel, IonBadge, IonSegment, IonSegmentButton, IonRefresher,
  IonRefresherContent, IonSpinner, IonFab, IonFabButton, IonAvatar, AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, settingsOutline, peopleOutline, cashOutline, busOutline,
  checkmarkDoneCircleOutline, timeOutline, chevronForwardOutline, trashOutline,
  chevronBackOutline,
} from 'ionicons/icons';
import { TripsService } from '../../../core/services/trips.service';
import { AuthService } from '../../../core/services/auth.service';
import { Trip, TripStats, TripStatus } from '../../../core/models/models';

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<TripStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En ruta',
  FINISHED: 'Finalizado',
};
const STATUS_COLOR: Record<TripStatus, string> = {
  PENDING: 'medium',
  IN_PROGRESS: 'warning',
  FINISHED: 'success',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonButton, IonIcon, IonList, IonItem, IonLabel, IonBadge,
    IonSegment, IonSegmentButton, IonRefresher, IonRefresherContent, IonSpinner,
    IonFab, IonFabButton, IonAvatar,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Panel del Administrador</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/admin/drivers">
            <ion-icon slot="icon-only" name="people-outline"></ion-icon>
          </ion-button>
          <ion-button routerLink="/admin/settings">
            <ion-icon slot="icon-only" name="settings-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="ion-page-desktop ion-padding">
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(var(--app-color-primary-rgb), .12); color: var(--app-color-primary);">
              <ion-icon name="bus-outline"></ion-icon>
            </div>
            <span class="stat-value">{{ stats()?.total ?? 0 }}</span>
            <span class="stat-label">Viajes totales</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(245, 158, 11, .14); color: var(--app-color-warning);">
              <ion-icon name="time-outline"></ion-icon>
            </div>
            <span class="stat-value">{{ stats()?.byStatus?.IN_PROGRESS ?? 0 }}</span>
            <span class="stat-label">En ruta</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(22, 163, 74, .14); color: var(--app-color-success);">
              <ion-icon name="checkmark-done-circle-outline"></ion-icon>
            </div>
            <span class="stat-value">{{ stats()?.byStatus?.FINISHED ?? 0 }}</span>
            <span class="stat-label">Finalizados</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(var(--app-color-secondary-rgb), .14); color: var(--app-color-secondary);">
              <ion-icon name="people-outline"></ion-icon>
            </div>
            <span class="stat-value">{{ stats()?.passengersTotal ?? 0 }}</span>
            <span class="stat-label">Pasajeros</span>
          </div>
        </div>

        <ion-segment [value]="statusFilter()" (ionChange)="onFilterChange($event)">
          <ion-segment-button value="">Todos</ion-segment-button>
          <ion-segment-button value="PENDING">Pendientes</ion-segment-button>
          <ion-segment-button value="IN_PROGRESS">En ruta</ion-segment-button>
          <ion-segment-button value="FINISHED">Finalizados</ion-segment-button>
        </ion-segment>

        @if (trips.loading()) {
          <div class="empty-state"><ion-spinner></ion-spinner></div>
        } @else if (trips.trips().length === 0) {
          <div class="empty-state">
            <ion-icon name="bus-outline"></ion-icon>
            <p>No hay viajes registrados con este filtro.</p>
          </div>
        } @else {
          <ion-list class="list-cards ion-margin-top">
            @for (trip of trips.trips(); track trip.id) {
              <ion-item lines="none">
                <ion-avatar slot="start" class="trip-avatar" [style.background]="avatarBg(trip.status)">
                  <ion-icon name="bus-outline"></ion-icon>
                </ion-avatar>
                <ion-label [routerLink]="['/admin/trips', trip.id]" style="cursor:pointer;">
                  <h2>{{ trip.name }}</h2>
                  <p>{{ trip.origin }} → {{ trip.destination }}</p>
                  <p>Conductor: {{ trip.driver?.name }} · {{ trip.passengers.length }} pasajeros</p>
                </ion-label>
                <div slot="end" class="trip-end">
                  <ion-badge [color]="STATUS_COLOR[trip.status]">{{ STATUS_LABEL[trip.status] }}</ion-badge>
                  <div class="trip-actions">
                    <ion-button fill="clear" color="danger" size="small" (click)="confirmDelete(trip, $event)">
                      <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                    </ion-button>
                    <ion-icon
                      name="chevron-forward-outline" class="chev"
                      [routerLink]="['/admin/trips', trip.id]" style="cursor:pointer;">
                    </ion-icon>
                  </div>
                </div>
              </ion-item>
            }
          </ion-list>

          @if (meta().totalPages > 1) {
            <div class="pagination-bar">
              <ion-button fill="outline" size="small" [disabled]="page() <= 1" (click)="goToPage(page() - 1)">
                <ion-icon name="chevron-back-outline" slot="start"></ion-icon>
                Anterior
              </ion-button>
              <span class="pagination-label">Página {{ page() }} de {{ meta().totalPages }} · {{ meta().total }} viajes</span>
              <ion-button fill="outline" size="small" [disabled]="page() >= meta().totalPages" (click)="goToPage(page() + 1)">
                Siguiente
                <ion-icon name="chevron-forward-outline" slot="end"></ion-icon>
              </ion-button>
            </div>
          }
        }
      </div>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button routerLink="/admin/trips/new">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [`
    .trip-avatar {
      width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
      color: #fff;
      ion-icon { font-size: 20px; }
    }
    .trip-end {
      display: flex; flex-direction: column; align-items: flex-end; gap: 4px;
    }
    .trip-actions {
      display: flex; align-items: center; gap: 2px;
    }
    .chev { color: var(--app-color-text-muted); font-size: 16px; padding: 4px; }
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
export class DashboardPage implements OnInit {
  statusFilter = signal<string>('');
  STATUS_LABEL = STATUS_LABEL;
  STATUS_COLOR = STATUS_COLOR;

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

  constructor(
    public trips: TripsService,
    public auth: AuthService,
    private alertController: AlertController,
  ) {
    addIcons({
      addOutline, settingsOutline, peopleOutline, cashOutline, busOutline,
      checkmarkDoneCircleOutline, timeOutline, chevronForwardOutline, trashOutline,
      chevronBackOutline,
    });
  }

  ngOnInit() {
    this.load();
  }

  async load() {
    const [result] = await Promise.all([
      this.trips.list(this.page(), PAGE_SIZE, this.statusFilter() || undefined),
      this.loadStats(),
    ]);
    this.meta.set({ total: result.meta.total, totalPages: result.meta.totalPages });
  }

  async loadStats() {
    this.stats.set(await this.trips.getStats());
  }

  avatarBg(status: TripStatus) {
    const map: Record<TripStatus, string> = {
      PENDING: 'linear-gradient(135deg,#94A3B8,#64748B)',
      IN_PROGRESS: 'linear-gradient(135deg,#FBBF24,#F59E0B)',
      FINISHED: 'linear-gradient(135deg,#34D399,#059669)',
    };
    return map[status];
  }

  onFilterChange(ev: CustomEvent) {
    this.statusFilter.set(ev.detail.value);
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
    const inProgressWarning = trip.status === 'IN_PROGRESS'
      ? ' Este viaje está EN RUTA en este momento — el conductor perderá acceso a él.'
      : '';
    const alert = await this.alertController.create({
      header: 'Eliminar viaje',
      message: `¿Seguro que quieres eliminar "${trip.name}"? Se borrarán también sus pasajeros, paradas, gastos y novedades. Esta acción no se puede deshacer.${inProgressWarning}`,
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
