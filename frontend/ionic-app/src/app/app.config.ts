import { ApplicationConfig, APP_INITIALIZER, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';

import { routes } from './app.routes';
import { ConfigService } from './core/services/config.service';
import { ThemeService } from './core/services/theme.service';
import { pageTransition } from './core/animations/page-transition';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

function initializeApp(config: ConfigService, theme: ThemeService) {
  return async () => {
    await config.load();
    theme.init();
  };
}

// Sin esto Angular formatea con el locale en-US ("180,000") en vez del
// colombiano ("180.000,00"), que es el que usan los importes de la app.
registerLocaleData(localeEsCo);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-CO' },
    provideIonicAngular({ navAnimation: pageTransition }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [ConfigService, ThemeService],
      multi: true,
    },
  ],
};
