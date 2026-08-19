import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';

export type ThemeMode = 'light' | 'dark' | 'custom';

// Paleta corta de colores sugeridos para el tema "Personalizado"
export const CUSTOM_THEME_PRESETS = [
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
  readonly customColor = signal<string>('#2451B0');

  constructor(private storage: StorageService) {}

  init() {
    const savedMode = (this.storage.getThemeMode() as ThemeMode) || 'light';
    const savedColor = this.storage.getCustomColor() || '#2451B0';
    this.customColor.set(savedColor);
    this.setMode(savedMode, false);
  }

  setMode(mode: ThemeMode, persist = true) {
    this.mode.set(mode);
    const html = document.documentElement;
    html.classList.remove('theme-dark', 'theme-custom');

    if (mode === 'dark') {
      html.classList.add('theme-dark');
    } else if (mode === 'custom') {
      html.classList.add('theme-custom');
      this.applyCustomColor(this.customColor());
    }

    if (persist) this.storage.setThemeMode(mode);
  }

  setCustomColor(hex: string) {
    this.customColor.set(hex);
    this.storage.setCustomColor(hex);
    if (this.mode() === 'custom') {
      this.applyCustomColor(hex);
    }
  }

  private applyCustomColor(hex: string) {
    const html = document.documentElement;
    html.style.setProperty('--app-color-primary-custom', hex);
    html.style.setProperty('--app-color-primary-custom-shade', this.shade(hex, -0.12));
    html.style.setProperty('--app-color-primary-custom-tint', this.shade(hex, 0.12));
  }

  /** Aclara (factor>0) u oscurece (factor<0) un color hex */
  private shade(hex: string, factor: number): string {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    let r = (num >> 16) & 0xff;
    let g = (num >> 8) & 0xff;
    let b = num & 0xff;

    const adjust = (c: number) =>
      Math.max(0, Math.min(255, Math.round(c + (factor > 0 ? (255 - c) * factor : c * factor))));

    r = adjust(r);
    g = adjust(g);
    b = adjust(b);

    return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  }
}
