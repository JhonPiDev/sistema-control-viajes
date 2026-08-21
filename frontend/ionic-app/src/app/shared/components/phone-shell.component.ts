import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';

/**
 * Contenedor de las pantallas del conductor: la "tarjeta de teléfono"
 * centrada con su cabecera propia (botón atrás + título + acción opcional).
 *
 * Uso:
 *   <app-phone-shell title="Check-in" (back)="attemptLeave()"> … </app-phone-shell>
 *   <app-phone-shell title="En ruta" backLink="/driver/my-trip"> … </app-phone-shell>
 *
 * Slots opcionales:
 *   [shellAction] — control a la derecha de la cabecera (ej. ajustes)
 *   [shellUnderHeader] — franja pegada bajo la cabecera, fuera del padding (ej. tabs)
 */
@Component({
  selector: 'app-phone-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, IonIcon],
  template: `
    <div class="phone-shell-wrap">
      <div class="phone-shell">
        <div class="phone-shell__header">
          @if (backLink) {
            <a class="phone-shell__back" [routerLink]="backLink" aria-label="Volver">
              <ion-icon name="arrow-back-outline"></ion-icon>
            </a>
          } @else if (back.observed) {
            <button type="button" class="phone-shell__back" (click)="back.emit()" aria-label="Volver">
              <ion-icon name="arrow-back-outline"></ion-icon>
            </button>
          }
          <span class="phone-shell__title">{{ title }}</span>
          <ng-content select="[shellAction]"></ng-content>
        </div>

        <ng-content select="[shellUnderHeader]"></ng-content>

        <div class="phone-shell__body">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
})
export class PhoneShellComponent {
  /** Título que se muestra en la cabecera. */
  @Input({ required: true }) title = '';
  /** Ruta del botón atrás. Si se omite, se usa el evento (back). */
  @Input() backLink?: string | any[];
  /** Alternativa a backLink cuando volver requiere lógica (ej. check-in incompleto). */
  @Output() back = new EventEmitter<void>();

  constructor() {
    addIcons({ arrowBackOutline });
  }
}
