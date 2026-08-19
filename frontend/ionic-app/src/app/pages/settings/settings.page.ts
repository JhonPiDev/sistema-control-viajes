import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, moonOutline, sunnyOutline, colorPaletteOutline, checkmarkOutline } from 'ionicons/icons';
import { ThemeService, ThemeMode, CUSTOM_THEME_PRESETS } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonBackButton, IonButton, IonIcon,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/"></ion-back-button></ion-buttons>
        <ion-title>Ajustes de Apariencia</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="ion-page-desktop">
        <p class="section-title">Tema de la aplicación</p>

        <div class="theme-grid">
          <button
            type="button"
            class="theme-option"
            [class.active]="theme.mode() === 'light'"
            (click)="theme.setMode('light')">
            <div class="theme-preview preview-light">
              <ion-icon name="sunny-outline"></ion-icon>
            </div>
            <span>Claro</span>
            @if (theme.mode() === 'light') { <ion-icon name="checkmark-outline" class="check"></ion-icon> }
          </button>

          <button
            type="button"
            class="theme-option"
            [class.active]="theme.mode() === 'dark'"
            (click)="theme.setMode('dark')">
            <div class="theme-preview preview-dark">
              <ion-icon name="moon-outline"></ion-icon>
            </div>
            <span>Oscuro</span>
            @if (theme.mode() === 'dark') { <ion-icon name="checkmark-outline" class="check"></ion-icon> }
          </button>

          <button
            type="button"
            class="theme-option"
            [class.active]="theme.mode() === 'custom'"
            (click)="theme.setMode('custom')">
            <div class="theme-preview preview-custom" [style.background]="theme.customColor()">
              <ion-icon name="color-palette-outline"></ion-icon>
            </div>
            <span>Personalizado</span>
            @if (theme.mode() === 'custom') { <ion-icon name="checkmark-outline" class="check"></ion-icon> }
          </button>
        </div>

        @if (theme.mode() === 'custom') {
          <p class="section-title">Color principal</p>
          <div class="swatches">
            @for (preset of presets; track preset.value) {
              <button
                type="button"
                class="swatch"
                [class.active]="theme.customColor() === preset.value"
                [style.background]="preset.value"
                (click)="theme.setCustomColor(preset.value)"
                [title]="preset.name">
                @if (theme.customColor() === preset.value) {
                  <ion-icon name="checkmark-outline"></ion-icon>
                }
              </button>
            }
            <label class="swatch custom-picker" title="Elegir color personalizado">
              <ion-icon name="color-palette-outline"></ion-icon>
              <input type="color" [value]="theme.customColor()" (change)="onColorPick($event)" />
            </label>
          </div>
        }

        <ion-button expand="block" color="danger" fill="outline" class="ion-margin-top" (click)="logout()">
          <ion-icon name="log-out-outline" slot="start"></ion-icon>
          Cerrar sesión
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .theme-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: var(--app-space-lg);
    }
    .theme-option {
      position: relative;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      background: var(--app-color-surface);
      border: 2px solid var(--app-color-border);
      border-radius: var(--app-radius-md);
      padding: 14px 8px;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--app-color-text);
      transition: border-color var(--app-transition-base), box-shadow var(--app-transition-base);
    }
    .theme-option.active {
      border-color: var(--app-color-primary);
      box-shadow: var(--app-shadow-primary);
    }
    .theme-preview {
      width: 44px; height: 44px;
      border-radius: var(--app-radius-md);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
      color: #fff;
    }
    .preview-light { background: linear-gradient(135deg, #F5F6FB, #E5E7F2); color: #F59E0B; }
    .preview-dark { background: linear-gradient(135deg, #151827, #0A0C16); color: #818CF8; }
    .preview-custom { }
    .check {
      position: absolute; top: 6px; right: 6px;
      color: var(--app-color-primary);
      font-size: 16px;
    }

    .swatches { display: flex; flex-wrap: wrap; gap: 12px; padding: 4px 0 8px; }
    .swatch {
      width: 42px; height: 42px; border-radius: 50%;
      border: 2px solid var(--app-color-border);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #fff;
      font-size: 16px;
      position: relative;
      overflow: hidden;
    }
    .swatch.active { border-color: var(--app-color-text); box-shadow: 0 0 0 2px var(--app-color-primary); }
    .custom-picker {
      background: var(--app-color-surface-alt);
      color: var(--app-color-text-muted);
      input[type="color"] {
        position: absolute; inset: 0; opacity: 0; cursor: pointer;
      }
    }
  `],
})
export class SettingsPage {
  presets = CUSTOM_THEME_PRESETS;

  constructor(
    public theme: ThemeService,
    private auth: AuthService,
    private router: Router,
  ) {
    addIcons({ logOutOutline, moonOutline, sunnyOutline, colorPaletteOutline, checkmarkOutline });
  }

  onColorPick(ev: Event) {
    const value = (ev.target as HTMLInputElement).value;
    this.theme.setCustomColor(value);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
