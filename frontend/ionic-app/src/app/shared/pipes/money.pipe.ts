import { Pipe, PipeTransform, Inject, LOCALE_ID } from '@angular/core';
import { formatCurrency, getCurrencySymbol } from '@angular/common';

/**
 * Formatea importes de dinero de forma uniforme en toda la app:
 * símbolo, separador de miles y SIEMPRE dos decimales.
 *
 *   {{ 180000 | money }}   ->  "$ 180.000,00"   (con LOCALE_ID es-CO)
 *
 * Antes cada pantalla usaba `number:'1.0-0'`, que descartaba los
 * centavos y además tomaba el formato inglés (180,000) porque no había
 * locale registrado.
 */
@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  constructor(@Inject(LOCALE_ID) private locale: string) {}

  transform(value: number | string | null | undefined): string {
    const amount = typeof value === 'string' ? Number(value) : value;
    if (amount == null || Number.isNaN(amount)) return '—';

    return formatCurrency(
      amount,
      this.locale,
      getCurrencySymbol('COP', 'narrow', this.locale),
      'COP',
      '1.2-2',
    );
  }
}
