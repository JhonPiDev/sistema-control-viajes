import { Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonText, IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { refreshOutline, saveOutline, informationCircleOutline } from 'ionicons/icons';
import SignaturePad from 'signature_pad';
import { TripsService } from '../../../core/services/trips.service';

@Component({
  selector: 'app-signature',
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonBackButton, IonButton, IonIcon, IonText, IonSpinner,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/driver/my-trip"></ion-back-button></ion-buttons>
        <ion-title>Firma Digital</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="hint-banner">
        <ion-icon name="information-circle-outline"></ion-icon>
        <span>Pide al despachador o cliente que firme en el recuadro para poder habilitar el arranque del viaje.</span>
      </div>

      <div class="signature-wrap">
        <canvas #canvas></canvas>
        <div class="signature-line"></div>
      </div>

      <div class="actions">
        <ion-button fill="outline" (click)="clear()">
          <ion-icon name="refresh-outline" slot="start"></ion-icon>
          Limpiar
        </ion-button>
        <ion-button (click)="save()" [disabled]="saving()">
          @if (saving()) { <ion-spinner name="dots"></ion-spinner> } @else {
            <ion-icon name="save-outline" slot="start"></ion-icon> Guardar firma
          }
        </ion-button>
      </div>

      @if (error()) {
        <ion-text color="danger"><p class="error-msg">{{ error() }}</p></ion-text>
      }
    </ion-content>
  `,
  styles: [`
    .hint-banner {
      display: flex; align-items: flex-start; gap: 10px;
      background: rgba(var(--app-color-primary-rgb), .08);
      border: 1px solid rgba(var(--app-color-primary-rgb), .18);
      color: var(--app-color-primary);
      border-radius: var(--app-radius-md);
      padding: 12px 14px;
      font-size: 0.85rem;
      margin-bottom: var(--app-space-md);
      ion-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
    }
    .signature-wrap {
      position: relative;
      border: 2px dashed var(--app-color-border);
      border-radius: var(--app-radius-lg);
      background: #fff;
      box-shadow: var(--app-shadow-sm);
      margin: var(--app-space-md) 0;
      overflow: hidden;
    }
    canvas { width: 100%; height: 260px; display: block; touch-action: none; }
    .signature-line {
      position: absolute;
      left: 24px; right: 24px; bottom: 42px;
      height: 1px;
      background: var(--app-color-border);
    }
    .actions { display: flex; gap: 12px; }
    .actions ion-button { flex: 1; }
    .error-msg { font-size: 0.85rem; margin: 10px 0 0; text-align: center; }
  `],
})
export class SignaturePage implements OnInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private pad: SignaturePad | null = null;
  private tripId = '';
  saving = signal(false);
  error = signal<string | null>(null);

  private readonly onWindowResize = () => this.setupCanvas();

  constructor(
    private route: ActivatedRoute,
    private tripsService: TripsService,
    private router: Router,
  ) {
    addIcons({ refreshOutline, saveOutline, informationCircleOutline });
  }

  ngOnInit() {
    this.tripId = this.route.snapshot.paramMap.get('id')!;
  }

  /**
   * Ionic anima la entrada de cada página. Si inicializamos el canvas en
   * ngAfterViewInit (como estaba antes), el elemento todavía puede tener
   * ancho/alto 0 porque el layout final aún no se calculó — eso hacía que
   * signature_pad se montara sobre un canvas de tamaño 0 y no se pudiera
   * dibujar nada. ionViewDidEnter se dispara cuando la transición de
   * entrada YA terminó, así que el canvas tiene su tamaño real.
   */
  ionViewDidEnter() {
    this.setupCanvas();
    window.addEventListener('resize', this.onWindowResize);
  }

  ionViewWillLeave() {
    window.removeEventListener('resize', this.onWindowResize);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.onWindowResize);
  }

  private setupCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Salvaguarda: si por cualquier razón el layout aún no está listo,
    // reintenta en el siguiente frame en vez de montar un canvas roto.
    if (!width || !height) {
      requestAnimationFrame(() => this.setupCanvas());
      return;
    }

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.getContext('2d')!.scale(ratio, ratio);

    if (this.pad) {
      // Ya existía (p. ej. por un resize de ventana): solo se limpia,
      // porque redimensionar el canvas invalida el trazo previo.
      this.pad.clear();
    } else {
      this.pad = new SignaturePad(canvas, {
        backgroundColor: '#ffffff',
        penColor: '#12142B',
        minWidth: 1.2,
        maxWidth: 2.6,
      });
    }
  }

  clear() {
    this.pad?.clear();
    this.error.set(null);
  }

  async save() {
    this.error.set(null);
    if (!this.pad || this.pad.isEmpty()) {
      this.error.set('Dibuja la firma antes de guardar.');
      return;
    }
    this.saving.set(true);
    try {
      // JPEG comprime mucho mejor que PNG para este tipo de trazo (mismo
      // resultado visual, un fondo blanco sólido) y reduce el riesgo de
      // pegarle al límite de tamaño del body en el gateway.
      const dataUrl = this.pad.toDataURL('image/jpeg', 0.92);
      await this.tripsService.saveSignature(this.tripId, dataUrl);
      // Vuelve al detalle de ESTE viaje (no al selector genérico), por si
      // el conductor tiene varios viajes activos a la vez.
      this.router.navigate(['/driver/my-trip', this.tripId]);
    } catch (e: any) {
      this.error.set(
        e?.error?.message || 'No se pudo guardar la firma. Intenta de nuevo.',
      );
    } finally {
      this.saving.set(false);
    }
  }
}
