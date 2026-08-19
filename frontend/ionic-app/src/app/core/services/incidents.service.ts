import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';
import { Incident, IncidentType } from '../models/models';

@Injectable({ providedIn: 'root' })
export class IncidentsService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  async findByTrip(tripId: string): Promise<Incident[]> {
    return firstValueFrom(
      this.http.get<Incident[]>(`${this.config.apiUrl}/trips/${tripId}/incidents`),
    );
  }

  async create(tripId: string, type: IncidentType, description: string): Promise<Incident> {
    return firstValueFrom(
      this.http.post<Incident>(`${this.config.apiUrl}/trips/${tripId}/incidents`, {
        type,
        description,
      }),
    );
  }
}
