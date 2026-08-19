import { Injectable } from '@angular/core';

const TOKEN_KEY = 'viajes_token';
const USER_KEY = 'viajes_user';
const THEME_KEY = 'viajes_theme';
const CUSTOM_COLOR_KEY = 'viajes_custom_color';

/**
 * Wrapper simple sobre localStorage (persistencia de sesión y
 * preferencias de tema entre recargas del navegador / app).
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
  setUser(user: unknown) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  getUser<T>(): T | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  }
  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  setThemeMode(mode: string) {
    localStorage.setItem(THEME_KEY, mode);
  }
  getThemeMode(): string | null {
    return localStorage.getItem(THEME_KEY);
  }
  setCustomColor(color: string) {
    localStorage.setItem(CUSTOM_COLOR_KEY, color);
  }
  getCustomColor(): string | null {
    return localStorage.getItem(CUSTOM_COLOR_KEY);
  }
}
