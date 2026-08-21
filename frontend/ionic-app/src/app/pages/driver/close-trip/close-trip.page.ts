import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner, IonBadge,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkDoneOutline, peopleOutline, cashOutline, alertCircleOutline, sparklesOutline, createOutline, navigateOutline } from 'ionicons/icons';
import { TripsService } from '../../../core/services/trips.service';
import { ReportsService } from '../../../core/services/reports.service';
import { Trip, TripReport, Passenger } from '../../../core/models/models';

@Component({
  selector: 'app-close-trip',
  standalone: true,
  imports: [
    CommonModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonBackButton, IonButton, IonIcon, IonSpinner, IonBadge,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/driver/my-trip"></ion-back-button></ion-buttons>
        <ion-title>Cierre de Viaje</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (!report()) {
        <div class="card-surface intro-card">
          <ion-icon name="sparkles-outline"></ion-icon>
          <p>Al cerrar el viaje se generará un reporte resumen con pasajeros transportados, gastos totales y novedades.</p>
        </div>
        <ion-button expand="block" color="success" (click)="finish()" [disabled]="saving()">
          @if (saving()) { <ion-spinner name="dots"></ion-spinner> } @else {
            <ion-icon name="checkmark-done-outline" slot="start"></ion-icon> Cerrar viaje y generar reporte
          }
        </ion-button>
      } @else {
        <div class="hero-card hero-card--warm">
          <ion-icon name="checkmark-done-outline" style="font-size:32px;"></ion-icon>
          <h2 class="hero-title">Reporte de {{ report()!.trip.name }}</h2>
          <p class="hero-sub">Viaje cerrado correctamente</p>
          <p class="hero-route">
            <ion-icon name="navigate-outline"></ion-icon>
            {{ report()!.trip.origin }}
            @for (s of report()!.trip.stops; track s.id) { → {{ s.city }} }
            → {{ report()!.trip.destination }}
          </p>
        </div>

        <div class="stat-grid ion-margin-top">
          <div class="stat-card">
            <div class="stat-icon icon-avatar--tertiary">
              <ion-icon name="people-outline"></ion-icon>
            </div>
            <span class="stat-value">{{ report()!.passengers.boarded }}/{{ report()!.passengers.total }}</span>
            <span class="stat-label">Pasajeros transportados</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-avatar--warning">
              <ion-icon name="cash-outline"></ion-icon>
            </div>
            <span class="stat-value">{{ report()!.expenses.total }}</span>
            <span class="stat-label">Total de gastos ({{ report()!.expenses.count }})</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-avatar--accent">
              <ion-icon name="alert-circle-outline"></ion-icon>
            </div>
            <span class="stat-value">{{ report()!.incidents.total }}</span>
            <span class="stat-label">Novedades reportadas</span>
          </div>
        </div>

        @if (report()!.trip.signatureData) {
          <div class="card-surface ion-margin-top">
            <p class="section-title"><ion-icon name="create-outline"></ion-icon> Firma del despachador/cliente</p>
            <div class="signature-frame">
              <img [src]="report()!.trip.signatureData" alt="Firma digital" />
            </div>
          </div>
        }

        @if (report()!.trip.stops && report()!.trip.stops!.length > 0) {
          <div class="card-surface ion-margin-top">
            <p class="section-title"><ion-icon name="navigate-outline"></ion-icon> Pasajeros por parada</p>
            <div class="stop-summary-row">
              <span>Abordaron en el origen ({{ report()!.trip.origin }})</span>
              <ion-badge color="medium">{{ report()!.passengers.boardedAtOrigin }}</ion-badge>
            </div>
            @for (s of report()!.passengers.byStop; track s.stopId) {
              <div class="stop-summary-row">
                <span>Abordaron en {{ s.city }}</span>
                <ion-badge color="tertiary">{{ s.boarded }}</ion-badge>
              </div>
            }
          </div>
        }

        <div class="card-surface ion-margin-top">
          <p class="section-title"><ion-icon name="people-outline"></ion-icon> Detalle de pasajeros</p>
          @for (p of report()!.passengers.list; track p.id) {
            <div class="passenger-row">
              <div>
                <strong>{{ p.name }}</strong>
                <span>{{ p.document }}</span>
              </div>
              <ion-badge [color]="boardingColor(p)">{{ boardingLabel(p) }}</ion-badge>
            </div>
          }
        </div>

        @if (report()!.incidents.list.length > 0) {
          <div class="card-surface ion-margin-top">
            <p class="section-title"><ion-icon name="alert-circle-outline"></ion-icon> Detalle de novedades</p>
            @for (n of report()!.incidents.list; track n.id) {
              <div class="incident-row">
                <strong>{{ n.type }}</strong>
                <span>{{ n.description }}</span>
              </div>
            }
          </div>
        }

        <ion-button expand="block" fill="outline" class="ion-margin-top" routerLink="/driver/my-trip">
          Volver a Mi Viaje
        </ion-button>
      }
    </ion-content>
  `,
  styles: [`
    .intro-card {
      text-align: center;
      color: var(--app-color-text-muted);
      ion-icon { font-size: 36px; color: var(--app-color-primary); margin-bottom: 8px; }
      p { margin: 0; }
    }
    .hero-title {
      font-family: var(--app-font-family-heading);
      font-size: 1.3rem; font-weight: 800; margin: 8px 0 4px;
    }
    .hero-sub { opacity: 0.9; margin: 0; font-size: 0.9rem; }
    .hero-route {
      display: flex; align-items: center; gap: 6px;
      margin: 6px 0 0; opacity: 0.95; font-size: 0.85rem;
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
    .incident-row {
      display: flex; flex-direction: column; gap: 2px;
      padding: 10px 0;
      border-bottom: 1px solid var(--app-color-border);
      &:last-child { border-bottom: none; }
      strong { font-size: 0.85rem; color: var(--app-color-text); }
      span { font-size: 0.85rem; color: var(--app-color-text-muted); }
    }
    .stop-summary-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--app-color-border);
      font-size: 0.85rem;
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
      strong { font-size: 0.87rem; color: var(--app-color-text); }
      span { font-size: 0.78rem; color: var(--app-color-text-muted); }
      ion-badge { flex-shrink: 0; }
    }
  `],
})
export class CloseTripPage implements OnInit {
  trip = signal<Trip | null>(null);
  report = signal<TripReport | null>(null);
  saving = signal(false);
  private tripId = '';

  constructor(
    private route: ActivatedRoute,
    private tripsService: TripsService,
    private reportsService: ReportsService,
  ) {
    addIcons({ checkmarkDoneOutline, peopleOutline, cashOutline, alertCircleOutline, sparklesOutline, createOutline, navigateOutline });
  }

  boardingLabel(p: Passenger): string {
    if (p.boardingStatus === 'BOARDED') {
      return p.stop ? `Abordó en parada: ${p.stop.city}` : 'Abordó en el origen';
    }
    if (p.boardingStatus === 'ABSENT') return 'No se presentó';
    return 'Pendiente';
  }

  boardingColor(p: Passenger): string {
    if (p.boardingStatus === 'BOARDED') return p.stop ? 'tertiary' : 'success';
    if (p.boardingStatus === 'ABSENT') return 'danger';
    return 'medium';
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
