import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonContent, IonIcon, IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sparklesOutline } from 'ionicons/icons';
import { TripsService } from '../../../core/services/trips.service';
import { ReportsService } from '../../../core/services/reports.service';
import { Trip, TripReport, IncidentType } from '../../../core/models/models';
import { PhoneShellComponent } from '../../../shared/components/phone-shell.component';
import { StatCardComponent } from '../../../shared/components/stat-card.component';
import { StatusPillComponent } from '../../../shared/components/status-pill.component';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';

const INCIDENT_TYPE_LABEL: Record<IncidentType, string> = {
  DELAY: 'Retraso',
  PASSENGER_ISSUE: 'Problema con pasajeros',
  DETOUR: 'Desvío',
  OTHER: 'Otro',
};

@Component({
  selector: 'app-close-trip',
  standalone: true,
  imports: [
    CommonModule, RouterLink, IonContent, IonIcon, IonSpinner,
    PhoneShellComponent, StatCardComponent, StatusPillComponent, MoneyPipe,
  ],
  template: `
    <ion-content>
      <app-phone-shell title="Cierre de viaje" [backLink]="['/driver/my-trip', tripId]">
      @if (!report()) {
        <div class="card-surface intro-card">
          <ion-icon name="sparkles-outline"></ion-icon>
          <p>Al cerrar el viaje se generará un reporte resumen con pasajeros transportados, gastos totales y novedades.</p>
        </div>
        <button type="button" class="btn btn--primary btn--block" (click)="finish()" [disabled]="saving()">
          @if (saving()) { <ion-spinner name="dots"></ion-spinner> } @else {
            Cerrar viaje y generar reporte
          }
        </button>
      } @else {
        <div class="hero-card hero-card--gradient">
          <span class="hero-badge">Finalizado</span>
          <h2 class="hero-title">
            {{ report()!.trip.origin }}
            @for (s of report()!.trip.stops; track s.id) { → {{ s.city }} }
            → {{ report()!.trip.destination }}
          </h2>
          <p class="hero-sub">Viaje cerrado correctamente</p>
        </div>

        <div class="stat-grid report-stats">
          <app-stat-card
            [value]="report()!.passengers.boarded + '/' + report()!.passengers.total"
            label="Pasajeros transportados"
            tone="primary"></app-stat-card>
          <app-stat-card
            [value]="report()!.expenses.total | money"
            [label]="'Total de gastos (' + report()!.expenses.count + ')'"
            tone="warning"></app-stat-card>
          <app-stat-card
            [value]="report()!.incidents.total"
            label="Novedades reportadas"
            tone="info"></app-stat-card>
        </div>

        @if (report()!.trip.signatureData) {
          <p class="list-heading">Firma del despachador/cliente</p>
          <div class="card-surface signature-card">
            <img [src]="report()!.trip.signatureData" alt="Firma digital" />
          </div>
        }

        @if (report()!.trip.stops && report()!.trip.stops!.length > 0) {
          <p class="list-heading">Pasajeros por parada</p>
          <div class="card-surface report-card">
            <div class="stop-summary-row">
              <span>Abordaron en el origen ({{ report()!.trip.origin }})</span>
              <span class="count-pill">{{ report()!.passengers.boardedAtOrigin }}</span>
            </div>
            @for (s of report()!.passengers.byStop; track s.stopId) {
              <div class="stop-summary-row">
                <span>Abordaron en {{ s.city }}</span>
                <span class="count-pill">{{ s.boarded }}</span>
              </div>
            }
          </div>
        }

        <p class="list-heading">Pasajeros ({{ report()!.passengers.total }})</p>
        <div class="card-surface report-card">
          @for (p of report()!.passengers.list; track p.id) {
            <div class="passenger-row">
              <div>
                <strong>{{ p.name }}</strong>
                <span>{{ p.document }}</span>
              </div>
              <app-status-pill [boarding]="p"></app-status-pill>
            </div>
          }
        </div>

        @if (report()!.incidents.list.length > 0) {
          <p class="list-heading">Novedades</p>
          <div class="card-surface report-card">
            @for (n of report()!.incidents.list; track n.id) {
              <div class="incident-row">
                <strong>{{ incidentTypeLabel(n.type) }}</strong>
                <span>{{ n.description }}</span>
              </div>
            }
          </div>
        }

        <button type="button" class="btn btn--ghost btn--block back-btn" routerLink="/driver/my-trip">
          Volver a Mi Viaje
        </button>
      }
      </app-phone-shell>
    </ion-content>
  `,
  styles: [`
    /* Pantalla previa al cierre: icono grande + explicación centrada. */
    .intro-card {
      text-align: center;
      color: var(--app-color-text-muted);
      padding: 32px 24px;
      margin-bottom: var(--app-space-md);
      ion-icon { font-size: 30px; color: var(--app-color-primary); margin-bottom: 14px; }
      p { margin: 0; font-size: 0.84rem; line-height: 1.5; }
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
      font-size: 1.1rem; font-weight: 800; margin: 10px 0 4px;
    }
    .hero-sub { opacity: 0.9; margin: 0; font-size: 0.82rem; }

    .report-stats { margin-top: var(--app-space-md); }
    .list-heading {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--app-color-text);
      margin: var(--app-space-md) 0 10px;
    }
    .report-card { padding: 14px; }
    .signature-card {
      background: #fff;
      padding: 14px;
      display: flex;
      justify-content: center;
      img { max-width: 100%; max-height: 140px; }
    }
    .count-pill {
      background: var(--app-color-surface-alt);
      color: var(--app-color-text-muted);
      font-size: 0.72rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: var(--app-radius-full);
      flex-shrink: 0;
    }
    .incident-row {
      display: flex; flex-direction: column; gap: 2px;
      padding: 10px 0;
      border-bottom: 1px solid var(--app-color-border);
      &:last-child { border-bottom: none; }
      strong { font-size: 0.84rem; color: var(--app-color-text); }
      span { font-size: 0.8rem; color: var(--app-color-text-muted); }
    }
    .stop-summary-row {
      display: flex; align-items: center; justify-content: space-between;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid var(--app-color-border);
      font-size: 0.82rem;
      color: var(--app-color-text);
      &:last-child { border-bottom: none; }
    }
    .passenger-row {
      display: flex; align-items: center; justify-content: space-between;
      gap: 10px;
      padding: 9px 0;
      border-bottom: 1px solid var(--app-color-border);
      &:last-child { border-bottom: none; }
      div { display: flex; flex-direction: column; min-width: 0; }
      strong { font-size: 0.84rem; color: var(--app-color-text); }
      span { font-size: 0.76rem; color: var(--app-color-text-muted); }
    }
    .back-btn { margin-top: var(--app-space-lg); }
  `],
})
export class CloseTripPage implements OnInit {
  trip = signal<Trip | null>(null);
  report = signal<TripReport | null>(null);
  saving = signal(false);
  /** Se expone para que el botón de volver regrese a ESTE viaje, no al listado. */
  tripId = '';

  constructor(
    private route: ActivatedRoute,
    private tripsService: TripsService,
    private reportsService: ReportsService,
  ) {
    addIcons({ sparklesOutline });
  }

  incidentTypeLabel(type: IncidentType): string {
    return INCIDENT_TYPE_LABEL[type] ?? type;
  }

  async ngOnInit() {
    this.tripId = this.route.snapshot.paramMap.get('id')!;
    this.trip.set(await this.tripsService.getById(this.tripId));
    if (this.trip()?.status === 'FINISHED') {
      this.report.set(await this.reportsService.getTripReport(this.tripId));
    }
  }

  async finish() {
    this.saving.set(true);
    try {
      await this.tripsService.finish(this.tripId);
      this.report.set(await this.reportsService.getTripReport(this.tripId));
    } finally {
      this.saving.set(false);
    }
  }
}
