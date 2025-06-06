// Colección de utilidades para manipular propiedades de formas
// Proporciona funciones para modificar colores, líneas, sombra, opacidad y más.
export const defaultProperties = {
  fillColor: '#ff0000',
  strokeColor: '#000000',
  strokeWidth: 1,
  lineDash: 0,
  lineCap: 'butt',
  lineJoin: 'miter',
  shadowColor: 'rgba(0,0,0,0)',
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  opacity: 1,
  rotation: 0,
  fontSize: 20,
  fontColor: '#000000',
  gradientFrom: null,
  gradientTo: null,
  pattern: null,
};


export const setFillColor = (shape, color) => ({ ...shape, fillColor: color });

export const setStrokeColor = (shape, color) => ({ ...shape, strokeColor: color });

export const setStrokeWidth = (shape, width) => ({ ...shape, strokeWidth: width });

export const setLineDash = (shape, dash) => ({ ...shape, lineDash: dash });

export const setLineCap = (shape, cap) => ({ ...shape, lineCap: cap });

export const setLineJoin = (shape, join) => ({ ...shape, lineJoin: join });

export const setShadow = (
  shape,
  { color = 'rgba(0,0,0,0)', blur = 0, offsetX = 0, offsetY = 0 }
) => ({
  ...shape,
  shadowColor: color,
  shadowBlur: blur,
  shadowOffsetX: offsetX,
  shadowOffsetY: offsetY,
});

export const setOpacity = (shape, value) => ({ ...shape, opacity: value });

export const setRotation = (shape, angle) => ({ ...shape, rotation: angle });

export const setFontSize = (shape, size) => ({ ...shape, fontSize: size });

export const setFontColor = (shape, color) => ({ ...shape, fontColor: color });

export const setGradientFill = (shape, from, to) => ({
  ...shape,
  gradientFrom: from,
  gradientTo: to,
});

export const setPatternFill = (shape, pattern) => ({ ...shape, pattern });

export const applyStyles = (ctx, shape) => {
  const fill = getFillStyle(ctx, shape);
  ctx.fillStyle = fill;
  ctx.strokeStyle = shape.strokeColor;
  ctx.lineWidth = shape.strokeWidth;
  ctx.setLineDash(shape.lineDash > 0 ? [shape.lineDash] : []);
  ctx.lineCap = shape.lineCap || 'butt';
  ctx.lineJoin = shape.lineJoin || 'miter';
  ctx.globalAlpha = shape.opacity;
  ctx.shadowColor = shape.shadowColor || 'rgba(0,0,0,0)';
  ctx.shadowBlur = shape.shadowBlur || 0;
  ctx.shadowOffsetX = shape.shadowOffsetX || 0;
  ctx.shadowOffsetY = shape.shadowOffsetY || 0;
};

export const getFillStyle = (ctx, shape) => {
  if (shape.pattern) return shape.pattern;
  if (shape.gradientFrom && shape.gradientTo) {
    const { width, height, radius } = shape;
    const w = width || radius * 2 || 0;
    const h = height || radius * 2 || 0;
    const grad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    grad.addColorStop(0, shape.gradientFrom);
    grad.addColorStop(1, shape.gradientTo);
    return grad;
  }
  return shape.fillColor;
};

export const moveShape = (shape, dx, dy) => ({
  ...shape,
  x: shape.x + dx,
  y: shape.y + dy,
});

export const resizeShape = (shape, dw, dh) => ({
  ...shape,
  width: Math.max(1, (shape.width || 0) + dw),
  height: Math.max(1, (shape.height || 0) + dh),
  radius: Math.max(1, (shape.radius || 0) + Math.max(dw, dh) / 2),
});

export const createShape = (type, props = {}) => ({
  ...defaultProperties,
  type,
  id: Date.now(),
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  radius: 50,
  text: '',
  ...props,
});
