import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';
import { CreatedDriver, Driver } from '../models/models';

@Injectable({ providedIn: 'root' })
export class DriversService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  async list(): Promise<Driver[]> {
    return firstValueFrom(this.http.get<Driver[]>(`${this.config.apiUrl}/drivers`));
  }

  async create(name: string): Promise<CreatedDriver> {
    return firstValueFrom(
      this.http.post<CreatedDriver>(`${this.config.apiUrl}/drivers`, { name }),
    );
  }
}
