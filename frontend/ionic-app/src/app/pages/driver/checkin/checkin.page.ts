import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonSpinner, IonBadge,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline, closeOutline, personOutline } from 'ionicons/icons';
import { PassengersService } from '../../../core/services/passengers.service';
import { Passenger, BoardingStatus } from '../../../core/models/models';

@Component({
  selector: 'app-checkin',
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonBackButton, IonList, IonItem, IonLabel, IonButton, IonIcon, IonSpinner, IonBadge,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/driver/my-trip"></ion-back-button></ion-buttons>
        <ion-title>Check-in de Pasajeros</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (loading()) {
        <div class="empty-state"><ion-spinner></ion-spinner></div>
      } @else {
        <div class="progress-summary">
          <ion-badge color="success">{{ boardedCount() }} abordaron</ion-badge>
          <ion-badge color="danger">{{ absentCount() }} ausentes</ion-badge>
          <ion-badge color="medium">{{ pendingCount() }} pendientes</ion-badge>
        </div>

        <ion-list class="list-cards">
          @for (p of passengers(); track p.id) {
            <ion-item lines="none">
              <ion-icon name="person-outline" slot="start" [color]="p.boardingStatus === 'BOARDED' ? 'success' : p.boardingStatus === 'ABSENT' ? 'danger' : 'medium'"></ion-icon>
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
    .progress-summary {
      display: flex; gap: 8px; margin-bottom: var(--app-space-md); flex-wrap: wrap;
    }
  `],
})
export class CheckinPage implements OnInit {
  passengers = signal<Passenger[]>([]);
  loading = signal(true);
  private tripId = '';

  constructor(private route: ActivatedRoute, private passengersService: PassengersService) {
    addIcons({ checkmarkOutline, closeOutline, personOutline });
  }

  async ngOnInit() {
    this.tripId = this.route.snapshot.paramMap.get('id')!;
    this.passengers.set(await this.passengersService.findByTrip(this.tripId));
    this.loading.set(false);
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

  async setStatus(p: Passenger, status: BoardingStatus) {
    const updated = await this.passengersService.checkIn(p.id, status);
    this.passengers.update((list) => list.map((x) => (x.id === p.id ? updated : x)));
  }
}
