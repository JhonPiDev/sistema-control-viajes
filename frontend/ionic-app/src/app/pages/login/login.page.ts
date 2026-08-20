import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon,
  IonSpinner, IonText, IonCard, IonCardContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { busOutline, lockClosedOutline, mailOutline, shieldCheckmarkOutline, arrowForwardOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonItem, IonLabel, IonInput,
    IonButton, IonIcon, IonSpinner, IonText, IonCard, IonCardContent,
  ],
  template: `
    <ion-content class="login-bg" [fullscreen]="true">
      <div class="login-wrap">
        <div class="brand">
          <div class="brand-badge">
            <ion-icon name="bus-outline"></ion-icon>
          </div>
          <h1>Control de Viajes</h1>
          <p>Factoría Web S.A.S. · Gestión de viajes en ruta</p>
        </div>

        <ion-card class="login-card">
          <ion-card-content>
            <h2 class="form-title">Bienvenido de nuevo</h2>
            <p class="form-subtitle">Ingresa con tu cuenta de Administrador o Conductor</p>

            <form (ngSubmit)="onSubmit()">
              <ion-item fill="outline" class="ion-margin-bottom">
                <ion-icon name="mail-outline" slot="start"></ion-icon>
                <ion-label position="floating">Correo electrónico</ion-label>
                <ion-input type="email" [(ngModel)]="email" name="email" required></ion-input>
              </ion-item>

              <ion-item fill="outline" class="ion-margin-bottom">
                <ion-icon name="lock-closed-outline" slot="start"></ion-icon>
                <ion-label position="floating">Contraseña</ion-label>
                <ion-input type="password" [(ngModel)]="password" name="password" required></ion-input>
              </ion-item>

              @if (error()) {
                <ion-text color="danger">
                  <p class="error-msg">{{ error() }}</p>
                </ion-text>
              }

              <ion-button expand="block" type="submit" [disabled]="loading()">
                @if (loading()) {
                  <ion-spinner name="dots"></ion-spinner>
                } @else {
                  Ingresar
                  <ion-icon name="arrow-forward-outline" slot="end"></ion-icon>
                }
              </ion-button>
            </form>

            <div class="demo-creds">
              <div class="demo-creds-title">
                <ion-icon name="shield-checkmark-outline"></ion-icon>
                <span>Credenciales de prueba</span>
              </div>
              <div class="demo-row"><span class="role-tag role-admin">Admin</span><span>admin&#64;viajes.com / Admin123!</span></div>
              <div class="demo-row"><span class="role-tag role-driver">Conductor</span><span>conductor&#64;viajes.com / Driver123!</span></div>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .login-bg {
      --background: radial-gradient(circle at 15% 15%, rgba(255,255,255,0.16), transparent 40%),
                    radial-gradient(circle at 85% 85%, rgba(255,255,255,0.12), transparent 45%),
                    var(--app-gradient);
    }
    .login-wrap {
      min-height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--app-space-lg);
    }
    .brand { text-align: center; color: #fff; margin-bottom: var(--app-space-lg); }
    .brand-badge {
      width: 64px;
      height: 64px;
      margin: 0 auto 12px;
      border-radius: var(--app-radius-lg);
      background: rgba(255,255,255,0.16);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      border: 1px solid rgba(255,255,255,0.28);
    }
    .brand h1 {
      margin: 0;
      font-family: var(--app-font-family-heading);
      font-size: 1.7rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .brand p { opacity: .88; margin: 6px 0 0; font-size: 0.9rem; }

    .login-card {
      width: 100%;
      max-width: 400px;
      border-radius: var(--app-radius-lg);
      box-shadow: var(--app-shadow-lg);
      margin: 0;
    }
    .form-title {
      font-family: var(--app-font-family-heading);
      font-size: 1.2rem;
      font-weight: 700;
      margin: 0 0 2px;
      color: var(--app-color-text);
    }
    .form-subtitle {
      font-size: 0.85rem;
      color: var(--app-color-text-muted);
      margin: 0 0 var(--app-space-lg);
    }
    .error-msg { font-size: .85rem; margin: 0 0 8px; }

    .demo-creds {
      margin-top: var(--app-space-md);
      padding: 12px 14px;
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface-alt);
      font-size: .78rem;
      color: var(--app-color-text-muted);
    }
    .demo-creds-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      color: var(--app-color-text);
      margin-bottom: 6px;
      ion-icon { color: var(--app-color-secondary); }
    }
    .demo-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 2px 0;
    }
    .role-tag {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: var(--app-radius-full);
      flex-shrink: 0;
      min-width: 58px;
      text-align: center;
    }
    .role-admin { background: rgba(var(--app-color-primary-rgb), 0.14); color: var(--app-color-primary); }
    .role-driver { background: rgba(var(--app-color-secondary-rgb), 0.14); color: var(--app-color-secondary); }
  `],
})
export class LoginPage {
  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {
    addIcons({ busOutline, lockClosedOutline, mailOutline, shieldCheckmarkOutline, arrowForwardOutline });
  }

  async onSubmit() {
    this.error.set(null);
    this.loading.set(true);
    try {
      const user = await this.auth.login(this.email, this.password);
      this.router.navigate([user.role === 'ADMIN' ? '/admin' : '/driver']);
    } catch (e: any) {
      // Antes esto siempre mostraba "Credenciales inválidas" sin importar la
      // causa real, lo que confunde muchísimo cuando el problema es que el
      // backend (plan gratuito de Render) está dormido/despertando o caído,
      // no que el usuario/contraseña estén mal. Se distingue por el status
      // HTTP: 0 = no hubo respuesta del servidor (dormido, red, CORS);
      // 5xx = el servidor respondió pero con error; 401/lo demás = sí llegó
      // a validar credenciales y las rechazó.
      if (e?.status === 0) {
        this.error.set(
          'No se pudo conectar con el servidor. Si llevaba un rato sin uso (plan gratuito), puede estar despertando: espera unos 30-60 segundos y vuelve a intentar.',
        );
      } else if (e?.status >= 500) {
        this.error.set(
          'El servidor respondió con un error. Puede seguir despertando o hubo un problema en el último despliegue — espera un momento y vuelve a intentar.',
        );
      } else {
        this.error.set(e?.error?.message || 'Credenciales inválidas');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
