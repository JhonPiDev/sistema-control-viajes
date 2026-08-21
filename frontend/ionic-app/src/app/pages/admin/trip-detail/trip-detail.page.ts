import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonContent, IonIcon, IonRefresher,
  IonRefresherContent, IonButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, cashOutline, alertCircleOutline, checkmarkCircleOutline,
  closeCircleOutline, timeOutline, navigateOutline, personCircleOutline,
  createOutline, arrowBackOutline,
} from 'ionicons/icons';
import { TripsService } from '../../../core/services/trips.service';
import { ExpensesService } from '../../../core/services/expenses.service';
import { IncidentsService } from '../../../core/services/incidents.service';
import { Trip, Expense, ExpenseType, Incident, IncidentType } from '../../../core/models/models';
import { AdminPageComponent } from '../../../shared/components/admin-page.component';
import { StatusPillComponent } from '../../../shared/components/status-pill.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';

const EXPENSE_TYPE_LABEL: Record<ExpenseType, string> = {
  FUEL: 'Combustible extra',
  TOLL: 'Peaje no previsto',
  REPAIR: 'Reparación / desvare',
  OTHER: 'Otro',
};

const INCIDENT_TYPE_LABEL: Record<IncidentType, string> = {
  DELAY: 'Retraso',
  PASSENGER_ISSUE: 'Problema con pasajeros',
  DETOUR: 'Desvío',
  OTHER: 'Otro',
};

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, IonContent, IonIcon, IonButton,
    IonRefresher, IonRefresherContent, AdminPageComponent, StatusPillComponent,
    EmptyStateComponent, MoneyPipe,
  ],
  template: `
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <app-admin-page
        [title]="trip()?.name || 'Viaje'"
        subtitle="Detalle del viaje"
        backLink="/admin/dashboard"
        [maxWidth]="840">
        @if (trip()?.status === 'PENDING') {
          <ion-button pageActions fill="outline" [routerLink]="['/admin/trips', trip()!.id, 'edit']">
            <ion-icon slot="start" name="create-outline"></ion-icon>
            Editar
          </ion-button>
        }

        @if (!trip()) {
          <app-empty-state loading></app-empty-state>
        } @else {
          <div class="hero-card">
            <span class="hero-badge">{{ statusLabel() }}</span>
            <h2 class="hero-title">{{ trip()!.name }}</h2>
            <p class="hero-route">
              <ion-icon name="navigate-outline"></ion-icon>
              {{ trip()!.origin }}
              @for (s of trip()!.stops; track s.id) { → {{ s.city }} }
              → {{ trip()!.destination }}
            </p>
            <p class="hero-driver">
              <ion-icon name="person-circle-outline"></ion-icon>
              Conductor: <strong>{{ trip()!.driver?.name }}</strong>
            </p>
          </div>

          <p class="list-heading">Pasajeros ({{ trip()!.passengers.length }})</p>
          <div class="data-list section-block">
            @for (p of trip()!.passengers; track p.id) {
              <div class="data-row">
                <div class="icon-avatar" [class]="'icon-avatar icon-avatar--' + (p.boardingStatus === 'BOARDED' ? 'success' : p.boardingStatus === 'ABSENT' ? 'danger' : 'medium')">
                  <ion-icon [name]="p.boardingStatus === 'BOARDED' ? 'checkmark-circle-outline' : p.boardingStatus === 'ABSENT' ? 'close-circle-outline' : 'time-outline'"></ion-icon>
                </div>
                <div class="data-row__text">
                  <div class="data-row__title">{{ p.name }}</div>
                  <div class="data-row__meta">{{ p.document }}</div>
                </div>
                <app-status-pill [boarding]="p"></app-status-pill>
              </div>
            }
          </div>

          @if (trip()!.signatureData) {
            <p class="list-heading">Firma del despachador/cliente</p>
            <div class="card-surface section-block signature-card">
              <img [src]="trip()!.signatureData" alt="Firma digital" />
            </div>
          }

          <p class="list-heading">Gastos reportados</p>
          <div class="section-block">
            @if (expenses().length === 0) {
              <app-empty-state variant="card" text="Sin gastos reportados aún."></app-empty-state>
            } @else {
              <div class="data-list">
                @for (e of expenses(); track e.id) {
                  <div class="data-row">
                    <div class="icon-avatar icon-avatar--warning">
                      <ion-icon name="cash-outline"></ion-icon>
                    </div>
                    <div class="data-row__text">
                      <div class="data-row__title">{{ expenseTypeLabel(e.type) }}</div>
                      <div class="data-row__meta">{{ e.concept }}</div>
                    </div>
                    <div class="amount">{{ e.amount | money }}</div>
                  </div>
                }
              </div>
            }
          </div>

          <p class="list-heading">Novedades</p>
          <div class="section-block">
            @if (incidents().length === 0) {
              <app-empty-state variant="card" text="Sin novedades reportadas aún."></app-empty-state>
            } @else {
              <div class="data-list">
                @for (n of incidents(); track n.id) {
                  <div class="data-row">
                    <div class="icon-avatar icon-avatar--danger">
                      <ion-icon name="alert-circle-outline"></ion-icon>
                    </div>
                    <div class="data-row__text">
                      <div class="data-row__title">{{ incidentTypeLabel(n.type) }}</div>
                      <div class="data-row__meta">{{ n.description }}</div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      </app-admin-page>
    </ion-content>
  `,
  styles: [`
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
    .hero-route, .hero-driver {
      display: flex; align-items: center; gap: 6px;
      margin: 4px 0;
      opacity: 0.9;
      font-size: 0.85rem;
    }
    .list-heading {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--app-color-text);
      margin: var(--app-space-lg) 0 10px;
    }
    .section-block { margin-bottom: 4px; }
    .signature-card {
      background: #fff;
      display: flex;
      justify-content: center;
      padding: 14px;
      img { max-width: 100%; max-height: 160px; }
    }
    .empty-card {
      text-align: center;
      color: var(--app-color-text-subtle);
      font-size: 0.82rem;
      padding: 18px;
    }
    .amount { font-size: 0.85rem; font-weight: 700; flex-shrink: 0; }
  `],
})
export class TripDetailPage implements OnDestroy {
  trip = signal<Trip | null>(null);
  expenses = signal<Expense[]>([]);
  incidents = signal<Incident[]>([]);
  private tripId = '';

  // Sondeo en segundo plano mientras se ve el reporte, para que los
  // check-ins, gastos y novedades que registra el conductor en vivo
  // aparezcan solos, sin que el admin tenga que jalar para refrescar.
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private readonly POLL_MS = 8000;

  constructor(
    private route: ActivatedRoute,
    private tripsService: TripsService,
    private expensesService: ExpensesService,
    private incidentsService: IncidentsService,
  ) {
    addIcons({
      personOutline, cashOutline, alertCircleOutline, checkmarkCircleOutline,
      closeCircleOutline, timeOutline, navigateOutline, personCircleOutline,
      createOutline, arrowBackOutline,
    });
  }

  async ionViewWillEnter() {
    this.tripId = this.route.snapshot.paramMap.get('id')!;
    await this.load();
    this.stopPolling();
    this.pollTimer = setInterval(() => this.load(), this.POLL_MS);
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

  async load() {
    const [trip, expenses, incidents] = await Promise.all([
      this.tripsService.getById(this.tripId),
      this.expensesService.findByTrip(this.tripId),
      this.incidentsService.findByTrip(this.tripId),
    ]);
    this.trip.set(trip);
    this.expenses.set(expenses);
    this.incidents.set(incidents);
  }

  /** El backend guarda códigos (FUEL, DELAY…); en la UI se muestran en español. */
  expenseTypeLabel(type: ExpenseType): string {
    return EXPENSE_TYPE_LABEL[type] ?? type;
  }

  incidentTypeLabel(type: IncidentType): string {
    return INCIDENT_TYPE_LABEL[type] ?? type;
  }

  statusLabel() {
    const s = this.trip()?.status;
    return s === 'PENDING' ? 'Pendiente' : s === 'IN_PROGRESS' ? 'En ruta' : 'Finalizado';
  }

  async doRefresh(ev: CustomEvent) {
    await this.load();
    (ev.target as any).complete();
  }
}
