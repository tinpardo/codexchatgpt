export function generateThumbnail(canvas, maxWidth = 200) {
  if (!canvas) return null;
  const scale = maxWidth / canvas.width;
  const width = canvas.width * scale;
  const height = canvas.height * scale;
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = width;
  thumbCanvas.height = height;
  const ctx = thumbCanvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.drawImage(canvas, 0, 0);
  return thumbCanvas.toDataURL('image/png');
}
