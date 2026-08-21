/**
 * Convierte lo que el usuario escribió en un importe utilizable.
 *
 * En Colombia se escribe "1.500,75": punto para los miles y coma para los
 * decimales. Pero también se teclea "1500", "1.500" o "1500,5". Un simple
 * Number() falla con todos salvo el último, así que se deduce cuál de los
 * separadores es el decimal:
 *
 *   "1.500,75"   -> 1500.75   (la coma final manda)
 *   "1.500"      -> 1500      (separador de miles: 3 dígitos detrás)
 *   "1500,5"     -> 1500.5
 *   "1.500.000"  -> 1500000
 *   "1500.50"    -> 1500.5    (2 dígitos detrás: decimal)
 *
 * Devuelve null si no queda un número positivo.
 */
export function parseAmount(input: string): number | null {
  const raw = (input ?? '').trim();
  if (!raw) return null;

  const lastSep = Math.max(raw.lastIndexOf(','), raw.lastIndexOf('.'));
  let normalized: string;

  if (lastSep === -1) {
    normalized = raw;
  } else {
    const decimals = raw.length - lastSep - 1;
    // Con 3 dígitos detrás es separador de miles ("1.500"); con 1 o 2 es
    // decimal ("1500,75"). Una coma siempre gana como decimal.
    const isDecimal = raw[lastSep] === ',' || (decimals >= 1 && decimals <= 2);
    normalized = isDecimal
      ? raw.slice(0, lastSep).replace(/[.,]/g, '') + '.' + raw.slice(lastSep + 1)
      : raw.replace(/[.,]/g, '');
  }

  if (!/^\d*\.?\d*$/.test(normalized)) return null;

  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}
