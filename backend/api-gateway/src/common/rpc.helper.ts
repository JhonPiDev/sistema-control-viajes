import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Llama a un endpoint interno de trips-service u operations-service por
 * HTTP (antes esto era TCP vía @nestjs/microservices; ver el historial de
 * commits para el porqué del cambio: el plan gratis de Render no permite
 * tráfico de red privada entrante en Web Services, así que los
 * microservicios ahora exponen una API HTTP normal protegida con
 * INTERNAL_API_KEY en vez de aislamiento de red).
 *
 * Traduce cualquier error de red o HTTP en una HttpException legible que
 * luego formatea el AllExceptionsFilter. Como trips-service y
 * operations-service ahora son apps Nest HTTP normales, sus errores YA
 * vienen como JSON bien formado ({statusCode, error, message}) sin
 * necesidad de ningún filtro especial del lado del microservicio.
 */
export async function callService<T>(
  baseUrl: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  // 25s en vez de 8s: en el plan gratuito de Render, un microservicio
  // dormido puede tardar hasta ~1 minuto en el PRIMER request tras
  // despertar (el README ya avisa de esto), y 8s se quedaba corto — el
  // gateway se rendía y devolvía un error aunque el microservicio ya
  // estuviera despertando en el fondo.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': process.env.INTERNAL_API_KEY || '',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      throw new HttpException(
        'El microservicio no respondió a tiempo',
        HttpStatus.GATEWAY_TIMEOUT,
      );
    }
    throw new HttpException(
      'Error de comunicación con el microservicio',
      HttpStatus.BAD_GATEWAY,
    );
  }
  clearTimeout(timeoutId);

  // Respuestas sin body (204, o error que no devolvió JSON)
  let payload: any = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message = payload?.message ?? 'Error del microservicio';
    throw new HttpException(message, response.status);
  }

  return payload as T;
}
