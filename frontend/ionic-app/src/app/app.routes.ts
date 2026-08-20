import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },

  // ---------------- ADMIN (Web escritorio) ----------------
  {
    path: 'admin',
    canActivate: [roleGuard('ADMIN')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/admin/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'trips/new',
        loadComponent: () =>
          import('./pages/admin/trip-create/trip-create.page').then((m) => m.TripCreatePage),
      },
      {
        path: 'trips/:id',
        loadComponent: () =>
          import('./pages/admin/trip-detail/trip-detail.page').then((m) => m.TripDetailPage),
      },
      {
        path: 'drivers',
        loadComponent: () =>
          import('./pages/admin/drivers/drivers.page').then((m) => m.DriversPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.page').then((m) => m.SettingsPage),
      },
    ],
  },

  // ---------------- CONDUCTOR (Móvil) ----------------
  {
    path: 'driver',
    canActivate: [roleGuard('DRIVER')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'my-trip' },
      {
        path: 'my-trip',
        loadComponent: () =>
          import('./pages/driver/my-trip/my-trip.page').then((m) => m.MyTripPage),
      },
      {
        // Cuando el conductor tiene más de un viaje activo, "my-trip" muestra
        // un selector y cada item enlaza aquí con el id específico.
        path: 'my-trip/:id',
        loadComponent: () =>
          import('./pages/driver/my-trip/my-trip.page').then((m) => m.MyTripPage),
      },
      {
        path: 'checkin/:id',
        loadComponent: () =>
          import('./pages/driver/checkin/checkin.page').then((m) => m.CheckinPage),
      },
      {
        path: 'signature/:id',
        loadComponent: () =>
          import('./pages/driver/signature/signature.page').then((m) => m.SignaturePage),
      },
      {
        path: 'en-route/:id',
        loadComponent: () =>
          import('./pages/driver/en-route/en-route.page').then((m) => m.EnRoutePage),
      },
      {
        path: 'close-trip/:id',
        loadComponent: () =>
          import('./pages/driver/close-trip/close-trip.page').then((m) => m.CloseTripPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.page').then((m) => m.SettingsPage),
      },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
