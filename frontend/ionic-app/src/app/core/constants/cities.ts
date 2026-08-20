/**
 * Catálogo fijo de ciudades/terminales disponibles para origen, destino y
 * paradas de un viaje. Es una lista predefinida (no administrable desde el
 * admin) a propósito: simplifica el alcance de la prueba técnica.
 *
 * IMPORTANTE: esta misma lista está duplicada en:
 *   - backend/trips-service/src/common/constants/cities.ts
 *   - backend/api-gateway/src/common/constants/cities.ts
 * Si se agrega/quita una ciudad, hay que actualizar los 3 archivos.
 */
export const CITIES = [
  'Bogotá',
  'Medellín',
  'Cali',
  'Barranquilla',
  'Cartagena',
  'Bucaramanga',
  'Ibagué',
  'Pereira',
  'Manizales',
  'Neiva',
  'Villavicencio',
  'Cúcuta',
  'Santa Marta',
  'Armenia',
  'Popayán',
] as const;

export type City = (typeof CITIES)[number];
