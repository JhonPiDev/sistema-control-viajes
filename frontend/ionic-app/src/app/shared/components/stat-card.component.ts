import { Component, Input } from '@angular/core';

/**
 * Tarjeta de cifra del panel y del reporte de cierre: número grande con el
 * tono del estado que representa, y su etiqueta debajo.
 *
 *   <app-stat-card [value]="stats().total" label="Viajes totales"></app-stat-card>
 *   <app-stat-card [value]="n" label="En ruta" tone="info"></app-stat-card>
 */
@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <div class="stat-card">
      <span class="stat-value" [class]="tone === 'neutral' ? 'stat-value' : 'stat-value stat-value--' + tone">
        {{ value }}
      </span>
      <span class="stat-label">{{ label }}</span>
    </div>
  `,
  styles: [':host { display: contents; }'],
})
export class StatCardComponent {
  @Input({ required: true }) value: string | number = 0;
  @Input({ required: true }) label = '';
  /** Color de la cifra; `neutral` la deja en el color de texto normal. */
  @Input() tone: 'neutral' | 'primary' | 'warning' | 'info' | 'success' = 'neutral';
}
