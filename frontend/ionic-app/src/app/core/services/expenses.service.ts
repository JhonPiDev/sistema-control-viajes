import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';
import { Expense, ExpenseType } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ExpensesService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  async findByTrip(tripId: string): Promise<Expense[]> {
    return firstValueFrom(
      this.http.get<Expense[]>(`${this.config.apiUrl}/trips/${tripId}/expenses`),
    );
  }

  async create(tripId: string, type: ExpenseType, amount: number, concept: string): Promise<Expense> {
    return firstValueFrom(
      this.http.post<Expense>(`${this.config.apiUrl}/trips/${tripId}/expenses`, {
        type,
        amount,
        concept,
      }),
    );
  }
}
