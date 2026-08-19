/**
 * Convierte un nombre en un slug simple: minúsculas, sin tildes,
 * sin espacios ni signos de puntuación. Usado para autogenerar el
 * correo y la contraseña de los conductores que crea el administrador
 * (ej. "Carlos Pérez" -> "carlosperez").
 */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[̀-ͯ]/g, '') // quita marcas diacríticas (á -> a, é -> e, ñ -> n...)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); // deja solo letras y números
}
