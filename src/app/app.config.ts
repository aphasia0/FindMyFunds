// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { routes } from './app.routes';

const FmfPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#fff1f3',
      100: '#ffe3e7',
      200: '#ffd1da',
      300: '#ffa3b8',
      400: '#ff6b8a',
      500: '#ff385c',
      600: '#e00b41',
      700: '#b80033',
      800: '#8f0028',
      900: '#6e0020',
      950: '#3f0011',
    },
    error: {
      50:  '#fdf1ee',
      100: '#fbe0d9',
      200: '#f5c2b4',
      300: '#eda18c',
      400: '#df7256',
      500: '#c13515',
      600: '#b32505',
      700: '#941f04',
      800: '#741903',
      900: '#541202',
      950: '#2e0a01',
    },
  },
});

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: { preset: FmfPreset, options: { darkModeSelector: false } },
    }),
    provideCharts(withDefaultRegisterables()),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'it',
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient],
        },
      })
    ),
  ],
};
