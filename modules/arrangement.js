export function bringToFront(shapes, id) {
  const index = shapes.findIndex(s => s.id === id);
  if (index === -1) return shapes;
  const item = shapes[index];
  const newShapes = [...shapes.slice(0, index), ...shapes.slice(index + 1), item];
  return newShapes;
}

export function sendToBack(shapes, id) {
  const index = shapes.findIndex(s => s.id === id);
  if (index === -1) return shapes;
  const item = shapes[index];
  const newShapes = [item, ...shapes.slice(0, index), ...shapes.slice(index + 1)];
  return newShapes;
}

export function bringForward(shapes, id) {
  const index = shapes.findIndex(s => s.id === id);
  if (index === -1 || index === shapes.length - 1) return shapes;
  const newShapes = shapes.slice();
  const [item] = newShapes.splice(index, 1);
  newShapes.splice(index + 1, 0, item);
  return newShapes;
}

export function sendBackward(shapes, id) {
  const index = shapes.findIndex(s => s.id === id);
  if (index <= 0) return shapes;
  const newShapes = shapes.slice();
  const [item] = newShapes.splice(index, 1);
  newShapes.splice(index - 1, 0, item);
  return newShapes;
}
