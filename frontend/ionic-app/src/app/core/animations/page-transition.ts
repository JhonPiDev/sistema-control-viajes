import { Animation, createAnimation } from '@ionic/angular/standalone';

/**
 * Transición entre páginas.
 *
 * El panel de administrador es una app de escritorio con sidebar fijo: la
 * animación deslizante por defecto de Ionic hace que TODO (sidebar incluido)
 * entre desde el borde, lo que se ve mal en pantalla grande. Ahí se usa un
 * fundido con un empuje vertical mínimo, que es lo normal en un panel web.
 *
 * El lado conductor sí es móvil, así que conserva un deslizamiento lateral
 * (más corto y suave que el de Ionic) para que se sienta como app nativa.
 */
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Una página es del panel admin si su contenido monta el shell con sidebar. */
const isAdminPage = (el?: HTMLElement | null) => !!el?.querySelector('.admin-shell');

export const pageTransition = (_baseEl: HTMLElement, opts?: any): Animation => {
  const entering: HTMLElement | undefined = opts?.enteringEl;
  const leaving: HTMLElement | undefined = opts?.leavingEl;
  const back = opts?.direction === 'back';

  const root = createAnimation('page-transition').easing(EASING);

  // Con movimiento reducido no se anima: solo se resuelve el cambio.
  if (prefersReducedMotion()) return root.duration(0);

  const admin = isAdminPage(entering) || isAdminPage(leaving);
  root.duration(admin ? 220 : 260);

  if (entering) {
    root.addAnimation(
      createAnimation()
        .addElement(entering)
        .beforeStyles({ opacity: '0' })
        .fromTo('opacity', '0', '1')
        .fromTo(
          'transform',
          admin ? 'translateY(8px)' : `translateX(${back ? '-22px' : '22px'})`,
          'translate(0, 0)',
        )
        // Imprescindible: sin esto el `opacity: 0` inline sobrevive al final
        // de la animación y la página queda invisible (pantalla en negro).
        .afterClearStyles(['opacity', 'transform']),
    );
  }

  // La saliente solo se desvanece: si también se moviera, en admin se vería
  // el sidebar viajando por la pantalla. También hay que limpiarle el estilo,
  // porque Ionic reutiliza ese mismo elemento al volver a la página.
  if (leaving) {
    root.addAnimation(
      createAnimation()
        .addElement(leaving)
        .duration(admin ? 120 : 160)
        .fromTo('opacity', '1', '0')
        .afterClearStyles(['opacity']),
    );
  }

  return root;
};
