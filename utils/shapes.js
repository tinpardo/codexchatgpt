export const pointToShape = (shape, px, py) => {
  const angle = (-shape.rotation * Math.PI) / 180;
  const dx = px - shape.x;
  const dy = py - shape.y;
  return {
    x: dx * Math.cos(angle) - dy * Math.sin(angle),
    y: dx * Math.sin(angle) + dy * Math.cos(angle),
  };
};

export const shapeToPoint = (shape, px, py) => {
  const angle = (shape.rotation * Math.PI) / 180;
  return {
    x: shape.x + px * Math.cos(angle) - py * Math.sin(angle),
    y: shape.y + px * Math.sin(angle) + py * Math.cos(angle),
  };
};

export const bounds = (shape) => {
  const w = shape.width || shape.radius * 2 || shape.fontSize * (shape.text?.length || 1);
  const h = shape.height || shape.radius * 2 || shape.fontSize;
  return { w, h };
};

export const cornerHit = (shape, px, py) => {
  const { w, h } = bounds(shape);
  const p = pointToShape(shape, px, py);
  const size = 6;
  if (Math.abs(p.x + w / 2) <= size && Math.abs(p.y + h / 2) <= size) return 'nw';
  if (Math.abs(p.x - w / 2) <= size && Math.abs(p.y + h / 2) <= size) return 'ne';
  if (Math.abs(p.x - w / 2) <= size && Math.abs(p.y - h / 2) <= size) return 'se';
  if (Math.abs(p.x + w / 2) <= size && Math.abs(p.y - h / 2) <= size) return 'sw';
  if (Math.abs(p.x) <= size && Math.abs(p.y + h / 2 + 20) <= size) return 'rotate';
  return null;
};

export const getCornerPos = (shape, corner) => {
  const { w, h } = bounds(shape);
  const map = {
    nw: { x: -w / 2, y: -h / 2 },
    ne: { x: w / 2, y: -h / 2 },
    se: { x: w / 2, y: h / 2 },
    sw: { x: -w / 2, y: h / 2 },
  };
  const pt = map[corner];
  const angle = (shape.rotation * Math.PI) / 180;
  return {
    x: shape.x + pt.x * Math.cos(angle) - pt.y * Math.sin(angle),
    y: shape.y + pt.x * Math.sin(angle) + pt.y * Math.cos(angle),
  };
};

export const drawShape = (ctx, shape, selectedId) => {
  ctx.save();
  ctx.translate(shape.x, shape.y);
  ctx.rotate((shape.rotation * Math.PI) / 180);
  ctx.globalAlpha = shape.opacity;
  ctx.lineWidth = shape.strokeWidth;
  ctx.strokeStyle = shape.strokeColor;
  ctx.fillStyle = shape.fillColor;
  if (shape.lineDash > 0) {
    ctx.setLineDash([shape.lineDash]);
  } else {
    ctx.setLineDash([]);
  }
  switch (shape.type) {
    case 'rectangle':
      ctx.fillRect(-shape.width/2, -shape.height/2, shape.width, shape.height);
      ctx.strokeRect(-shape.width/2, -shape.height/2, shape.width, shape.height);
      break;
    case 'square':
      ctx.fillRect(-shape.width/2, -shape.width/2, shape.width, shape.width);
      ctx.strokeRect(-shape.width/2, -shape.width/2, shape.width, shape.width);
      break;
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, shape.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      break;
    case 'ellipse':
      ctx.beginPath();
      ctx.ellipse(0, 0, shape.width/2, shape.height/2, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(0, -shape.height/2);
      ctx.lineTo(shape.width/2, shape.height/2);
      ctx.lineTo(-shape.width/2, shape.height/2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(0, -shape.height/2);
      ctx.lineTo(shape.width/2, 0);
      ctx.lineTo(0, shape.height/2);
      ctx.lineTo(-shape.width/2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'pentagon':
    case 'hexagon':
    case 'heptagon':
    case 'octagon':
      const sidesMap = { pentagon:5, hexagon:6, heptagon:7, octagon:8 };
      const sides = sidesMap[shape.type];
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides;
        const px = shape.radius * Math.cos(angle);
        const py = shape.radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'star':
      ctx.beginPath();
      const spikes = 5;
      const outerRadius = shape.radius;
      const innerRadius = shape.radius/2;
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes;
        const px = r * Math.cos(angle);
        const py = r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'trapezoid':
      ctx.beginPath();
      ctx.moveTo(-shape.width/2, -shape.height/2);
      ctx.lineTo(shape.width/2, -shape.height/2);
      ctx.lineTo(shape.width/4, shape.height/2);
      ctx.lineTo(-shape.width/4, shape.height/2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'parallelogram':
      ctx.beginPath();
      ctx.moveTo(-shape.width/2 + shape.width/4, -shape.height/2);
      ctx.lineTo(shape.width/2 + shape.width/4, -shape.height/2);
      ctx.lineTo(shape.width/2 - shape.width/4, shape.height/2);
      ctx.lineTo(-shape.width/2 - shape.width/4, shape.height/2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'arrow':
      ctx.beginPath();
      ctx.moveTo(-shape.width/2, -shape.height/4);
      ctx.lineTo(0, -shape.height/4);
      ctx.lineTo(0, -shape.height/2);
      ctx.lineTo(shape.width/2, 0);
      ctx.lineTo(0, shape.height/2);
      ctx.lineTo(0, shape.height/4);
      ctx.lineTo(-shape.width/2, shape.height/4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'heart':
      ctx.beginPath();
      ctx.moveTo(0, shape.height/4);
      ctx.bezierCurveTo(shape.width/2, -shape.height/4, shape.width/2, shape.height/2, 0, shape.height/2);
      ctx.bezierCurveTo(-shape.width/2, shape.height/2, -shape.width/2, -shape.height/4, 0, shape.height/4);
      ctx.fill();
      ctx.stroke();
      break;
    case 'image':
      if (shape.img) {
        ctx.drawImage(shape.img, -shape.width/2, -shape.height/2, shape.width, shape.height);
      }
      break;
    case 'text':
      ctx.fillStyle = shape.fontColor;
      ctx.font = `${shape.fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(shape.text, 0, 0);
      break;
    default:
      break;
  }
  if (shape.id === selectedId) {
    const { w, h } = bounds(shape);
    const size = 6;
    ctx.strokeStyle = 'blue';
    ctx.setLineDash([4]);
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.setLineDash([]);
    const corners = [
      [-w / 2, -h / 2],
      [w / 2, -h / 2],
      [w / 2, h / 2],
      [-w / 2, h / 2],
    ];
    ctx.fillStyle = 'white';
    corners.forEach(([cx, cy]) => {
      ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
      ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
    });
    ctx.beginPath();
    ctx.arc(0, -h / 2 - 20, size / 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
};
