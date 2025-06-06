/**
 * Funciones para manejar páginas en el editor de canvas.
 */

/**
 * Crea una nueva página vacía.
 * @param {number} width Ancho de la página.
 * @param {number} height Alto de la página.
 * @returns {Object} Objeto de página.
 */
export function crearPagina(width = 816, height = 1056) {
  return {
    id: Date.now() + Math.random(),
    width,
    height,
    shapes: []
  };
}

/**
 * Agrega una página vacía al arreglo existente.
 * @param {Array} paginas Lista de páginas actuales.
 * @param {number} width Ancho para la nueva página.
 * @param {number} height Alto para la nueva página.
 * @returns {Array} Nuevo arreglo de páginas con la añadida.
 */
export function agregarPagina(paginas, width = 816, height = 1056) {
  return [...paginas, crearPagina(width, height)];
}
