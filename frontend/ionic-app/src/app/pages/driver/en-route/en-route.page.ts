import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonSegment, IonSegmentButton, IonLabel, IonItem, IonInput, IonSelect,
  IonSelectOption, IonTextarea, IonButton, IonIcon, IonList, IonBadge, IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cashOutline, alertCircleOutline, addOutline, locationOutline,
  personAddOutline, peopleOutline,
} from 'ionicons/icons';
import { ExpensesService } from '../../../core/services/expenses.service';
import { IncidentsService } from '../../../core/services/incidents.service';
import { PassengersService } from '../../../core/services/passengers.service';
import { TripsService } from '../../../core/services/trips.service';
import { Expense, ExpenseType, Incident, IncidentType, Passenger, Trip } from '../../../core/models/models';

@Component({
  selector: 'app-en-route',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonBackButton, IonSegment, IonSegmentButton, IonLabel, IonItem,
    IonInput, IonSelect, IonSelectOption, IonTextarea, IonButton, IonIcon,
    IonList, IonBadge, IonSpinner,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/driver/my-trip"></ion-back-button></ion-buttons>
        <ion-title>En Ruta</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="tab()" (ionChange)="tab.set($any($event.detail.value))" scrollable="true">
          <ion-segment-button value="stops">
            <ion-icon name="location-outline"></ion-icon>
            <ion-label>Paradas</ion-label>
          </ion-segment-button>
          <ion-segment-button value="expenses">
            <ion-icon name="cash-outline"></ion-icon>
            <ion-label>Gastos</ion-label>
          </ion-segment-button>
          <ion-segment-button value="incidents">
            <ion-icon name="alert-circle-outline"></ion-icon>
            <ion-label>Novedades</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (tab() === 'stops') {
        @if (!trip()) {
          <div class="empty-state"><ion-spinner></ion-spinner></div>
        } @else {
          <p class="hint">
            Este viaje va de <strong>{{ trip()!.origin }}</strong> a <strong>{{ trip()!.destination }}</strong>{{ trip()!.stops.length ? ', pasando por:' : '.' }}
          </p>

          @if (trip()!.stops.length === 0) {
            <p class="empty-state">Este viaje no tiene paradas intermedias planeadas.</p>
          } @else {
            <ion-list class="list-cards">
              @for (s of trip()!.stops; track s.id) {
                <ion-item lines="none" class="stop-item">
                  <ion-label>
                    <p class="stop-order">Parada {{ s.order }}</p>
                    <h3>{{ s.city }}</h3>
                    <p>
                      <ion-icon name="people-outline"></ion-icon>
                      {{ passengersAtStop(s.id).length }} pasajero(s) abordaron aquí
                    </p>
                  </ion-label>
                  <ion-button
                    slot="end" fill="outline" size="small"
                    (click)="toggleAddForm(s.id)">
                    <ion-icon name="person-add-outline" slot="start"></ion-icon>
                    Agregar
                  </ion-button>
                </ion-item>

                @if (addingAtStopId() === s.id) {
                  <div class="card-surface add-passenger-form">
                    <ion-item fill="outline">
                      <ion-label position="floating">Nombre</ion-label>
                      <ion-input [(ngModel)]="newPassengerName" [name]="'name-'+s.id"></ion-input>
                    </ion-item>
                    <ion-item fill="outline" class="ion-margin-bottom">
                      <ion-label position="floating">Documento</ion-label>
                      <ion-input [(ngModel)]="newPassengerDocument" [name]="'doc-'+s.id"></ion-input>
                    </ion-item>
                    @if (addError()) {
                      <p class="error-hint">{{ addError() }}</p>
                    }
                    <ion-button expand="block" (click)="addPassengerAtStop(s.id)" [disabled]="addingPassenger()">
                      @if (addingPassenger()) { <ion-spinner name="dots"></ion-spinner> } @else {
                        <ion-icon name="person-add-outline" slot="start"></ion-icon> Guardar pasajero
                      }
                    </ion-button>
                  </div>
                }
              }
            </ion-list>
          }
        }
      } @else if (tab() === 'expenses') {
        <div class="card-surface">
          <ion-item fill="outline">
            <ion-label position="floating">Tipo de gasto</ion-label>
            <ion-select [(ngModel)]="expenseType">
              <ion-select-option value="FUEL">Combustible extra</ion-select-option>
              <ion-select-option value="TOLL">Peaje no previsto</ion-select-option>
              <ion-select-option value="REPAIR">Reparación / desvare</ion-select-option>
              <ion-select-option value="OTHER">Otro</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item fill="outline">
            <ion-label position="floating">Monto</ion-label>
            <ion-input type="number" [(ngModel)]="expenseAmount"></ion-input>
          </ion-item>
          <ion-item fill="outline" class="ion-margin-bottom">
            <ion-label position="floating">Concepto</ion-label>
            <ion-input [(ngModel)]="expenseConcept"></ion-input>
          </ion-item>
          <ion-button expand="block" (click)="addExpense()" [disabled]="saving()">
            <ion-icon name="add-outline" slot="start"></ion-icon> Registrar gasto
          </ion-button>
        </div>

        <p class="section-title"><ion-icon name="cash-outline"></ion-icon> Historial de gastos</p>
        @if (expenses().length === 0) {
          <p class="empty-state">Aún no hay gastos registrados.</p>
        } @else {
          <ion-list class="list-cards">
            @for (e of expenses(); track e.id) {
              <ion-item lines="none">
                <ion-label><h3>{{ e.concept }}</h3><p>{{ e.type }}</p></ion-label>
                <ion-badge slot="end" color="warning">{{ e.amount }}</ion-badge>
              </ion-item>
            }
          </ion-list>
        }
      } @else {
        <div class="card-surface">
          <ion-item fill="outline">
            <ion-label position="floating">Tipo de novedad</ion-label>
            <ion-select [(ngModel)]="incidentType">
              <ion-select-option value="DELAY">Retraso</ion-select-option>
              <ion-select-option value="PASSENGER_ISSUE">Problema con pasajeros</ion-select-option>
              <ion-select-option value="DETOUR">Desvío</ion-select-option>
              <ion-select-option value="OTHER">Otro</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item fill="outline" class="ion-margin-bottom">
            <ion-label position="floating">Descripción</ion-label>
            <ion-textarea [(ngModel)]="incidentDescription" rows="3"></ion-textarea>
          </ion-item>
          <ion-button expand="block" (click)="addIncident()" [disabled]="saving()">
            <ion-icon name="add-outline" slot="start"></ion-icon> Registrar novedad
          </ion-button>
        </div>

        <p class="section-title"><ion-icon name="alert-circle-outline"></ion-icon> Historial de novedades</p>
        @if (incidents().length === 0) {
          <p class="empty-state">Aún no hay novedades reportadas.</p>
        } @else {
          <ion-list class="list-cards">
            @for (n of incidents(); track n.id) {
              <ion-item lines="none">
                <ion-label><h3>{{ n.type }}</h3><p>{{ n.description }}</p></ion-label>
              </ion-item>
            }
          </ion-list>
        }
      }
    </ion-content>
  `,
  styles: [`
    .hint {
      color: var(--app-color-text-muted);
      font-size: 0.88rem;
      margin: 4px 0 var(--app-space-md);
    }
    .stop-order { font-size: 0.72rem; color: var(--app-color-text-muted); margin: 0 0 2px; }
    .stop-item p ion-icon { font-size: 13px; vertical-align: -2px; margin-right: 2px; }
    .add-passenger-form { margin: 0 0 var(--app-space-md); }
    .error-hint { color: var(--app-color-danger, #dc2626); font-size: 0.82rem; margin: 0 0 10px; }
  `],
})
export class EnRoutePage implements OnInit {
  tab = signal<'stops' | 'expenses' | 'incidents'>('stops');
  trip = signal<Trip | null>(null);
  expenses = signal<Expense[]>([]);
  incidents = signal<Incident[]>([]);
  saving = signal(false);

  addingAtStopId = signal<string | null>(null);
  newPassengerName = '';
  newPassengerDocument = '';
  addingPassenger = signal(false);
  addError = signal<string | null>(null);

  expenseType: ExpenseType = 'FUEL';
  expenseAmount: number | null = null;
  expenseConcept = '';

  incidentType: IncidentType = 'DELAY';
  incidentDescription = '';

  private tripId = '';

  constructor(
    private route: ActivatedRoute,
    private expensesService: ExpensesService,
    private incidentsService: IncidentsService,
    private passengersService: PassengersService,
    private tripsService: TripsService,
  ) {
    addIcons({
      cashOutline, alertCircleOutline, addOutline, locationOutline,
      personAddOutline, peopleOutline,
    });
  }

  async ngOnInit() {
    this.tripId = this.route.snapshot.paramMap.get('id')!;
    await this.reload();
  }

  async reload() {
    const [trip, expenses, incidents] = await Promise.all([
      this.tripsService.getById(this.tripId),
      this.expensesService.findByTrip(this.tripId),
      this.incidentsService.findByTrip(this.tripId),
    ]);
    this.trip.set(trip);
    this.expenses.set(expenses);
    this.incidents.set(incidents);
  }

  passengersAtStop(stopId: string): Passenger[] {
    return (this.trip()?.passengers || []).filter((p) => p.stopId === stopId);
  }

  toggleAddForm(stopId: string) {
    const isOpen = this.addingAtStopId() === stopId;
    this.addingAtStopId.set(isOpen ? null : stopId);
    this.newPassengerName = '';
    this.newPassengerDocument = '';
    this.addError.set(null);
  }

  async addPassengerAtStop(stopId: string) {
    this.addError.set(null);
    if (!this.newPassengerName.trim() || !this.newPassengerDocument.trim()) {
      this.addError.set('Completa el nombre y el documento del pasajero.');
      return;
    }
    this.addingPassenger.set(true);
    try {
      await this.passengersService.add(
        this.tripId, this.newPassengerName.trim(), this.newPassengerDocument.trim(), stopId,
      );
      this.newPassengerName = '';
      this.newPassengerDocument = '';
      this.addingAtStopId.set(null);
      await this.reload();
    } catch (e: any) {
      this.addError.set(e?.error?.message || 'No se pudo agregar el pasajero.');
    } finally {
      this.addingPassenger.set(false);
    }
  }

  async addExpense() {
    if (!this.expenseAmount || !this.expenseConcept) return;
    this.saving.set(true);
    try {
      await this.expensesService.create(
        this.tripId, this.expenseType, this.expenseAmount, this.expenseConcept,
      );
      this.expenseAmount = null;
      this.expenseConcept = '';
      await this.reload();
    } finally {
      this.saving.set(false);
    }
  }

  async addIncident() {
    if (!this.incidentDescription) return;
    this.saving.set(true);
    try {
      await this.incidentsService.create(this.tripId, this.incidentType, this.incidentDescription);
      this.incidentDescription = '';
      await this.reload();
    } finally {
      this.saving.set(false);
    }
  }
}
