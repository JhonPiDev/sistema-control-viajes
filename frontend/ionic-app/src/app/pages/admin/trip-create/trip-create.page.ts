import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton, IonIcon,
  IonList, IonSpinner, IonText, ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addCircleOutline, trashOutline, saveOutline, mapOutline, peopleOutline,
  personCircleOutline, locationOutline, flagOutline, chevronForwardOutline,
} from 'ionicons/icons';
import { TripsService } from '../../../core/services/trips.service';
import { DriversService } from '../../../core/services/drivers.service';
import { Driver } from '../../../core/models/models';
import { CityPickerComponent } from '../../../shared/components/city-picker.component';

interface PassengerRow { name: string; document: string; }

@Component({
  selector: 'app-trip-create',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonBackButton, IonItem, IonLabel, IonInput, IonSelect,
    IonSelectOption, IonButton, IonIcon, IonList, IonSpinner, IonText,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/admin/dashboard"></ion-back-button></ion-buttons>
        <ion-title>Nuevo Viaje</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="ion-page-desktop">
        <form (ngSubmit)="submit()">
          <div class="card-surface">
            <p class="section-title"><ion-icon name="map-outline"></ion-icon> Datos del viaje</p>

            <button type="button" class="route-field" (click)="pickOrigin()">
              <ion-icon name="location-outline"></ion-icon>
              <div class="route-field-text">
                <span class="route-field-label">Origen</span>
                <span class="route-field-value" [class.placeholder]="!origin">{{ origin || 'Elige una ciudad' }}</span>
              </div>
              <ion-icon name="chevron-forward-outline" class="chev"></ion-icon>
            </button>

            <button type="button" class="route-field" (click)="pickDestination()">
              <ion-icon name="flag-outline"></ion-icon>
              <div class="route-field-text">
                <span class="route-field-label">Destino</span>
                <span class="route-field-value" [class.placeholder]="!destination">{{ destination || 'Elige una ciudad' }}</span>
              </div>
              <ion-icon name="chevron-forward-outline" class="chev"></ion-icon>
            </button>

            @if (tripName()) {
              <p class="name-preview">
                Nombre del viaje: <strong>{{ tripName() }}</strong>
              </p>
            }

            <ion-item fill="outline" class="ion-margin-top">
              <ion-icon name="person-circle-outline" slot="start"></ion-icon>
              <ion-label position="floating">Conductor asignado</ion-label>
              <ion-select [(ngModel)]="driverId" name="driverId" required>
                @for (d of drivers(); track d.id) {
                  <ion-select-option [value]="d.id">{{ d.name }}</ion-select-option>
                }
              </ion-select>
            </ion-item>
          </div>

          <div class="card-surface ion-margin-top">
            <p class="section-title"><ion-icon name="location-outline"></ion-icon> Paradas intermedias</p>
            <p class="hint">Si el viaje pasa por otras terminales antes de llegar al destino, agrégalas en orden.</p>
            @if (stops().length > 0) {
              <ion-list class="list-cards">
                @for (s of stops(); track $index) {
                  <ion-item lines="none">
                    <ion-label>
                      <p class="stop-order">Parada {{ $index + 1 }}</p>
                      <h3>{{ s }}</h3>
                    </ion-label>
                    <ion-button fill="clear" color="danger" slot="end" (click)="removeStop($index)" type="button">
                      <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                    </ion-button>
                  </ion-item>
                }
              </ion-list>
            }
            <ion-button fill="outline" size="small" (click)="addStop()" type="button">
              <ion-icon name="add-circle-outline" slot="start"></ion-icon>
              Agregar parada
            </ion-button>
          </div>

          <div class="card-surface ion-margin-top">
            <p class="section-title"><ion-icon name="people-outline"></ion-icon> Lista de pasajeros</p>
            <ion-list class="list-cards">
              @for (p of passengers(); track $index) {
                <ion-item lines="none">
                  <ion-input placeholder="Nombre" [(ngModel)]="p.name" [name]="'pname'+$index"></ion-input>
                  <ion-input placeholder="Documento" [(ngModel)]="p.document" [name]="'pdoc'+$index"></ion-input>
                  <ion-button fill="clear" color="danger" slot="end" (click)="removePassenger($index)">
                    <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                  </ion-button>
                </ion-item>
              }
            </ion-list>
            <ion-button fill="outline" size="small" (click)="addPassenger()" type="button">
              <ion-icon name="add-circle-outline" slot="start"></ion-icon>
              Agregar pasajero
            </ion-button>
          </div>

          @if (error()) {
            <ion-text color="danger"><p class="ion-margin-top">{{ error() }}</p></ion-text>
          }

          <ion-button expand="block" type="submit" class="ion-margin-top" [disabled]="saving()">
            @if (saving()) { <ion-spinner name="dots"></ion-spinner> } @else {
              <ion-icon name="save-outline" slot="start"></ion-icon> Crear viaje
            }
          </ion-button>
        </form>
      </div>
    </ion-content>
  `,
  styles: [`
    .hint {
      color: var(--app-color-text-muted);
      font-size: 0.82rem;
      margin: -4px 0 var(--app-space-sm);
    }
    .route-field {
      display: flex; align-items: center; gap: 12px;
      width: 100%;
      text-align: left;
      background: var(--app-color-surface);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-md);
      padding: 12px 14px;
      font-family: inherit;
      cursor: pointer;
      margin-bottom: 10px;
      > ion-icon:first-child { font-size: 20px; color: var(--app-color-primary); flex-shrink: 0; }
    }
    .route-field-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .route-field-label { font-size: 0.72rem; color: var(--app-color-text-muted); }
    .route-field-value { font-size: 0.95rem; color: var(--app-color-text); font-weight: 600; }
    .route-field-value.placeholder { font-weight: 400; color: var(--app-color-text-muted); }
    .chev { color: var(--app-color-text-muted); font-size: 16px; }
    .stop-order { font-size: 0.72rem; color: var(--app-color-text-muted); margin: 0 0 2px; }
    .name-preview {
      font-size: 0.85rem;
      color: var(--app-color-text-muted);
      margin: -2px 0 var(--app-space-sm) 2px;
      strong { color: var(--app-color-text); }
    }
  `],
})
export class TripCreatePage implements OnInit {
  origin = '';
  destination = '';
  driverId = '';
  drivers = signal<Driver[]>([]);
  passengers = signal<PassengerRow[]>([{ name: '', document: '' }]);
  stops = signal<string[]>([]);
  saving = signal(false);
  error = signal<string | null>(null);

  constructor(
    private tripsService: TripsService,
    private driversService: DriversService,
    private router: Router,
    private modalCtrl: ModalController,
  ) {
    addIcons({
      addCircleOutline, trashOutline, saveOutline, mapOutline, peopleOutline,
      personCircleOutline, locationOutline, flagOutline, chevronForwardOutline,
    });
  }

  async ngOnInit() {
    this.drivers.set(await this.driversService.list());
  }

  private async pickCity(title: string): Promise<string | null> {
    const modal = await this.modalCtrl.create({ component: CityPickerComponent, componentProps: { title } });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<string>();
    return role === 'select' && data ? data : null;
  }

  async pickOrigin() {
    const city = await this.pickCity('Elige el origen');
    if (city) this.origin = city;
  }

  async pickDestination() {
    const city = await this.pickCity('Elige el destino');
    if (city) this.destination = city;
  }

  /** El nombre del viaje ya no se digita: se arma solo como "Origen - Destino". */
  tripName(): string {
    if (!this.origin || !this.destination) return '';
    return `${this.origin} - ${this.destination}`;
  }

  async addStop() {
    const city = await this.pickCity('Elige la parada');
    if (city) this.stops.update((list) => [...list, city]);
  }

  removeStop(index: number) {
    this.stops.update((list) => list.filter((_, i) => i !== index));
  }

  addPassenger() {
    this.passengers.update((list) => [...list, { name: '', document: '' }]);
  }

  removePassenger(index: number) {
    this.passengers.update((list) => list.filter((_, i) => i !== index));
  }

  async submit() {
    this.error.set(null);
    if (!this.origin || !this.destination || !this.driverId) {
      this.error.set('Completa todos los campos obligatorios');
      return;
    }
    this.saving.set(true);
    try {
      const validPassengers = this.passengers().filter((p) => p.name && p.document);
      await this.tripsService.create({
        name: this.tripName(),
        origin: this.origin,
        destination: this.destination,
        driverId: this.driverId,
        passengers: validPassengers,
        stops: this.stops(),
      });
      this.router.navigate(['/admin/dashboard']);
    } catch (e: any) {
      this.error.set(e?.error?.message || 'No se pudo crear el viaje');
    } finally {
      this.saving.set(false);
    }
  }
}
