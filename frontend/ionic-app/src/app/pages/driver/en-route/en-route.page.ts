import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cashOutline, alertCircleOutline, locationOutline,
  personAddOutline,
} from 'ionicons/icons';
import { ExpensesService } from '../../../core/services/expenses.service';
import { IncidentsService } from '../../../core/services/incidents.service';
import { PassengersService } from '../../../core/services/passengers.service';
import { TripsService } from '../../../core/services/trips.service';
import { Expense, ExpenseType, Incident, IncidentType, Passenger, Trip } from '../../../core/models/models';
import { PhoneShellComponent } from '../../../shared/components/phone-shell.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';

const EXPENSE_TYPE_LABEL: Record<ExpenseType, string> = {
  FUEL: 'Combustible extra',
  TOLL: 'Peaje no previsto',
  REPAIR: 'Reparación / desvare',
  OTHER: 'Otro',
};

const INCIDENT_TYPE_LABEL: Record<IncidentType, string> = {
  DELAY: 'Retraso',
  PASSENGER_ISSUE: 'Problema con pasajeros',
  DETOUR: 'Desvío',
  OTHER: 'Otro',
};

@Component({
  selector: 'app-en-route',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonIcon, IonSpinner,
    PhoneShellComponent, EmptyStateComponent, MoneyPipe,
  ],
  template: `
    <ion-content>
      <app-phone-shell title="En ruta" [backLink]="['/driver/my-trip', tripId]">
        <div shellUnderHeader class="phone-shell__tabs">
          <button type="button" class="tab" [class.is-active]="tab() === 'stops'" (click)="tab.set('stops')">Paradas</button>
          <button type="button" class="tab" [class.is-active]="tab() === 'expenses'" (click)="tab.set('expenses')">Gastos</button>
          <button type="button" class="tab" [class.is-active]="tab() === 'incidents'" (click)="tab.set('incidents')">Novedades</button>
        </div>

      @if (tab() === 'stops') {
        @if (!trip()) {
          <app-empty-state loading></app-empty-state>
        } @else {
          <p class="hint">
            Este viaje va de <strong>{{ trip()!.origin }}</strong> a <strong>{{ trip()!.destination }}</strong>{{ trip()!.stops.length ? ', pasando por:' : '.' }}
          </p>

          @if (trip()!.stops.length === 0) {
            <app-empty-state text="Este viaje no tiene paradas intermedias planeadas."></app-empty-state>
          } @else {
            @for (s of trip()!.stops; track s.id) {
              <div class="stop-card">
                <div class="icon-avatar icon-avatar--tertiary">
                  <ion-icon name="location-outline"></ion-icon>
                </div>
                <div class="stop-card__text">
                  <div class="stop-order">Parada {{ s.order }}</div>
                  <div class="stop-city">{{ s.city }}</div>
                  <div class="stop-meta">{{ passengersAtStop(s.id).length }} pasajero(s) abordaron aquí</div>
                </div>
                <button type="button" class="btn btn--outline" (click)="toggleAddForm(s.id)">
                  <ion-icon name="person-add-outline"></ion-icon>
                  Agregar
                </button>
              </div>

              @if (addingAtStopId() === s.id) {
                <div class="card-surface add-passenger-form">
                  <label class="field-label">Nombre</label>
                  <input class="field-control field-gap" placeholder="Nombre del pasajero"
                    [(ngModel)]="newPassengerName" [name]="'name-'+s.id" />
                  <label class="field-label">Documento</label>
                  <input class="field-control field-gap" placeholder="Número de documento"
                    [(ngModel)]="newPassengerDocument" [name]="'doc-'+s.id" />
                  @if (addError()) {
                    <p class="field-error">{{ addError() }}</p>
                  }
                  <button type="button" class="btn btn--primary btn--block" (click)="addPassengerAtStop(s.id)" [disabled]="addingPassenger()">
                    @if (addingPassenger()) { <ion-spinner name="dots"></ion-spinner> } @else {
                      Guardar pasajero
                    }
                  </button>
                </div>
              }
            }
          }
        }
      } @else if (tab() === 'expenses') {
        <div class="card-surface form-card">
          <label class="field-label" for="expense-type">Tipo de gasto</label>
          <select id="expense-type" class="field-control field-gap" [(ngModel)]="expenseType">
            <option value="FUEL">Combustible extra</option>
            <option value="TOLL">Peaje no previsto</option>
            <option value="REPAIR">Reparación / desvare</option>
            <option value="OTHER">Otro</option>
          </select>
          <label class="field-label" for="expense-amount">Monto</label>
          <input id="expense-amount" class="field-control field-gap" type="number" placeholder="$ 0" [(ngModel)]="expenseAmount" />
          <label class="field-label" for="expense-concept">Concepto</label>
          <input id="expense-concept" class="field-control field-gap" placeholder="Ej. tanqueo en Ibagué" [(ngModel)]="expenseConcept" />
          <button type="button" class="btn btn--primary btn--block" (click)="addExpense()" [disabled]="saving()">
            Registrar gasto
          </button>
        </div>

        <p class="list-heading">Historial de gastos</p>
        @if (expenses().length === 0) {
          <app-empty-state text="Aún no hay gastos registrados."></app-empty-state>
        } @else {
          <div class="data-list">
            @for (e of expenses(); track e.id) {
              <div class="data-row">
                <div class="data-row__text">
                  <div class="data-row__title">{{ expenseTypeLabel(e.type) }}</div>
                  <div class="data-row__meta">{{ e.concept }}</div>
                </div>
                <div class="amount">{{ e.amount | money }}</div>
              </div>
            }
          </div>
        }
      } @else {
        <div class="card-surface form-card">
          <label class="field-label" for="incident-type">Tipo de novedad</label>
          <select id="incident-type" class="field-control field-gap" [(ngModel)]="incidentType">
            <option value="DELAY">Retraso</option>
            <option value="PASSENGER_ISSUE">Problema con pasajeros</option>
            <option value="DETOUR">Desvío</option>
            <option value="OTHER">Otro</option>
          </select>
          <label class="field-label" for="incident-desc">Descripción</label>
          <textarea id="incident-desc" class="field-control field-gap" rows="3"
            placeholder="Describe lo ocurrido" [(ngModel)]="incidentDescription"></textarea>
          <button type="button" class="btn btn--primary btn--block" (click)="addIncident()" [disabled]="saving()">
            Registrar novedad
          </button>
        </div>

        <p class="list-heading">Historial de novedades</p>
        @if (incidents().length === 0) {
          <app-empty-state text="Aún no hay novedades reportadas."></app-empty-state>
        } @else {
          <div class="data-list">
            @for (n of incidents(); track n.id) {
              <div class="data-row">
                <div class="data-row__text">
                  <div class="data-row__title">{{ incidentTypeLabel(n.type) }}</div>
                  <div class="data-row__meta">{{ n.description }}</div>
                </div>
              </div>
            }
          </div>
        }
      }
      </app-phone-shell>
    </ion-content>
  `,
  styles: [`
    /* Tabs planos con subrayado de acento, como en el mockup. */
    .phone-shell__tabs {
      display: flex;
      gap: 6px;
      padding: 12px 18px 0;
      border-bottom: 1px solid var(--app-color-border);
    }
    .tab {
      flex: 1;
      border: none;
      background: none;
      padding: 10px 0;
      font-family: inherit;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      color: var(--app-color-text-muted);
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: color var(--app-transition-fast), border-color var(--app-transition-fast);
      &:hover { color: var(--app-color-text); }
      &.is-active {
        color: var(--app-color-primary);
        border-bottom-color: var(--app-color-primary);
      }
    }
    .hint {
      color: var(--app-color-text-muted);
      font-size: 0.82rem;
      margin: 0 0 14px;
      strong { color: var(--app-color-text); }
    }
    .field-gap { margin-bottom: 12px; }
    .form-card { margin-bottom: 18px; }

    /* Fila de parada (mockup: icono + textos + botón "Agregar") */
    .stop-card {
      display: flex; align-items: center; gap: 12px;
      background: var(--app-color-surface);
      border: 1px solid var(--app-color-border);
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 12px;
    }
    .stop-card__text { flex: 1; min-width: 0; }
    .stop-order { font-size: 0.7rem; color: var(--app-color-text-subtle); }
    .stop-city { font-size: 0.875rem; font-weight: 700; color: var(--app-color-text); }
    .stop-meta { font-size: 0.75rem; color: var(--app-color-text-muted); }

    .add-passenger-form { margin: 0 0 var(--app-space-md); padding: 16px; }

    .list-heading {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--app-color-text);
      margin: 0 0 10px;
    }
    .amount { font-size: 0.85rem; font-weight: 700; flex-shrink: 0; }
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

  /** Se expone para que el botón de volver regrese a ESTE viaje, no al listado. */
  tripId = '';

  constructor(
    private route: ActivatedRoute,
    private expensesService: ExpensesService,
    private incidentsService: IncidentsService,
    private passengersService: PassengersService,
    private tripsService: TripsService,
  ) {
    addIcons({
      cashOutline, alertCircleOutline, locationOutline,
      personAddOutline,
    });
  }

  async ngOnInit() {
    this.tripId = this.route.snapshot.paramMap.get('id')!;
    // Permite entrar directo a una pestaña específica desde Mi Viaje
    // (ej. "Paradas" o "Gastos y novedades" como accesos separados).
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam === 'stops' || tabParam === 'expenses' || tabParam === 'incidents') {
      this.tab.set(tabParam);
    }
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

  /** El backend guarda códigos (FUEL, DELAY…); en la UI se muestran en español. */
  expenseTypeLabel(type: ExpenseType): string {
    return EXPENSE_TYPE_LABEL[type] ?? type;
  }

  incidentTypeLabel(type: IncidentType): string {
    return INCIDENT_TYPE_LABEL[type] ?? type;
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
