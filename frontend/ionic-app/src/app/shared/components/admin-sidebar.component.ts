import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  gridOutline, peopleOutline, addCircleOutline, settingsOutline, busOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';

/**
 * Sidebar fijo del panel de administración (equivalente de escritorio al
 * shell de conductor `.phone-shell`). Cada página de /admin lo incluye
 * dentro de `.admin-shell`; resalta el item activo con routerLinkActive.
 */
@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IonIcon],
  template: `
    <aside class="admin-sidebar">
      <div class="admin-sidebar__brand">
        <div class="admin-sidebar__logo"><ion-icon name="bus-outline"></ion-icon></div>
        <span>Control de Viajes</span>
      </div>

      <nav class="admin-sidebar__nav">
        <a routerLink="/admin/dashboard" routerLinkActive="is-active" class="admin-sidebar__link">
          <ion-icon name="grid-outline"></ion-icon>
          Resumen
        </a>
        <a routerLink="/admin/drivers" routerLinkActive="is-active" class="admin-sidebar__link">
          <ion-icon name="people-outline"></ion-icon>
          Conductores
        </a>
        <a routerLink="/admin/trips/new" routerLinkActive="is-active" class="admin-sidebar__link">
          <ion-icon name="add-circle-outline"></ion-icon>
          Nuevo viaje
        </a>
        <a routerLink="/admin/settings" routerLinkActive="is-active" class="admin-sidebar__link">
          <ion-icon name="settings-outline"></ion-icon>
          Ajustes
        </a>
      </nav>

      @if (auth.currentUser(); as user) {
        <div class="admin-sidebar__user">
          <div class="admin-sidebar__avatar">{{ initials(user.name) }}</div>
          <div class="admin-sidebar__user-text">
            <strong>{{ user.name }}</strong>
            <span>{{ user.email }}</span>
          </div>
        </div>
      }
    </aside>
  `,
  styles: [`
    :host { display: contents; }
    .admin-sidebar {
      width: 232px;
      flex-shrink: 0;
      background: var(--app-color-surface);
      border-right: 1px solid var(--app-color-border);
      padding: 18px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      /* Se queda fija mientras el contenido de la derecha hace scroll. */
      position: sticky;
      top: 0;
      align-self: flex-start;
      height: 100vh;
      overflow-y: auto;
    }
    .admin-sidebar__brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 8px 18px;
      font-weight: 700;
      font-size: 0.95rem;
    }
    .admin-sidebar__logo {
      width: 32px; height: 32px;
      border-radius: var(--app-radius-sm);
      background: var(--app-color-primary);
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      font-size: 17px;
    }
    .admin-sidebar__nav {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .admin-sidebar__link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: var(--app-radius-sm);
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--app-color-text-muted);
      text-decoration: none;
      transition: background var(--app-transition-fast), color var(--app-transition-fast);
      ion-icon { font-size: 18px; }
      &:hover { background: var(--app-color-surface-alt); color: var(--app-color-text); }
      &.is-active {
        background: rgba(var(--app-color-primary-rgb), .12);
        color: var(--app-color-primary-shade);
      }
    }
    .admin-sidebar__user {
      margin-top: auto;
      padding: 12px 8px 4px;
      border-top: 1px solid var(--app-color-border);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .admin-sidebar__avatar {
      width: 30px; height: 30px;
      border-radius: 50%;
      background: rgba(var(--app-color-primary-rgb), .14);
      color: var(--app-color-primary-shade);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700;
      flex-shrink: 0;
    }
    .admin-sidebar__user-text {
      min-width: 0;
      display: flex;
      flex-direction: column;
      strong { font-size: 0.82rem; }
      span {
        font-size: 0.72rem;
        color: var(--app-color-text-subtle);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    @media (max-width: 820px) {
      .admin-sidebar {
        width: 100%;
        height: auto;
        position: static;
        align-self: auto;
        flex-direction: row;
        align-items: center;
        border-right: none;
        border-bottom: 1px solid var(--app-color-border);
        padding: 8px 10px;
        overflow-x: auto;
        overflow-y: hidden;
        gap: 8px;
      }
      .admin-sidebar__brand { padding: 4px 8px; flex-shrink: 0; }
      .admin-sidebar__nav { flex-direction: row; }
      .admin-sidebar__link span, .admin-sidebar__link { white-space: nowrap; }
      .admin-sidebar__user { margin-top: 0; margin-left: auto; border-top: none; padding: 4px; }
      .admin-sidebar__user-text { display: none; }
    }
  `],
})
export class AdminSidebarComponent {
  constructor(public auth: AuthService) {
    addIcons({ gridOutline, peopleOutline, addCircleOutline, settingsOutline, busOutline });
  }

  initials(name: string): string {
    return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
