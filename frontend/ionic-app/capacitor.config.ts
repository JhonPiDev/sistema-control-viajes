import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Config de Capacitor: permite compilar esta MISMA base de código Ionic +
 * Angular como una app móvil nativa (Android, y iOS si se agrega esa
 * plataforma) para el rol de Conductor, sin duplicar código con la versión
 * web de escritorio que usa el Administrador.
 *
 * `webDir: 'www'` apunta al mismo build de producción que ya genera
 * `npm run build` (usado también para el despliegue web en Vercel/Docker).
 * Antes de compilar la app nativa, corre el build con la URL del API en
 * producción, por ejemplo:
 *
 *   API_URL=https://api-gateway-y35g.onrender.com/api npm run build
 *   npx cap sync android
 *   npx cap open android   # abre Android Studio para compilar el APK
 *
 * Ver README, sección "App móvil nativa (Capacitor)".
 */
const config: CapacitorConfig = {
  appId: 'com.factoriaweb.controlviajes',
  appName: 'Control de Viajes',
  webDir: 'www',
  server: {
    // Necesario en Android para que las llamadas HTTPS al API Gateway
    // funcionen correctamente desde el WebView nativo.
    androidScheme: 'https',
  },
};

export default config;
