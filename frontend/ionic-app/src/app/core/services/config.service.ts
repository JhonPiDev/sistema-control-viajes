import { Injectable } from '@angular/core';

/**
 * Configuración cargada en runtime desde /assets/config.json.
 * Permite cambiar la URL del API sin reconstruir el bundle:
 * el contenedor Docker del frontend sustituye ese archivo con
 * envsubst usando la variable de entorno API_URL al arrancar.
 */
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private config: { apiUrl: string } = { apiUrl: 'http://localhost:3000/api' };

  async load(): Promise<void> {
    try {
      const res = await fetch('assets/config.json', { cache: 'no-cache' });
      if (res.ok) {
        this.config = await res.json();
      }
    } catch {
      // Si falla, se mantiene el valor por defecto
    }
  }

  get apiUrl(): string {
    return this.config.apiUrl;
  }
}
