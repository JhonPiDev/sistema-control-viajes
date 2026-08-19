import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';
import { TripReport } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  async getTripReport(tripId: string): Promise<TripReport> {
    return firstValueFrom(
      this.http.get<TripReport>(`${this.config.apiUrl}/trips/${tripId}/report`),
    );
  }
}
