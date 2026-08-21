import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonButton, IonIcon, IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personAddOutline, copyOutline, checkmarkCircleOutline, personCircleOutline,
  mailOutline, keyOutline,
} from 'ionicons/icons';
import { DriversService } from '../../../core/services/drivers.service';
import { CreatedDriver, Driver } from '../../../core/models/models';
import { AdminPageComponent } from '../../../shared/components/admin-page.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';

@Component({
  selector: 'app-drivers',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonButton, IonIcon, IonSpinner,
    AdminPageComponent, EmptyStateComponent,
  ],
  template: `
    <ion-content>
      <app-admin-page
        title="Conductores"
        subtitle="Da de alta y consulta quién maneja cada viaje"
        [maxWidth]="840">
        <div class="card-surface form-card">
          <p class="card-title">Crear nuevo conductor</p>
          <p class="card-hint">
            Las credenciales se generan a partir del nombre: correo
            <code>nombre&#64;gmail.com</code> y contraseña <code>driver + nombre</code>.
          </p>

          <form (ngSubmit)="submit()">
            <label class="field-label" for="driver-name">Nombre completo</label>
            <input
              id="driver-name"
              class="field-control"
              [(ngModel)]="name"
              name="name"
              required
              placeholder="Ej. Carlos Ramírez" />

            @if (error()) {
              <p class="field-error">{{ error() }}</p>
            }

            <button type="submit" class="btn btn--primary btn--block submit-btn" [disabled]="saving() || !name.trim()">
              @if (saving()) { <ion-spinner name="dots"></ion-spinner> } @else {
                Crear conductor
              }
            </button>
          </form>
        </div>

        @if (lastCreated()) {
          <div class="card-surface credentials-card">
            <p class="card-title cred-title">
              <ion-icon name="checkmark-circle-outline"></ion-icon>
              Conductor creado — copia sus credenciales
            </p>
            <p class="card-hint warn">
              Esta contraseña solo se muestra esta vez. Guárdala o compártela con
              {{ lastCreated()!.name }} ahora mismo.
            </p>
            <div class="cred-row">
              <ion-icon name="mail-outline"></ion-icon>
              <span>{{ lastCreated()!.email }}</span>
              <ion-button fill="clear" size="small" (click)="copy(lastCreated()!.email)">
                <ion-icon name="copy-outline" slot="icon-only"></ion-icon>
              </ion-button>
            </div>
            <div class="cred-row">
              <ion-icon name="key-outline"></ion-icon>
              <span>{{ lastCreated()!.generatedPassword }}</span>
              <ion-button fill="clear" size="small" (click)="copy(lastCreated()!.generatedPassword)">
                <ion-icon name="copy-outline" slot="icon-only"></ion-icon>
              </ion-button>
            </div>
          </div>
        }

        <p class="list-heading">Conductores registrados ({{ drivers().length }})</p>
        @if (loading()) {
          <app-empty-state loading></app-empty-state>
        } @else if (drivers().length === 0) {
          <app-empty-state text="Aún no hay conductores registrados."></app-empty-state>
        } @else {
          <div class="data-list">
            @for (d of drivers(); track d.id) {
              <div class="data-row">
                <div class="avatar-initials">{{ initials(d.name) }}</div>
                <div class="data-row__text">
                  <div class="data-row__title">{{ d.name }}</div>
                  <div class="data-row__meta">{{ d.email }}</div>
                </div>
              </div>
            }
          </div>
        }
      </app-admin-page>
    </ion-content>
  `,
  styles: [`
    .form-card { margin-bottom: var(--app-space-lg); }
    .submit-btn { margin-top: var(--app-space-md); }

    .list-heading {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--app-color-text);
      margin: var(--app-space-lg) 0 10px;
    }

    .credentials-card {
      border-color: rgba(var(--app-color-secondary-rgb), .35);
      background: rgba(var(--app-color-secondary-rgb), .05);
      margin-bottom: var(--app-space-lg);
    }
    .cred-title {
      display: flex; align-items: center; gap: 8px;
      ion-icon { color: var(--app-color-secondary); font-size: 18px; }
    }
    .card-hint.warn { color: var(--app-color-warning); }
    .cred-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 0;
      border-top: 1px dashed var(--app-color-border);
      font-size: 0.85rem;
      &:first-of-type { border-top: none; }
      ion-icon:first-child { color: var(--app-color-secondary); font-size: 18px; }
      span { flex: 1; font-family: monospace; word-break: break-all; }
    }
  `],
})
export class DriversPage implements OnInit {
  name = '';
  drivers = signal<Driver[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  lastCreated = signal<CreatedDriver | null>(null);

  constructor(private driversService: DriversService) {
    addIcons({
      personAddOutline, copyOutline, checkmarkCircleOutline, personCircleOutline,
      mailOutline, keyOutline,
    });
  }

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      this.drivers.set(await this.driversService.list());
    } finally {
      this.loading.set(false);
    }
  }

  async submit() {
    if (!this.name.trim()) return;
    this.error.set(null);
    this.saving.set(true);
    try {
      const created = await this.driversService.create(this.name.trim());
      this.lastCreated.set(created);
      this.name = '';
      await this.load();
    } catch (e: any) {
      this.error.set(e?.error?.message || 'No se pudo crear el conductor');
    } finally {
      this.saving.set(false);
    }
  }

  copy(text: string) {
    navigator.clipboard?.writeText(text);
  }

  /** Iniciales para el avatar circular de la lista (máx. 2 letras). */
  initials(name: string): string {
    return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
