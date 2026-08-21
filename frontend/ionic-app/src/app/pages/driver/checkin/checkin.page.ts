import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonList, IonItem, IonLabel, IonIcon, IonSpinner, IonBadge,
  AlertController, ToastController, Platform,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline, closeOutline, personOutline, arrowBackOutline } from 'ionicons/icons';
import { PassengersService } from '../../../core/services/passengers.service';
import { Passenger, BoardingStatus } from '../../../core/models/models';

@Component({
  selector: 'app-checkin',
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonButton, IonList, IonItem, IonLabel, IonIcon, IonSpinner, IonBadge,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="attemptLeave()">
            <ion-icon slot="icon-only" name="arrow-back-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Check-in de Pasajeros</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (loading()) {
        <div class="empty-state"><ion-spinner></ion-spinner></div>
      } @else {
        @if (pendingCount() > 0) {
          <p class="hint">Marca a todos los pasajeros (abordó o no se presentó) para volver a Mi Viaje.</p>
        }
        <div class="stat-chip-row">
          <span class="stat-chip stat-chip--success"><ion-icon name="checkmark-outline"></ion-icon>{{ boardedCount() }} abordaron</span>
          <span class="stat-chip stat-chip--danger"><ion-icon name="close-outline"></ion-icon>{{ absentCount() }} ausentes</span>
          <span class="stat-chip stat-chip--medium"><ion-icon name="person-outline"></ion-icon>{{ pendingCount() }} pendientes</span>
        </div>

        <ion-list class="list-cards">
          @for (p of passengers(); track p.id) {
            <ion-item lines="none">
              <div slot="start" class="icon-avatar" [class]="'icon-avatar--' + (p.boardingStatus === 'BOARDED' ? 'success' : p.boardingStatus === 'ABSENT' ? 'danger' : 'medium')">
                <ion-icon name="person-outline"></ion-icon>
              </div>
              <ion-label>
                <h3>{{ p.name }}</h3>
                <p>{{ p.document }}</p>
                <p><strong>{{ label(p.boardingStatus) }}</strong> · {{ p.stop?.city ? 'Aborda en ' + p.stop!.city : 'Aborda en el origen' }}</p>
              </ion-label>
              <ion-button
                slot="end" fill="solid" color="success" size="small"
                (click)="setStatus(p, 'BOARDED')">
                <ion-icon name="checkmark-outline" slot="icon-only"></ion-icon>
              </ion-button>
              <ion-button
                slot="end" fill="outline" color="danger" size="small"
                (click)="setStatus(p, 'ABSENT')">
                <ion-icon name="close-outline" slot="icon-only"></ion-icon>
              </ion-button>
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [`
    .hint {
      color: var(--app-color-text-muted);
      font-size: 0.85rem;
      margin: 0 0 var(--app-space-md);
    }
  `],
})
export class CheckinPage implements OnInit, OnDestroy {
  passengers = signal<Passenger[]>([]);
  loading = signal(true);
  private tripId = '';
  private backButtonSub?: { unsubscribe: () => void };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private passengersService: PassengersService,
    private alertController: AlertController,
    private toastController: ToastController,
    private platform: Platform,
  ) {
    addIcons({ checkmarkOutline, closeOutline, personOutline, arrowBackOutline });
  }

  async ngOnInit() {
    this.tripId = this.route.snapshot.paramMap.get('id')!;
    this.passengers.set(await this.passengersService.findByTrip(this.tripId));
    this.loading.set(false);

    // Intercepta el botón físico de volver de Android: mientras falten
    // pasajeros por marcar, no deja salir de la pantalla.
    this.backButtonSub = this.platform.backButton.subscribeWithPriority(10, (processNextHandler) => {
      if (this.pendingCount() > 0) {
        this.showIncompleteAlert();
      } else {
        processNextHandler();
      }
    });
  }

  ngOnDestroy() {
    this.backButtonSub?.unsubscribe();
  }

  label(status: BoardingStatus) {
    return status === 'BOARDED' ? 'Abordó' : status === 'ABSENT' ? 'No se presentó' : 'Pendiente';
  }

  boardedCount() {
    return this.passengers().filter((p) => p.boardingStatus === 'BOARDED').length;
  }
  absentCount() {
    return this.passengers().filter((p) => p.boardingStatus === 'ABSENT').length;
  }
  pendingCount() {
    return this.passengers().filter((p) => p.boardingStatus === 'PENDING').length;
  }

  /** Botón de volver del header: mismo bloqueo que el físico, mientras falten pasajeros por marcar. */
  async attemptLeave() {
    if (this.pendingCount() > 0) {
      await this.showIncompleteAlert();
      return;
    }
    this.router.navigate(['/driver/my-trip']);
  }

  private async showIncompleteAlert() {
    const alert = await this.alertController.create({
      header: 'Check-in incompleto',
      message: `Aún faltan ${this.pendingCount()} pasajero(s) por marcar como abordado o no presentado. Termina de marcarlos a todos para poder salir de esta pantalla.`,
      buttons: ['Entendido'],
    });
    await alert.present();
  }

  async setStatus(p: Passenger, status: BoardingStatus) {
    const updated = await this.passengersService.checkIn(p.id, status);
    this.passengers.update((list) => list.map((x) => (x.id === p.id ? updated : x)));

    // Ya se marcó el último pasajero: check-in completo, vuelve solo.
    if (this.pendingCount() === 0) {
      const toast = await this.toastController.create({
        message: 'Check-in completo. Volviendo a Mi Viaje...',
        duration: 1200,
        color: 'success',
        position: 'top',
      });
      await toast.present();
      setTimeout(() => this.router.navigate(['/driver/my-trip']), 900);
    }
  }
}
