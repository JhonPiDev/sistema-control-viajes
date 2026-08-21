import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';

/**
 * Apariencia = dos ejes independientes:
 *  - `mode`   : claro u oscuro (la base de la paleta)
 *  - `accent` : color de marca, que se aplica IGUAL en ambos modos
 *
 * Antes "personalizado" era un tercer modo excluyente, así que al elegir un
 * color se perdía el modo oscuro. Ahora el acento es transversal: eliges
 * claro/oscuro y, aparte, con qué color quieres que se pinte.
 */
export type ThemeMode = 'light' | 'dark';

/** Acento por defecto: el índigo de marca de la app. */
export const DEFAULT_ACCENT = '#4F46E5';

// Paleta corta de acentos sugeridos.
export const ACCENT_PRESETS = [
  { name: 'Índigo', value: DEFAULT_ACCENT },
  { name: 'Azul corporativo', value: '#2451B0' },
  { name: 'Verde ruta', value: '#0F7A5A' },
  { name: 'Naranja transporte', value: '#D96B0B' },
  { name: 'Púrpura', value: '#6D28D9' },
  { name: 'Rojo alerta', value: '#B91C1C' },
  { name: 'Teal', value: '#0E7C86' },
];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>('light');
  readonly accent = signal<string>(DEFAULT_ACCENT);

  constructor(private storage: StorageService) {}

  init() {
    const saved = this.storage.getThemeMode();
    // 'custom' era el modo viejo; se migra a claro conservando su color.
    const mode: ThemeMode = saved === 'dark' ? 'dark' : 'light';
    this.accent.set(this.storage.getCustomColor() || DEFAULT_ACCENT);
    this.mode.set(mode);
    this.apply(false);
  }

  setMode(mode: ThemeMode) {
    this.mode.set(mode);
    this.apply();
  }

  setAccent(hex: string) {
    this.accent.set(hex);
    this.apply();
  }

  /** Vuelve al acento de marca sin tocar el modo claro/oscuro. */
  resetAccent() {
    this.setAccent(DEFAULT_ACCENT);
  }

  isDefaultAccent(): boolean {
    return this.accent().toLowerCase() === DEFAULT_ACCENT.toLowerCase();
  }

  private apply(persist = true) {
    const html = document.documentElement;
    const dark = this.mode() === 'dark';

    html.classList.toggle('theme-dark', dark);

    // Sobre fondo oscuro el mismo hex queda apagado, así que se aclara para
    // mantener el contraste; el tono (matiz) es el mismo en ambos modos.
    const base = this.accent();
    const primary = dark ? this.shade(base, 0.28) : base;

    html.style.setProperty('--app-color-primary', primary);
    html.style.setProperty('--app-color-primary-rgb', this.toRgb(primary));
    html.style.setProperty('--app-color-primary-shade', this.shade(primary, dark ? -0.12 : -0.14));
    html.style.setProperty('--app-color-primary-tint', this.shade(primary, 0.14));
    html.style.setProperty('--app-color-primary-contrast', dark ? '#0C0E1C' : '#ffffff');
    // El degradado (héroe del reporte) también sigue al acento.
    html.style.setProperty('--app-gradient-start', primary);
    html.style.setProperty('--app-gradient-end', this.shade(primary, 0.22));

    if (persist) {
      this.storage.setThemeMode(this.mode());
      this.storage.setCustomColor(base);
    }
  }

  /** "#4F46E5" -> "79, 70, 229" (para los rgba(var(--...-rgb), .12)) */
  private toRgb(hex: string): string {
    const { r, g, b } = this.parse(hex);
    return `${r}, ${g}, ${b}`;
  }

  /** Aclara (factor>0) u oscurece (factor<0) un color hex */
  private shade(hex: string, factor: number): string {
    const { r, g, b } = this.parse(hex);
    const adjust = (c: number) =>
      Math.max(0, Math.min(255, Math.round(c + (factor > 0 ? (255 - c) * factor : c * factor))));
    return `#${[adjust(r), adjust(g), adjust(b)]
      .map((c) => c.toString(16).padStart(2, '0'))
      .join('')}`;
  }

  private parse(hex: string): { r: number; g: number; b: number } {
    let clean = hex.replace('#', '').trim();
    if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
    const num = parseInt(clean, 16);
    if (Number.isNaN(num)) return { r: 79, g: 70, b: 229 };
    return { r: (num >> 16) & 0xff, g: (num >> 8) & 0xff, b: num & 0xff };
  }
}
