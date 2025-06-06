export function setFontFamily(shape, family) {
  return { ...shape, fontFamily: family };
}

export function setFontSize(shape, size) {
  return { ...shape, fontSize: size };
}

export function setFontColor(shape, color) {
  return { ...shape, fontColor: color };
}

export function toggleBold(shape) {
  const fontWeight = shape.fontWeight === 'bold' ? 'normal' : 'bold';
  return { ...shape, fontWeight };
}

export function toggleItalic(shape) {
  const fontStyle = shape.fontStyle === 'italic' ? 'normal' : 'italic';
  return { ...shape, fontStyle };
}

export function toggleUnderline(shape) {
  return { ...shape, underline: !shape.underline };
}

export function updateText(shape, text) {
  return { ...shape, text };
}

export function applyTextStyle(ctx, shape) {
  const {
    fontSize = 20,
    fontFamily = 'sans-serif',
    fontWeight = 'normal',
    fontStyle = 'normal',
    textAlign = 'center',
    textBaseline = 'middle',
    fontColor = '#000000',
  } = shape;
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = fontColor;
  ctx.textAlign = textAlign;
  ctx.textBaseline = textBaseline;
}

export function drawText(ctx, shape) {
  ctx.save();
  ctx.translate(shape.x, shape.y);
  ctx.rotate(((shape.rotation || 0) * Math.PI) / 180);
  ctx.globalAlpha = shape.opacity ?? 1;
  applyTextStyle(ctx, shape);
  const content = shape.text ?? '';
  ctx.fillText(content, 0, 0);
  if (shape.underline) {
    const metrics = ctx.measureText(content);
    const offset = shape.fontSize * 0.1;
    ctx.beginPath();
    ctx.moveTo(-metrics.width / 2, offset);
    ctx.lineTo(metrics.width / 2, offset);
    ctx.lineWidth = shape.strokeWidth || 1;
    ctx.strokeStyle = shape.fontColor || '#000000';
    ctx.stroke();
  }
  ctx.restore();
}

export function measureText(ctx, shape) {
  applyTextStyle(ctx, shape);
  const metrics = ctx.measureText(shape.text ?? '');
  return {
    width: metrics.width,
    ascent: metrics.actualBoundingBoxAscent,
    descent: metrics.actualBoundingBoxDescent,
  };
}
