import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonContent, IonIcon, IonSpinner, ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addCircleOutline, closeOutline, chevronForwardOutline,
} from 'ionicons/icons';
import { TripsService } from '../../../core/services/trips.service';
import { DriversService } from '../../../core/services/drivers.service';
import { Driver } from '../../../core/models/models';
import { CityPickerComponent } from '../../../shared/components/city-picker.component';
import { AdminPageComponent } from '../../../shared/components/admin-page.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { InputFilterDirective } from '../../../shared/directives/input-filter.directive';

interface PassengerRow { name: string; document: string; }

@Component({
  selector: 'app-trip-create',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, IonContent, IonIcon, IonSpinner,
    AdminPageComponent, EmptyStateComponent, InputFilterDirective,
  ],
  template: `
    <ion-content>
      <app-admin-page
        [title]="editMode() ? 'Editar viaje' : 'Nuevo viaje'"
        [subtitle]="editMode() ? 'Ajusta la ruta, el conductor o las paradas' : 'Registra origen, destino, conductor y paradas'"
        [maxWidth]="840">
        @if (editMode() && loadingTrip()) {
          <app-empty-state loading></app-empty-state>
        } @else if (editMode() && blockedReason()) {
          <div class="card-surface">
            <p class="blocked-msg">{{ blockedReason() }}</p>
            <button type="button" class="btn btn--ghost btn--block" routerLink="/admin/dashboard">
              Volver al panel
            </button>
          </div>
        } @else {
        <form (ngSubmit)="submit()">
          <div class="card-surface form-card">
            <p class="card-title section-gap">Datos del viaje</p>

            <label class="field-label">Origen</label>
            <button type="button" class="route-field" (click)="pickOrigin()">
              <span class="route-field-value" [class.placeholder]="!origin">{{ origin || 'Elige una ciudad' }}</span>
              <ion-icon name="chevron-forward-outline" class="chev"></ion-icon>
            </button>

            <label class="field-label">Destino</label>
            <button type="button" class="route-field" (click)="pickDestination()">
              <span class="route-field-value" [class.placeholder]="!destination">{{ destination || 'Elige una ciudad' }}</span>
              <ion-icon name="chevron-forward-outline" class="chev"></ion-icon>
            </button>

            @if (tripName()) {
              <p class="name-preview">
                Nombre del viaje: <strong>{{ tripName() }}</strong>
              </p>
            }

            <label class="field-label" for="trip-driver">Conductor asignado</label>
            <select id="trip-driver" class="field-control" [(ngModel)]="driverId" name="driverId" required>
              <option value="">Elige un conductor</option>
              @for (d of drivers(); track d.id) {
                <option [value]="d.id">{{ d.name }}</option>
              }
            </select>
          </div>

          <div class="card-surface form-card">
            <p class="card-title">Paradas intermedias</p>
            <p class="card-hint">Si el viaje pasa por otras terminales antes de llegar al destino, agrégalas en orden.</p>
            @for (s of stops(); track $index) {
              <div class="field-row">
                <div class="stop-chip">
                  <span class="stop-chip__order">Parada {{ $index + 1 }}</span>
                  <span class="stop-chip__city">{{ s }}</span>
                </div>
                <button type="button" class="btn btn--icon" (click)="removeStop($index)" aria-label="Quitar parada">
                  <ion-icon name="close-outline"></ion-icon>
                </button>
              </div>
            }
            <button type="button" class="btn btn--outline" (click)="addStop()">
              <ion-icon name="add-circle-outline"></ion-icon>
              Agregar parada
            </button>
          </div>

          @if (!editMode()) {
            <div class="card-surface form-card">
              <p class="card-title section-gap">Lista de pasajeros</p>
              @for (p of passengers(); track $index) {
                <div class="field-row">
                  <input class="field-control" placeholder="Nombre" appOnly="letters" [maxLength]="60"
                    [(ngModel)]="p.name" [name]="'pname'+$index" />
                  <input class="field-control" placeholder="Documento" appOnly="digits" [maxLength]="15"
                    [(ngModel)]="p.document" [name]="'pdoc'+$index" />
                  <button type="button" class="btn btn--icon" (click)="removePassenger($index)" aria-label="Quitar pasajero">
                    <ion-icon name="close-outline"></ion-icon>
                  </button>
                </div>
                @if (passengerRowError(p); as msg) {
                  <p class="field-error row-error">{{ msg }}</p>
                }
              }
              <button type="button" class="btn btn--outline" (click)="addPassenger()">
                <ion-icon name="add-circle-outline"></ion-icon>
                Agregar pasajero
              </button>
            </div>
          } @else {
            <p class="card-hint edit-note">
              La lista de pasajeros de origen no se edita aquí; agrégalos desde el detalle del viaje.
            </p>
          }

          @if (error()) {
            <p class="field-error">{{ error() }}</p>
          }

          <div class="form-actions">
            <button type="button" class="btn btn--ghost" routerLink="/admin/dashboard">Cancelar</button>
            <button type="submit" class="btn btn--primary" [disabled]="saving()">
              @if (saving()) { <ion-spinner name="dots"></ion-spinner> } @else {
                {{ editMode() ? 'Guardar cambios' : 'Crear viaje' }}
              }
            </button>
          </div>
        </form>
        }
      </app-admin-page>
    </ion-content>
  `,
  styles: [`
    .form-card { margin-bottom: 18px; }
    .card-title.section-gap { margin-bottom: 16px; }

    /* El origen/destino abren el modal de ciudades, así que son botones
       con el mismo aspecto que un .field-control. */
    .route-field {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      width: 100%;
      box-sizing: border-box;
      text-align: left;
      background: var(--app-color-surface);
      border: 1px solid var(--app-color-border);
      border-radius: 10px;
      padding: 11px 12px;
      font-family: inherit;
      cursor: pointer;
      margin-bottom: 14px;
      transition: border-color var(--app-transition-fast);
      &:hover { border-color: var(--app-color-primary); }
    }
    .route-field-value { font-size: 0.875rem; color: var(--app-color-text); }
    .route-field-value.placeholder { color: var(--app-color-text-subtle); }
    .chev { color: var(--app-color-text-subtle); font-size: 16px; flex-shrink: 0; }

    /* Cada parada ya elegida se muestra como un campo de solo lectura. */
    .stop-chip {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      background: var(--app-color-surface);
      border: 1px solid var(--app-color-border);
      border-radius: 10px;
      padding: 7px 12px;
    }
    .stop-chip__order { font-size: 0.7rem; color: var(--app-color-text-subtle); }
    .stop-chip__city { font-size: 0.875rem; font-weight: 600; color: var(--app-color-text); }

    .name-preview {
      font-size: 0.8rem;
      color: var(--app-color-text-muted);
      margin: -4px 0 14px;
      strong { color: var(--app-color-text); }
    }
    .edit-note { margin: 0 0 18px; }
    .blocked-msg { font-size: 0.9rem; margin: 0 0 var(--app-space-md); }

    .row-error { margin: -6px 0 10px; }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: var(--app-space-lg);
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

  // Modo edición: la misma pantalla sirve para crear y para editar un
  // viaje pendiente, así no se duplica todo el formulario de rutas/paradas.
  editMode = signal(false);
  loadingTrip = signal(false);
  blockedReason = signal<string | null>(null);
  private tripId: string | null = null;

  constructor(
    private tripsService: TripsService,
    private driversService: DriversService,
    private router: Router,
    private route: ActivatedRoute,
    private modalCtrl: ModalController,
  ) {
    addIcons({ addCircleOutline, closeOutline, chevronForwardOutline });
  }

  async ngOnInit() {
    this.drivers.set(await this.driversService.list());

    this.tripId = this.route.snapshot.paramMap.get('id');
    if (this.tripId) {
      this.editMode.set(true);
      this.loadingTrip.set(true);
      try {
        const trip = await this.tripsService.getById(this.tripId);
        if (trip.status !== 'PENDING') {
          this.blockedReason.set(
            'Este viaje ya no está pendiente, así que no se puede editar (solo se pueden eliminar los finalizados).',
          );
          return;
        }
        this.origin = trip.origin;
        this.destination = trip.destination;
        this.driverId = trip.driverId;
        this.stops.set(trip.stops.map((s) => s.city));
      } catch {
        this.blockedReason.set('No se pudo cargar el viaje a editar.');
      } finally {
        this.loadingTrip.set(false);
      }
    }
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

  /**
   * Error de una fila de pasajero, o null si está bien. Una fila vacía es
   * válida (simplemente no se envía); lo que no vale es dejarla a medias,
   * porque antes se descartaba en silencio y el pasajero no se creaba.
   */
  passengerRowError(p: PassengerRow): string | null {
    const name = p.name.trim();
    const doc = p.document.trim();
    if (!name && !doc) return null;
    if (!name) return 'Falta el nombre de este pasajero.';
    if (!doc) return 'Falta el documento de este pasajero.';
    if (name.replace(/[^\p{L}]/gu, '').length < 3) return 'El nombre es demasiado corto.';
    if (doc.length < 5) return 'El documento debe tener al menos 5 dígitos.';
    return null;
  }

  async submit() {
    this.error.set(null);
    if (!this.origin || !this.destination || !this.driverId) {
      this.error.set('Completa todos los campos obligatorios');
      return;
    }
    if (this.origin === this.destination) {
      this.error.set('El origen y el destino no pueden ser la misma ciudad.');
      return;
    }
    if (this.passengers().some((p) => this.passengerRowError(p))) {
      this.error.set('Revisa los datos de los pasajeros marcados.');
      return;
    }
    this.saving.set(true);
    try {
      if (this.editMode() && this.tripId) {
        await this.tripsService.update(this.tripId, {
          name: this.tripName(),
          origin: this.origin,
          destination: this.destination,
          driverId: this.driverId,
          stops: this.stops(),
        });
        this.router.navigate(['/admin/dashboard']);
      } else {
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
      }
    } catch (e: any) {
      this.error.set(e?.error?.message || (this.editMode() ? 'No se pudo guardar el viaje' : 'No se pudo crear el viaje'));
    } finally {
      this.saving.set(false);
    }
  }
}
