import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';
import { StorageService } from './storage.service';
import { AuthUser, LoginResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<AuthUser | null>(null);

  constructor(
    private http: HttpClient,
    private config: ConfigService,
    private storage: StorageService,
  ) {
    const savedUser = this.storage.getUser<AuthUser>();
    if (savedUser && this.storage.getToken()) {
      this.currentUser.set(savedUser);
    }
  }

  async login(email: string, password: string): Promise<AuthUser> {
    const res = await firstValueFrom(
      this.http.post<LoginResponse>(`${this.config.apiUrl}/auth/login`, {
        email,
        password,
      }),
    );
    this.storage.setToken(res.accessToken);
    this.storage.setUser(res.user);
    this.currentUser.set(res.user);
    return res.user;
  }

  logout() {
    this.storage.clearSession();
    this.currentUser.set(null);
  }

  isAuthenticated(): boolean {
    return !!this.storage.getToken();
  }

  hasRole(role: 'ADMIN' | 'DRIVER'): boolean {
    return this.currentUser()?.role === role;
  }
}
