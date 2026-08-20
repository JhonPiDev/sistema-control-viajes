export type Role = 'ADMIN' | 'DRIVER';
export type TripStatus = 'PENDING' | 'IN_PROGRESS' | 'FINISHED';
export type BoardingStatus = 'PENDING' | 'BOARDED' | 'ABSENT';
export type ExpenseType = 'FUEL' | 'TOLL' | 'REPAIR' | 'OTHER';
export type IncidentType = 'DELAY' | 'PASSENGER_ISSUE' | 'DETOUR' | 'OTHER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface Stop {
  id: string;
  tripId: string;
  city: string;
  order: number;
  createdAt: string;
}

export interface Passenger {
  id: string;
  tripId: string;
  name: string;
  document: string;
  boardingStatus: BoardingStatus;
  checkedAt?: string;
  // Parada donde abordó. undefined/null = abordó en el origen del viaje.
  stopId?: string | null;
  stop?: Stop | null;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
}

export interface CreatedDriver extends Driver {
  generatedPassword: string;
}

export interface Trip {
  id: string;
  name: string;
  origin: string;
  destination: string;
  status: TripStatus;
  signatureData?: string | null;
  signedAt?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  driverId: string;
  driver?: Driver;
  passengers: Passenger[];
  // Paradas intermedias, ya ordenadas (origin -> stops[0] -> ... -> destination).
  stops: Stop[];
  createdAt: string;
}

export interface PagedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface TripStats {
  total: number;
  byStatus: Record<TripStatus, number>;
  passengersTotal: number;
}

export interface Expense {
  id: string;
  tripId: string;
  type: ExpenseType;
  amount: number;
  concept: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  tripId: string;
  type: IncidentType;
  description: string;
  createdAt: string;
}

export interface StopSummary {
  stopId: string;
  city: string;
  order: number;
  boarded: number;
}

export interface TripReport {
  trip: Partial<Trip>;
  passengers: {
    total: number;
    boarded: number;
    boardedAtOrigin: number;
    list: Passenger[];
    byStop: StopSummary[];
  };
  expenses: { total: number; count: number };
  incidents: { total: number; list: Incident[] };
  generatedAt: string;
}
