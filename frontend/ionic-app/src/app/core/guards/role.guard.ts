import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * roleGuard('ADMIN') / roleGuard('DRIVER') — bloquea rutas según el rol
 * del usuario autenticado, redirigiendo a su home correspondiente.
 */
export const roleGuard = (role: 'ADMIN' | 'DRIVER'): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }
    if (auth.hasRole(role)) return true;

    router.navigate(auth.hasRole('ADMIN') ? ['/admin'] : ['/driver']);
    return false;
  };
};
