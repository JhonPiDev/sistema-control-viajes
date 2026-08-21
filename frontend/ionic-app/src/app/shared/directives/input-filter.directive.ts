import { Directive, ElementRef, HostListener, Input, Optional, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';

export type InputFilterKind = 'letters' | 'digits' | 'decimal';

/**
 * Obliga a que un campo solo admita el tipo de dato que le corresponde.
 *
 *   <input appOnly="letters" [(ngModel)]="nombre">
 *   <input appOnly="digits" [maxLength]="15" [(ngModel)]="documento">
 *   <input appOnly="decimal" [(ngModel)]="monto">
 *
 * Filtra sobre el evento `input`, no sobre `keydown`: en Android los
 * teclados (Gboard y similares) no reportan la tecla de forma fiable, así
 * que bloquear pulsaciones deja pasar caracteres. Sanear el valor cubre
 * además el pegado, el arrastrar-soltar y el autocompletado.
 *
 * Ajusta `inputmode` para que el móvil abra el teclado adecuado y
 * mantiene la posición del cursor al descartar caracteres.
 */
@Directive({ selector: '[appOnly]', standalone: true })
export class InputFilterDirective implements OnInit {
  @Input('appOnly') kind: InputFilterKind = 'letters';
  /** Tope de caracteres útiles (ej. documento). */
  @Input() maxLength?: number;

  constructor(
    private el: ElementRef<HTMLInputElement | HTMLTextAreaElement>,
    @Optional() private ngControl: NgControl,
  ) {}

  ngOnInit() {
    const input = this.el.nativeElement;
    if (!input.getAttribute('inputmode')) {
      input.setAttribute(
        'inputmode',
        this.kind === 'digits' ? 'numeric' : this.kind === 'decimal' ? 'decimal' : 'text',
      );
    }
    if (this.kind === 'letters' && !input.getAttribute('autocapitalize')) {
      input.setAttribute('autocapitalize', 'words');
    }
  }

  @HostListener('input')
  onInput() {
    this.sanitize();
  }

  /** Al salir del campo se quitan los espacios sobrantes. */
  @HostListener('blur')
  onBlur() {
    this.sanitize(true);
  }

  private sanitize(trimEnds = false) {
    const input = this.el.nativeElement;
    const raw = input.value;

    let clean = this.clean(raw);
    if (this.maxLength != null) clean = clean.slice(0, this.maxLength);
    if (trimEnds) clean = clean.trim();
    if (clean === raw) return;

    // El cursor debe quedarse donde estaba, descontando lo que se eliminó
    // a su izquierda; si no, saltaría al final en cada carácter inválido.
    let caret: number | null = null;
    try {
      const before = input.selectionStart ?? raw.length;
      caret = this.clean(raw.slice(0, before)).length;
    } catch {
      /* selectionStart no está disponible en algunos tipos de input */
    }

    input.value = clean;
    // ngModel no se entera de un cambio hecho sobre el DOM: hay que
    // empujarle el valor saneado o el modelo guardaría lo que se escribió.
    this.ngControl?.control?.setValue(clean, { emitModelToViewChange: false });

    if (caret != null) {
      try {
        input.setSelectionRange(caret, caret);
      } catch {
        /* idem */
      }
    }
  }

  private clean(value: string): string {
    switch (this.kind) {
      case 'digits':
        return value.replace(/\D+/g, '');

      case 'decimal':
        // Solo dígitos y separadores. Se admiten varios porque en Colombia
        // se escribe "1.500,75"; cuál es el decimal lo decide quien parsea
        // (ver parseAmount), no el filtro.
        return value.replace(/[^\d.,]+/g, '');

      case 'letters':
      default:
        // Letras de cualquier alfabeto (incluye tildes y ñ), marcas
        // diacríticas, espacios y los signos propios de un nombre.
        return value.replace(/[^\p{L}\p{M}\s'’.-]+/gu, '').replace(/\s{2,}/g, ' ');
    }
  }
}
