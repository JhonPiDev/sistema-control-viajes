import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ModalController, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonIcon, IonContent, IonSearchbar, IonList, IonItem, IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, locationOutline } from 'ionicons/icons';
import { CITIES } from '../../core/constants/cities';

/**
 * Selector de ciudad/terminal reutilizable (origen, destino y paradas de un
 * viaje comparten el mismo catálogo fijo). Se abre como modal desde
 * ModalController y se cierra con `modal.dismiss(ciudad, 'select')` al
 * elegir una, o `modal.dismiss(null, 'cancel')` si se cierra sin elegir.
 * Incluye un buscador para filtrar el catálogo (el "filtro" que pidió el
 * admin para no tener que desplazarse por toda la lista).
 */
@Component({
  selector: 'app-city-picker',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonButton, IonIcon, IonContent, IonSearchbar, IonList, IonItem, IonLabel,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="close()">
            <ion-icon slot="icon-only" name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          [(ngModel)]="query"
          (ionInput)="applyFilter()"
          placeholder="Buscar ciudad o terminal..."
          debounce="0">
        </ion-searchbar>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      @if (filtered().length === 0) {
        <div class="empty-state">
          <ion-icon name="location-outline"></ion-icon>
          <p>No se encontraron ciudades con ese nombre.</p>
        </div>
      } @else {
        <ion-list>
          @for (c of filtered(); track c) {
            <ion-item button detail="false" (click)="select(c)">
              <ion-icon name="location-outline" slot="start"></ion-icon>
              <ion-label>{{ c }}</ion-label>
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [`
    .empty-state {
      text-align: center;
      color: var(--app-color-text-muted);
      padding: 40px 20px;
      ion-icon { font-size: 36px; margin-bottom: 8px; }
      p { margin: 0; }
    }
  `],
})
export class CityPickerComponent implements OnInit {
  @Input() title = 'Elige una ciudad';

  query = '';
  filtered = signal<string[]>([...CITIES]);

  constructor(private modalCtrl: ModalController) {
    addIcons({ closeOutline, locationOutline });
  }

  ngOnInit() {
    this.applyFilter();
  }

  applyFilter() {
    const q = this.query.trim().toLowerCase();
    this.filtered.set(q ? CITIES.filter((c) => c.toLowerCase().includes(q)) : [...CITIES]);
  }

  select(city: string) {
    this.modalCtrl.dismiss(city, 'select');
  }

  close() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
