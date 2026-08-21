import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Llama a un endpoint interno de trips-service/operations-service por HTTP
 * (protegido con INTERNAL_API_KEY, ver internal-auth.guard.ts) y traduce
 * cualquier error de red o HTTP en una HttpException legible.
 */
export async function callService<T>(
  baseUrl: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  // 25s: un microservicio dormido (plan free de Render) puede tardar
  // hasta ~1 min en el primer request tras despertar.
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
