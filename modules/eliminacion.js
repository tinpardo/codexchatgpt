/**
 * Funciones para borrar objetos del arreglo de formas.
 */

/**
 * Elimina una forma por su id.
 * @param {Array} shapes Arreglo de formas.
 * @param {number|string} id Identificador de la forma a eliminar.
 * @returns {Array} Nuevo arreglo sin la forma indicada.
 */
export function deleteById(shapes, id) {
  return shapes.filter((s) => s.id !== id);
}

/**
 * Elimina varias formas a la vez.
 * @param {Array} shapes Arreglo de formas.
 * @param {Array<number|string>} ids Lista de identificadores a eliminar.
 * @returns {Array} Nuevo arreglo sin las formas indicadas.
 */
export function deleteMany(shapes, ids) {
  const toDelete = new Set(ids);
  return shapes.filter((s) => !toDelete.has(s.id));
}
