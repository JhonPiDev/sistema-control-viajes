import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
  IonList, IonItem, IonLabel, IonBadge, IonSegment, IonSegmentButton, IonRefresher,
  IonRefresherContent, IonSpinner, IonFab, IonFabButton, IonAvatar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, settingsOutline, peopleOutline, cashOutline, busOutline,
  checkmarkDoneCircleOutline, timeOutline, chevronForwardOutline,
} from 'ionicons/icons';
import { TripsService } from '../../../core/services/trips.service';
import { AuthService } from '../../../core/services/auth.service';
import { Trip, TripStatus } from '../../../core/models/models';

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
            <span class="stat-value">{{ totalTrips() }}</span>
            <span class="stat-label">Viajes totales</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(245, 158, 11, .14); color: var(--app-color-warning);">
              <ion-icon name="time-outline"></ion-icon>
            </div>
            <span class="stat-value">{{ countByStatus('IN_PROGRESS') }}</span>
            <span class="stat-label">En ruta</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(22, 163, 74, .14); color: var(--app-color-success);">
              <ion-icon name="checkmark-done-circle-outline"></ion-icon>
            </div>
            <span class="stat-value">{{ countByStatus('FINISHED') }}</span>
            <span class="stat-label">Finalizados</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(var(--app-color-secondary-rgb), .14); color: var(--app-color-secondary);">
              <ion-icon name="people-outline"></ion-icon>
            </div>
            <span class="stat-value">{{ totalPassengers() }}</span>
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
              <ion-item [routerLink]="['/admin/trips', trip.id]" button detail="false" lines="none">
                <ion-avatar slot="start" class="trip-avatar" [style.background]="avatarBg(trip.status)">
                  <ion-icon name="bus-outline"></ion-icon>
                </ion-avatar>
                <ion-label>
                  <h2>{{ trip.name }}</h2>
                  <p>{{ trip.origin }} → {{ trip.destination }}</p>
                  <p>Conductor: {{ trip.driver?.name }} · {{ trip.passengers.length }} pasajeros</p>
                </ion-label>
                <div slot="end" class="trip-end">
                  <ion-badge [color]="STATUS_COLOR[trip.status]">{{ STATUS_LABEL[trip.status] }}</ion-badge>
                  <ion-icon name="chevron-forward-outline" class="chev"></ion-icon>
                </div>
              </ion-item>
            }
          </ion-list>
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
      display: flex; flex-direction: column; align-items: flex-end; gap: 6px;
    }
    .chev { color: var(--app-color-text-muted); font-size: 16px; }
  `],
})
export class DashboardPage implements OnInit {
  statusFilter = signal<string>('');
  STATUS_LABEL = STATUS_LABEL;
  STATUS_COLOR = STATUS_COLOR;

  totalTrips = computed(() => this.trips.trips().length);
  totalPassengers = computed(() =>
    this.trips.trips().reduce((sum, t) => sum + t.passengers.length, 0),
  );

  constructor(public trips: TripsService, public auth: AuthService) {
    addIcons({
      addOutline, settingsOutline, peopleOutline, cashOutline, busOutline,
      checkmarkDoneCircleOutline, timeOutline, chevronForwardOutline,
    });
  }

  ngOnInit() {
    this.load();
  }

  async load() {
    await this.trips.list(1, 50, this.statusFilter() || undefined);
  }

  countByStatus(status: TripStatus) {
    return this.trips.trips().filter((t) => t.status === status).length;
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
    this.load();
  }

  async doRefresh(ev: CustomEvent) {
    await this.load();
    (ev.target as any).complete();
  }
}
