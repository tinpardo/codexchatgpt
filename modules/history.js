import { useState, useRef, useCallback } from 'react';

/**
 * Hook para manejar historial de deshacer/rehacer con un límite fijo.
 * @param {any} initial Estado inicial.
 * @param {number} limit Cantidad máxima de estados a almacenar.
 */
export default function useHistory(initial = [], limit = 4) {
  const [state, setState] = useState(initial);
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const skip = useRef(false);

  const set = useCallback(
    (updater) => {
      setState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (!skip.current) {
          undoStack.current.push(prev);
          if (undoStack.current.length > limit) undoStack.current.shift();
          redoStack.current = [];
        } else {
          skip.current = false;
        }
        return next;
      });
    },
    [limit]
  );

  const replace = useCallback((newState) => {
    skip.current = true;
    setState(newState);
  }, []);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current.pop();
    redoStack.current.push(state);
    if (redoStack.current.length > limit) redoStack.current.shift();
    skip.current = true;
    setState(prev);
  }, [state, limit]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop();
    undoStack.current.push(state);
    if (undoStack.current.length > limit) undoStack.current.shift();
    skip.current = true;
    setState(next);
  }, [state, limit]);

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

  return { state, set, replace, undo, redo, canUndo, canRedo };
}
