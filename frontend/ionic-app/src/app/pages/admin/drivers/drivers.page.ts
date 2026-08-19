import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonItem, IonLabel, IonInput, IonButton, IonIcon, IonList, IonSpinner, IonText,
  IonAvatar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personAddOutline, copyOutline, checkmarkCircleOutline, personCircleOutline,
  mailOutline, keyOutline,
} from 'ionicons/icons';
import { DriversService } from '../../../core/services/drivers.service';
import { CreatedDriver, Driver } from '../../../core/models/models';

@Component({
  selector: 'app-drivers',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonBackButton, IonItem, IonLabel, IonInput, IonButton, IonIcon,
    IonList, IonSpinner, IonText, IonAvatar,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/admin/dashboard"></ion-back-button></ion-buttons>
        <ion-title>Conductores</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="ion-page-desktop">
        <div class="card-surface">
          <p class="section-title"><ion-icon name="person-add-outline"></ion-icon> Crear nuevo conductor</p>
          <p class="hint-text">
            Las credenciales se generan automáticamente a partir del nombre:
            correo <code>nombre&#64;gmail.com</code> y contraseña <code>driver + nombre</code>.
          </p>

          <form (ngSubmit)="submit()">
            <ion-item fill="outline" class="ion-margin-bottom">
              <ion-icon name="person-circle-outline" slot="start"></ion-icon>
              <ion-label position="floating">Nombre completo</ion-label>
              <ion-input [(ngModel)]="name" name="name" required placeholder="Carlos Ramírez"></ion-input>
            </ion-item>

            @if (error()) {
              <ion-text color="danger"><p class="error-msg">{{ error() }}</p></ion-text>
            }

            <ion-button expand="block" type="submit" [disabled]="saving() || !name.trim()">
              @if (saving()) { <ion-spinner name="dots"></ion-spinner> } @else {
                <ion-icon name="person-add-outline" slot="start"></ion-icon> Crear conductor
              }
            </ion-button>
          </form>
        </div>

        @if (lastCreated()) {
          <div class="card-surface credentials-card ion-margin-top">
            <p class="section-title">
              <ion-icon name="checkmark-circle-outline" color="success"></ion-icon>
              Conductor creado — copia sus credenciales
            </p>
            <p class="hint-text warn">
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

        <p class="section-title ion-margin-top">Conductores registrados ({{ drivers().length }})</p>
        @if (loading()) {
          <div class="empty-state"><ion-spinner></ion-spinner></div>
        } @else if (drivers().length === 0) {
          <p class="empty-state">Aún no hay conductores registrados.</p>
        } @else {
          <ion-list class="list-cards">
            @for (d of drivers(); track d.id) {
              <ion-item lines="none">
                <ion-avatar slot="start" class="driver-avatar">
                  <ion-icon name="person-circle-outline"></ion-icon>
                </ion-avatar>
                <ion-label>
                  <h3>{{ d.name }}</h3>
                  <p>{{ d.email }}</p>
                </ion-label>
              </ion-item>
            }
          </ion-list>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .hint-text {
      font-size: 0.82rem;
      color: var(--app-color-text-muted);
      margin: 0 0 var(--app-space-md);
      code {
        background: var(--app-color-surface-alt);
        padding: 1px 5px;
        border-radius: 4px;
        font-size: 0.78rem;
      }
    }
    .hint-text.warn { color: var(--app-color-warning); }
    .error-msg { font-size: 0.85rem; margin: 0 0 8px; }

    .credentials-card {
      border: 1px solid rgba(var(--app-color-secondary-rgb), .3);
      background: rgba(var(--app-color-secondary-rgb), .05);
    }
    .cred-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 0;
      border-top: 1px dashed var(--app-color-border);
      font-size: 0.88rem;
      &:first-of-type { border-top: none; }
      ion-icon:first-child { color: var(--app-color-secondary); font-size: 18px; }
      span { flex: 1; font-family: monospace; word-break: break-all; }
    }

    .driver-avatar {
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(var(--app-color-primary-rgb), .12);
      color: var(--app-color-primary);
      ion-icon { font-size: 24px; }
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
}
