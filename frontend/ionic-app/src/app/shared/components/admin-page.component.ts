import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import { AdminSidebarComponent } from './admin-sidebar.component';

/**
 * Contenedor de las pantallas del panel de administración: sidebar fijo +
 * columna de contenido con su encabezado (enlace de volver opcional, título,
 * subtítulo y acciones a la derecha).
 *
 * Uso:
 *   <app-admin-page title="Resumen" subtitle="Estado general de la operación">
 *     <button pageActions class="btn btn--primary">Nuevo viaje</button>
 *     … contenido …
 *   </app-admin-page>
 */
@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, RouterLink, IonIcon, AdminSidebarComponent],
  template: `
    <div class="admin-shell">
      <app-admin-sidebar></app-admin-sidebar>
      <div class="admin-shell__main" [style.max-width.px]="maxWidth">
        @if (backLink) {
          <a [routerLink]="backLink" class="admin-shell__eyebrow">
            <ion-icon name="arrow-back-outline"></ion-icon>
            {{ backLabel }}
          </a>
        }
        <div class="admin-shell__header">
          <div>
            <h1 class="admin-shell__title">{{ title }}</h1>
            @if (subtitle) {
              <p class="admin-shell__subtitle">{{ subtitle }}</p>
            }
          </div>
          <ng-content select="[pageActions]"></ng-content>
        </div>

        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class AdminPageComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle?: string;
  /** Enlace "volver" sobre el título (el sidebar cubre la navegación principal). */
  @Input() backLink?: string | any[];
  @Input() backLabel = 'Volver al panel';
  /** Ancho máximo de la columna de contenido; los formularios usan uno menor. */
  @Input() maxWidth = 1160;

  constructor() {
    addIcons({ arrowBackOutline });
  }
}
