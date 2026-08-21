import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonSpinner } from '@ionic/angular/standalone';

/**
 * Estado vacío / de carga de una lista.
 *
 *   <app-empty-state loading></app-empty-state>
 *   <app-empty-state icon="bus-outline" text="No hay viajes con este filtro."></app-empty-state>
 *   <app-empty-state text="Sin gastos reportados aún." variant="card"></app-empty-state>
 *
 * El icono debe estar registrado con addIcons() en la página que lo usa.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, IonIcon, IonSpinner],
  template: `
    @if (loading) {
      <div class="empty-state"><ion-spinner></ion-spinner></div>
    } @else if (variant === 'card') {
      <div class="card-surface empty-card">{{ text }}</div>
    } @else {
      <div class="empty-state">
        @if (icon) { <ion-icon [name]="icon"></ion-icon> }
        <p>{{ text }}</p>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .empty-card {
      text-align: center;
      color: var(--app-color-text-subtle);
      font-size: 0.82rem;
      padding: 18px;
    }
  `],
})
export class EmptyStateComponent {
  @Input() text = '';
  @Input() icon?: string;
  /** `card` lo pinta como tarjeta con borde (para secciones de un reporte). */
  @Input() variant: 'plain' | 'card' = 'plain';
  @Input({ transform: (v: unknown) => v === '' || !!v }) loading = false;
}
