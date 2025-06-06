/**
 * Funciones para manejar páginas en el editor de canvas.
 */

/**
 * Crea una nueva página vacía.
 * @param {number} width Ancho de la página.
 * @param {number} height Alto de la página.
 * @returns {Object} Objeto de página.
 */
export function crearPagina(width = 800, height = 600) {
  return {
    id: Date.now() + Math.random(),
    width,
    height,
    shapes: [],
    thumbnail: null
  };
}

/**
 * Agrega una página vacía al arreglo existente.
 * @param {Array} paginas Lista de páginas actuales.
 * @param {number} width Ancho para la nueva página.
 * @param {number} height Alto para la nueva página.
 * @returns {Array} Nuevo arreglo de páginas con la añadida.
 */
export function agregarPagina(paginas, width = 800, height = 600) {
  return [...paginas, crearPagina(width, height)];
}
