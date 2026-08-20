import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonBadge, IonList, IonItem, IonLabel, IonIcon, IonSpinner, IonRefresher,
  IonRefresherContent, IonChip, IonButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, cashOutline, alertCircleOutline, checkmarkCircleOutline,
  closeCircleOutline, timeOutline, navigateOutline, personCircleOutline,
  createOutline,
} from 'ionicons/icons';
import { TripsService } from '../../../core/services/trips.service';
import { ExpensesService } from '../../../core/services/expenses.service';
import { IncidentsService } from '../../../core/services/incidents.service';
import { Trip, Expense, Incident, Passenger } from '../../../core/models/models';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonBackButton, IonBadge, IonList, IonItem, IonLabel, IonIcon, IonSpinner,
    IonRefresher, IonRefresherContent, IonChip, IonButton,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/admin/dashboard"></ion-back-button></ion-buttons>
        <ion-title>{{ trip()?.name || 'Viaje' }}</ion-title>
        @if (trip()?.status === 'PENDING') {
          <ion-buttons slot="end">
            <ion-button [routerLink]="['/admin/trips', trip()!.id, 'edit']">
              <ion-icon slot="icon-only" name="create-outline"></ion-icon>
            </ion-button>
          </ion-buttons>
        }
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="ion-page-desktop ion-padding">
        @if (!trip()) {
          <div class="empty-state"><ion-spinner></ion-spinner></div>
        } @else {
          <div class="hero-card">
            <ion-chip [color]="statusColor()" style="--background:rgba(255,255,255,.18); color:#fff; font-weight:700;">
              {{ statusLabel() }}
            </ion-chip>
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

          <div class="card-surface ion-margin-top">
            <p class="section-title">
              <ion-icon name="person-outline"></ion-icon>
              Pasajeros ({{ trip()!.passengers.length }})
            </p>
            <ion-list class="list-cards">
              @for (p of trip()!.passengers; track p.id) {
                <ion-item lines="none">
                  <ion-icon
                    slot="start"
                    [name]="p.boardingStatus === 'BOARDED' ? 'checkmark-circle-outline' : p.boardingStatus === 'ABSENT' ? 'close-circle-outline' : 'time-outline'"
                    [color]="p.boardingStatus === 'BOARDED' ? 'success' : p.boardingStatus === 'ABSENT' ? 'danger' : 'medium'">
                  </ion-icon>
                  <ion-label>
                    <h3>{{ p.name }}</h3>
                    <p>{{ p.document }}</p>
                    <p>{{ boardingLabel(p) }}</p>
                  </ion-label>
                </ion-item>
              }
            </ion-list>
          </div>

          @if (trip()!.signatureData) {
            <div class="card-surface ion-margin-top">
              <p class="section-title"><ion-icon name="create-outline"></ion-icon> Firma del despachador/cliente</p>
              <div class="signature-frame">
                <img [src]="trip()!.signatureData" alt="Firma digital" />
              </div>
            </div>
          }

          <div class="card-surface ion-margin-top">
            <p class="section-title"><ion-icon name="cash-outline"></ion-icon> Gastos reportados</p>
            @if (expenses().length === 0) {
              <p class="empty-state">Sin gastos reportados aún.</p>
            } @else {
              <ion-list class="list-cards">
                @for (e of expenses(); track e.id) {
                  <ion-item lines="none">
                    <ion-label>
                      <h3>{{ e.concept }}</h3>
                      <p>{{ e.type }}</p>
                    </ion-label>
                    <ion-badge slot="end" color="warning">{{ e.amount | number:'1.0-0' }}</ion-badge>
                  </ion-item>
                }
              </ion-list>
            }
          </div>

          <div class="card-surface ion-margin-top">
            <p class="section-title"><ion-icon name="alert-circle-outline"></ion-icon> Novedades</p>
            @if (incidents().length === 0) {
              <p class="empty-state">Sin novedades reportadas aún.</p>
            } @else {
              <ion-list class="list-cards">
                @for (n of incidents(); track n.id) {
                  <ion-item lines="none">
                    <ion-label>
                      <h3>{{ n.type }}</h3>
                      <p>{{ n.description }}</p>
                    </ion-label>
                  </ion-item>
                }
              </ion-list>
            }
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .hero-title {
      font-family: var(--app-font-family-heading);
      font-size: 1.4rem;
      font-weight: 800;
      margin: 10px 0 6px;
    }
    .hero-route, .hero-driver {
      display: flex; align-items: center; gap: 6px;
      margin: 4px 0;
      opacity: 0.95;
      font-size: 0.92rem;
    }
    .signature-frame {
      background: #fff;
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-md);
      padding: 10px;
      display: flex;
      justify-content: center;
      img { max-width: 100%; max-height: 160px; }
    }
  `],
})
export class TripDetailPage implements OnInit {
  trip = signal<Trip | null>(null);
  expenses = signal<Expense[]>([]);
  incidents = signal<Incident[]>([]);
  private tripId = '';

  constructor(
    private route: ActivatedRoute,
    private tripsService: TripsService,
    private expensesService: ExpensesService,
    private incidentsService: IncidentsService,
  ) {
    addIcons({
      personOutline, cashOutline, alertCircleOutline, checkmarkCircleOutline,
      closeCircleOutline, timeOutline, navigateOutline, personCircleOutline,
      createOutline,
    });
  }

  async ngOnInit() {
    this.tripId = this.route.snapshot.paramMap.get('id')!;
    await this.load();
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

  boardingLabel(p: Passenger): string {
    if (p.boardingStatus === 'BOARDED') {
      return p.stop ? `Abordó en parada: ${p.stop.city}` : 'Abordó en el origen';
    }
    if (p.boardingStatus === 'ABSENT') return 'No se presentó';
    return p.stop ? `Pendiente · sube en parada: ${p.stop.city}` : 'Pendiente en el origen';
  }

  statusLabel() {
    const s = this.trip()?.status;
    return s === 'PENDING' ? 'Pendiente' : s === 'IN_PROGRESS' ? 'En ruta' : 'Finalizado';
  }

  statusColor() {
    const s = this.trip()?.status;
    return s === 'PENDING' ? 'medium' : s === 'IN_PROGRESS' ? 'warning' : 'success';
  }

  async doRefresh(ev: CustomEvent) {
    await this.load();
    (ev.target as any).complete();
  }
}
