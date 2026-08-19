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
import { cashOutline, alertCircleOutline, addOutline } from 'ionicons/icons';
import { ExpensesService } from '../../../core/services/expenses.service';
import { IncidentsService } from '../../../core/services/incidents.service';
import { Expense, ExpenseType, Incident, IncidentType } from '../../../core/models/models';

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
        <ion-segment [value]="tab()" (ionChange)="tab.set($any($event.detail.value))">
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
      @if (tab() === 'expenses') {
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
})
export class EnRoutePage implements OnInit {
  tab = signal<'expenses' | 'incidents'>('expenses');
  expenses = signal<Expense[]>([]);
  incidents = signal<Incident[]>([]);
  saving = signal(false);

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
  ) {
    addIcons({ cashOutline, alertCircleOutline, addOutline });
  }

  async ngOnInit() {
    this.tripId = this.route.snapshot.paramMap.get('id')!;
    await this.reload();
  }

  async reload() {
    this.expenses.set(await this.expensesService.findByTrip(this.tripId));
    this.incidents.set(await this.incidentsService.findByTrip(this.tripId));
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
