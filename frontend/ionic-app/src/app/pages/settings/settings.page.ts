import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline, moonOutline, sunnyOutline, colorPaletteOutline, checkmarkOutline,
  chevronForwardOutline, refreshOutline,
} from 'ionicons/icons';
import { ThemeService, ACCENT_PRESETS } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { AdminPageComponent } from '../../shared/components/admin-page.component';
import { PhoneShellComponent } from '../../shared/components/phone-shell.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, AdminPageComponent, PhoneShellComponent],
  template: `
    <ion-content>
      @if (isAdmin()) {
        <app-admin-page
          title="Ajustes de apariencia"
          subtitle="Elige el modo y el color con el que se pinta la app"
          [maxWidth]="840">
          <ng-container [ngTemplateOutlet]="body"></ng-container>
        </app-admin-page>
      } @else {
        <app-phone-shell title="Ajustes de apariencia" backLink="/driver/my-trip">
          <ng-container [ngTemplateOutlet]="body"></ng-container>
        </app-phone-shell>
      }
    </ion-content>

    <ng-template #body>
      <p class="settings-label">Modo</p>
      <div class="mode-grid">
        <button
          type="button"
          class="mode-option"
          [class.active]="theme.mode() === 'light'"
          (click)="theme.setMode('light')">
          <div class="mode-preview preview-light"><ion-icon name="sunny-outline"></ion-icon></div>
          <span>Claro</span>
          @if (theme.mode() === 'light') { <ion-icon name="checkmark-outline" class="check"></ion-icon> }
        </button>

        <button
          type="button"
          class="mode-option"
          [class.active]="theme.mode() === 'dark'"
          (click)="theme.setMode('dark')">
          <div class="mode-preview preview-dark"><ion-icon name="moon-outline"></ion-icon></div>
          <span>Oscuro</span>
          @if (theme.mode() === 'dark') { <ion-icon name="checkmark-outline" class="check"></ion-icon> }
        </button>
      </div>

      <div class="accent-head">
        <p class="settings-label">Color de acento</p>
        @if (!theme.isDefaultAccent()) {
          <button type="button" class="reset-accent" (click)="theme.resetAccent()">
            <ion-icon name="refresh-outline"></ion-icon>
            Restablecer
          </button>
        }
      </div>
      <p class="accent-hint">Se aplica igual en modo claro y en modo oscuro.</p>

      <div class="swatches">
        @for (preset of presets; track preset.value) {
          <button
            type="button"
            class="swatch"
            [class.active]="isSelected(preset.value)"
            [style.background]="preset.value"
            (click)="theme.setAccent(preset.value)"
            [title]="preset.name"
            [attr.aria-label]="preset.name">
            @if (isSelected(preset.value)) { <ion-icon name="checkmark-outline"></ion-icon> }
          </button>
        }
        <label class="swatch custom-picker" title="Elegir otro color">
          <ion-icon name="color-palette-outline"></ion-icon>
          <input type="color" [value]="theme.accent()" (change)="onColorPick($event)" />
        </label>
      </div>

      <p class="settings-label account-label">Cuenta</p>
      <div class="data-list">
        <button type="button" class="account-row" (click)="logout()">
          <span class="account-row__text">
            <ion-icon name="log-out-outline"></ion-icon>
            Cerrar sesión
          </span>
          <ion-icon name="chevron-forward-outline" class="account-row__chev"></ion-icon>
        </button>
      </div>
    </ng-template>
  `,
  styles: [`
    .settings-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--app-color-text-muted);
      margin: 0 0 10px;
    }

    .mode-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: var(--app-space-lg);
      max-width: 380px;
    }
    .mode-option {
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
      transition: border-color var(--app-transition-base);
      &.active { border-color: var(--app-color-primary); }
    }
    .mode-preview {
      width: 44px; height: 44px;
      border-radius: var(--app-radius-md);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }
    /* Las miniaturas muestran el fondo de cada modo con el acento vigente. */
    .preview-light { background: #F6F7FB; border: 1px solid #E4E6F0; color: var(--app-color-primary); }
    .preview-dark { background: #15161F; color: var(--app-color-primary); }
    .check {
      position: absolute; top: 6px; right: 6px;
      color: var(--app-color-primary);
      font-size: 16px;
    }

    .accent-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .accent-hint {
      font-size: 0.76rem;
      color: var(--app-color-text-subtle);
      margin: -6px 0 12px;
    }
    .reset-accent {
      display: flex; align-items: center; gap: 5px;
      border: none; background: none; cursor: pointer;
      font-family: inherit; font-size: 0.76rem; font-weight: 600;
      color: var(--app-color-primary);
      padding: 0 0 10px;
      ion-icon { font-size: 14px; }
    }

    .swatches {
      display: flex; flex-wrap: wrap; gap: 12px;
      padding: 0 0 8px;
      margin-bottom: var(--app-space-md);
    }
    .swatch {
      width: 40px; height: 40px; border-radius: 50%;
      border: 2px solid var(--app-color-border);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #fff;
      font-size: 15px;
      position: relative;
      overflow: hidden;
      padding: 0;
    }
    .swatch.active {
      border-color: var(--app-color-text);
      box-shadow: 0 0 0 2px var(--app-color-primary);
    }
    .custom-picker {
      background: var(--app-color-surface-alt);
      color: var(--app-color-text-muted);
      input[type="color"] {
        position: absolute; inset: 0; opacity: 0; cursor: pointer;
      }
    }

    .account-label { margin-top: var(--app-space-lg); }
    .account-row {
      width: 100%;
      display: flex; align-items: center; justify-content: space-between;
      padding: 15px 18px;
      border: none;
      background: transparent;
      font-family: inherit;
      cursor: pointer;
      transition: background var(--app-transition-fast);
      &:hover { background: rgba(var(--app-color-danger-rgb), .05); }
    }
    .account-row__text {
      display: flex; align-items: center; gap: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--app-color-danger);
      ion-icon { font-size: 17px; }
    }
    .account-row__chev { color: var(--app-color-text-subtle); font-size: 16px; }
  `],
})
export class SettingsPage {
  presets = ACCENT_PRESETS;

  constructor(
    public theme: ThemeService,
    private auth: AuthService,
    private router: Router,
  ) {
    addIcons({
      logOutOutline, moonOutline, sunnyOutline, colorPaletteOutline, checkmarkOutline,
      chevronForwardOutline, refreshOutline,
    });
  }

  isAdmin(): boolean {
    return this.auth.currentUser()?.role === 'ADMIN';
  }

  isSelected(hex: string): boolean {
    return this.theme.accent().toLowerCase() === hex.toLowerCase();
  }

  onColorPick(ev: Event) {
    this.theme.setAccent((ev.target as HTMLInputElement).value);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
