import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
  IonBadge, IonSpinner, IonRefresher, IonRefresherContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  settingsOutline, peopleOutline, createOutline, playOutline, navigateOutline,
  flagOutline, checkmarkDoneOutline, busOutline, lockClosedOutline,
} from 'ionicons/icons';
import { TripsService } from '../../../core/services/trips.service';
import { Trip } from '../../../core/models/models';

@Component({
  selector: 'app-my-trip',
  standalone: true,
  imports: [
    CommonModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonButton, IonIcon, IonBadge, IonSpinner, IonRefresher, IonRefresherContent,
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
      } @else if (!trip()) {
        <div class="empty-state">
          <ion-icon name="navigate-outline"></ion-icon>
          <p>No tienes ningún viaje asignado por ahora.</p>
        </div>
      } @else {
        <div class="hero-card">
          <ion-badge style="--background:rgba(255,255,255,.2); color:#fff;">
            {{ trip()!.status === 'PENDING' ? 'Por iniciar' : 'En ruta' }}
          </ion-badge>
          <h2 class="hero-title">{{ trip()!.name }}</h2>
          <p class="hero-route">
            <ion-icon name="navigate-outline"></ion-icon>
            {{ trip()!.origin }} → {{ trip()!.destination }}
          </p>
          <p class="hero-route">
            <ion-icon name="people-outline"></ion-icon>
            {{ trip()!.passengers.length }} pasajeros
          </p>
        </div>

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
            [disabled]="!trip()!.signatureData"
            (click)="startTrip()">
            <ion-icon [name]="trip()!.signatureData ? 'play-outline' : 'lock-closed-outline'" slot="start"></ion-icon>
            Iniciar viaje
          </ion-button>
          @if (!trip()!.signatureData) {
            <p class="lock-hint">
              <ion-icon name="lock-closed-outline"></ion-icon>
              Debes capturar la firma digital antes de poder iniciar el viaje.
            </p>
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
  `],
})
export class MyTripPage implements OnInit {
  trip = signal<Trip | null>(null);
  loading = signal(true);

  constructor(private tripsService: TripsService, private router: Router) {
    addIcons({
      settingsOutline, peopleOutline, createOutline, playOutline, navigateOutline,
      flagOutline, checkmarkDoneOutline, busOutline, lockClosedOutline,
    });
  }

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      const result = await this.tripsService.list(1, 20);
      const active = result.data.find((t) => t.status !== 'FINISHED') || null;
      this.trip.set(active);
    } finally {
      this.loading.set(false);
    }
  }

  hasSignature() {
    return !!this.trip()?.signatureData;
  }

  isInProgress() {
    return this.trip()?.status === 'IN_PROGRESS';
  }

  async startTrip() {
    if (!this.trip()) return;
    const updated = await this.tripsService.start(this.trip()!.id);
    this.trip.set(updated);
  }

  async doRefresh(ev: CustomEvent) {
    await this.load();
    (ev.target as any).complete();
  }
}
