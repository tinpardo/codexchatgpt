export function cmykToRgb(c, m, y, k) {
  const c1 = c / 100;
  const m1 = m / 100;
  const y1 = y / 100;
  const k1 = k / 100;
  const r = Math.round(255 * (1 - c1) * (1 - k1));
  const g = Math.round(255 * (1 - m1) * (1 - k1));
  const b = Math.round(255 * (1 - y1) * (1 - k1));
  return { r, g, b };
}

export function cmykToHex(c, m, y, k) {
  const { r, g, b } = cmykToRgb(c, m, y, k);
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function applyCmykColor(shapes, id, { c, m, y, k }, property = 'fillColor') {
  const hex = cmykToHex(c, m, y, k);
  return shapes.map((s) => (s.id === id ? { ...s, [property]: hex } : s));
}
