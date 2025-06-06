import { useState, useCallback } from 'react';

/**
 * Hook para manejar el nivel de zoom de la aplicación.
 * @param {number} initial Nivel de zoom inicial.
 * @param {number} step Incremento/decremento por cada operación.
 */
export default function useZoom(initial = 1, step = 0.1) {
  const [zoom, setZoom] = useState(initial);

  const zoomIn = useCallback(() => {
    setZoom((z) => z + step);
  }, [step]);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(step, z - step));
  }, [step]);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  return { zoom, zoomIn, zoomOut, resetZoom };
}
