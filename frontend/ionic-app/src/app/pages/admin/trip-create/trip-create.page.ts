import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton, IonIcon,
  IonList, IonSpinner, IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, trashOutline, saveOutline, mapOutline, peopleOutline, personCircleOutline } from 'ionicons/icons';
import { TripsService } from '../../../core/services/trips.service';
import { DriversService } from '../../../core/services/drivers.service';
import { Driver } from '../../../core/models/models';

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

            <ion-item fill="outline" class="ion-margin-bottom">
              <ion-label position="floating">Nombre del viaje</ion-label>
              <ion-input [(ngModel)]="name" name="name" required placeholder="Bogotá - Medellín 18/08"></ion-input>
            </ion-item>

            <ion-item fill="outline" class="ion-margin-bottom">
              <ion-label position="floating">Origen</ion-label>
              <ion-input [(ngModel)]="origin" name="origin" required></ion-input>
            </ion-item>

            <ion-item fill="outline" class="ion-margin-bottom">
              <ion-label position="floating">Destino</ion-label>
              <ion-input [(ngModel)]="destination" name="destination" required></ion-input>
            </ion-item>

            <ion-item fill="outline">
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
})
export class TripCreatePage implements OnInit {
  name = '';
  origin = '';
  destination = '';
  driverId = '';
  drivers = signal<Driver[]>([]);
  passengers = signal<PassengerRow[]>([{ name: '', document: '' }]);
  saving = signal(false);
  error = signal<string | null>(null);

  constructor(
    private tripsService: TripsService,
    private driversService: DriversService,
    private router: Router,
  ) {
    addIcons({ addCircleOutline, trashOutline, saveOutline, mapOutline, peopleOutline, personCircleOutline });
  }

  async ngOnInit() {
    this.drivers.set(await this.driversService.list());
  }

  addPassenger() {
    this.passengers.update((list) => [...list, { name: '', document: '' }]);
  }

  removePassenger(index: number) {
    this.passengers.update((list) => list.filter((_, i) => i !== index));
  }

  async submit() {
    this.error.set(null);
    if (!this.name || !this.origin || !this.destination || !this.driverId) {
      this.error.set('Completa todos los campos obligatorios');
      return;
    }
    this.saving.set(true);
    try {
      const validPassengers = this.passengers().filter((p) => p.name && p.document);
      await this.tripsService.create({
        name: this.name,
        origin: this.origin,
        destination: this.destination,
        driverId: this.driverId,
        passengers: validPassengers,
      });
      this.router.navigate(['/admin/dashboard']);
    } catch (e: any) {
      this.error.set(e?.error?.message || 'No se pudo crear el viaje');
    } finally {
      this.saving.set(false);
    }
  }
}
