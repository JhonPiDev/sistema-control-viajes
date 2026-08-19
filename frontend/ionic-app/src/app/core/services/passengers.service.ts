import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';
import { BoardingStatus, Passenger } from '../models/models';

@Injectable({ providedIn: 'root' })
export class PassengersService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  async findByTrip(tripId: string): Promise<Passenger[]> {
    return firstValueFrom(
      this.http.get<Passenger[]>(`${this.config.apiUrl}/trips/${tripId}/passengers`),
    );
  }

  async add(tripId: string, name: string, document: string): Promise<Passenger> {
    return firstValueFrom(
      this.http.post<Passenger>(`${this.config.apiUrl}/trips/${tripId}/passengers`, {
        name,
        document,
      }),
    );
  }

  async checkIn(id: string, status: BoardingStatus): Promise<Passenger> {
    return firstValueFrom(
      this.http.patch<Passenger>(`${this.config.apiUrl}/passengers/${id}/check-in`, {
        status,
      }),
    );
  }
}
