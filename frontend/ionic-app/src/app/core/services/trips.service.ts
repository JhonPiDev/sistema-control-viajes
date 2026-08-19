import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';
import { PagedResult, Trip } from '../models/models';

/**
 * Gestión de estado global de viajes: expone signals que las
 * páginas consumen directamente, evitando llamadas HTTP
 * redundantes cuando varias pantallas necesitan la misma data.
 */
@Injectable({ providedIn: 'root' })
export class TripsService {
  readonly trips = signal<Trip[]>([]);
  readonly currentTrip = signal<Trip | null>(null);
  readonly loading = signal(false);

  constructor(private http: HttpClient, private config: ConfigService) {}

  private get base() {
    return `${this.config.apiUrl}/trips`;
  }

  async list(page = 1, limit = 10, status?: string): Promise<PagedResult<Trip>> {
    this.loading.set(true);
    try {
      let url = `${this.base}?page=${page}&limit=${limit}`;
      if (status) url += `&status=${status}`;
      const res = await firstValueFrom(this.http.get<PagedResult<Trip>>(url));
      this.trips.set(res.data);
      return res;
    } finally {
      this.loading.set(false);
    }
  }

  async getById(id: string): Promise<Trip> {
    const trip = await firstValueFrom(this.http.get<Trip>(`${this.base}/${id}`));
    this.currentTrip.set(trip);
    return trip;
  }

  async create(payload: {
    name: string;
    origin: string;
    destination: string;
    driverId: string;
    passengers?: { name: string; document: string }[];
  }): Promise<Trip> {
    return firstValueFrom(this.http.post<Trip>(this.base, payload));
  }

  async saveSignature(id: string, signatureData: string): Promise<Trip> {
    const trip = await firstValueFrom(
      this.http.post<Trip>(`${this.base}/${id}/signature`, { signatureData }),
    );
    this.currentTrip.set(trip);
    return trip;
  }

  async start(id: string): Promise<Trip> {
    const trip = await firstValueFrom(this.http.post<Trip>(`${this.base}/${id}/start`, {}));
    this.currentTrip.set(trip);
    return trip;
  }

  async finish(id: string): Promise<Trip> {
    const trip = await firstValueFrom(this.http.post<Trip>(`${this.base}/${id}/finish`, {}));
    this.currentTrip.set(trip);
    return trip;
  }
}
