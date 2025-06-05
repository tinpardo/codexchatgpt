import React, { useRef, useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { TbRectangle, TbSquare, TbCircle, TbTriangle, TbDiamond, TbPentagon, TbHexagon, TbOctagon, TbStar, TbArrowRight, TbHeart, TbTypography } from 'react-icons/tb';
import { IoEllipse } from 'react-icons/io5';
import { BsHeptagon } from 'react-icons/bs';
import { PiParallelogram } from 'react-icons/pi';
import { MdImage } from 'react-icons/md';

const TrapezoidIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <polygon points="4,6 20,6 16,18 8,18" fill="currentColor" />
  </svg>
);

export default function CanvasPage() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [shapes, setShapes] = useState([]);
  const [pendingImage, setPendingImage] = useState(null);
  const [drawingImage, setDrawingImage] = useState(false);
  const [imageStart, setImageStart] = useState(null);
  const [current, setCurrent] = useState({
    type: 'rectangle',
    x: 50,
    y: 50,
    width: 100,
    height: 100,
    radius: 50,
    sides: 5,
    text: 'Texto',
    fillColor: '#ff0000',
    strokeColor: '#000000',
    strokeWidth: 1,
    rotation: 0,
    opacity: 1,
    lineDash: 0,
    fontSize: 20,
    fontColor: '#000000'
  });
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingId, setResizingId] = useState(null);
  const [resizeStart, setResizeStart] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [drawingShape, setDrawingShape] = useState(false);
  const [pendingShape, setPendingShape] = useState(null);
  const [shapeStart, setShapeStart] = useState(null);
  const [rotateId, setRotateId] = useState(null);
  const [rotateStart, setRotateStart] = useState(null);

  const pointToShape = (shape, px, py) => {
    const angle = (-shape.rotation * Math.PI) / 180;
    const dx = px - shape.x;
    const dy = py - shape.y;
    return {
      x: dx * Math.cos(angle) - dy * Math.sin(angle),
      y: dx * Math.sin(angle) + dy * Math.cos(angle),
    };
  };

  const bounds = (shape) => {
    const w = shape.width || shape.radius * 2 || shape.fontSize * (shape.text?.length || 1);
    const h = shape.height || shape.radius * 2 || shape.fontSize;
    return { w, h };
  };

  const cornerHit = (shape, px, py) => {
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

  const getCornerPos = (shape, corner) => {
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

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes.forEach((shape) => {
      drawShape(ctx, shape);
    });
  }, [shapes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const hit = (shape, x, y) => {
      const w = shape.width || shape.radius * 2 || shape.fontSize * (shape.text?.length || 1);
      const h = shape.height || shape.radius * 2 || shape.fontSize;
      return x >= shape.x - w / 2 && x <= shape.x + w / 2 &&
             y >= shape.y - h / 2 && y <= shape.y + h / 2;
    };

    const handleDown = (e) => {
      const { x, y } = getPos(e);
      if (drawingImage && pendingImage) {
        setImageStart({ x, y });
        return;
      }
      if (drawingShape && pendingShape) {
        setShapeStart({ x, y });
        return;
      }
      if (selectedId !== null) {
        const sel = shapes.find((s) => s.id === selectedId);
        if (sel) {
          const hnd = cornerHit(sel, x, y);
          if (hnd === 'rotate') {
            setRotateId(sel.id);
            setRotateStart({ x, y, angle: sel.rotation });
            return;
          }
          if (['nw', 'ne', 'se', 'sw'].includes(hnd)) {
            const opp = { nw: 'se', ne: 'sw', se: 'nw', sw: 'ne' }[hnd];
            const pos = getCornerPos(sel, opp);
            setResizingId(sel.id);
            setResizeStart({ x: pos.x, y: pos.y, width: sel.width, height: sel.height, radius: sel.radius, fontSize: sel.fontSize });
            return;
          }
        }
      }
      for (let i = shapes.length - 1; i >= 0; i--) {
        const s = shapes[i];
        if (hit(s, x, y)) {
          setSelectedId(s.id);
          if (e.shiftKey) {
            setResizingId(s.id);
            setResizeStart({ x, y, width: s.width, height: s.height, radius: s.radius, fontSize: s.fontSize });
          } else {
            setDraggingId(s.id);
            setDragOffset({ x: x - s.x, y: y - s.y });
          }
          return;
        }
      }
      setSelectedId(null);
    };
    const handleMove = (e) => {
      if (drawingImage || (drawingShape && shapeStart)) return;
      const { x, y } = getPos(e);
      if (rotateId !== null && rotateStart) {
        const sel = shapes.find((s) => s.id === rotateId);
        if (sel) {
          const ang0 = Math.atan2(rotateStart.y - sel.y, rotateStart.x - sel.x);
          const ang1 = Math.atan2(y - sel.y, x - sel.x);
          const diff = ((ang1 - ang0) * 180) / Math.PI;
          setShapes((prev) => prev.map((s) => (s.id === rotateId ? { ...s, rotation: rotateStart.angle + diff } : s)));
        }
        return;
      }
      if (resizingId !== null && resizeStart) {
        const nx = x;
        const ny = y;
        const dx = nx - resizeStart.x;
        const dy = ny - resizeStart.y;
        setShapes((prev) =>
          prev.map((s) => {
            if (s.id !== resizingId) return s;
            if (s.type === 'text') {
              const diff = Math.max(dx, dy);
              return { ...s, fontSize: Math.max(5, resizeStart.fontSize + diff) };
            }
            if (typeof resizeStart.radius === 'number' && ['circle','pentagon','hexagon','heptagon','octagon','star'].includes(s.type)) {
              const diff = Math.max(dx, dy);
              const midx = (nx + resizeStart.x) / 2;
              const midy = (ny + resizeStart.y) / 2;
              return { ...s, radius: Math.max(5, diff / 2), x: midx, y: midy };
            }
            const midx = (nx + resizeStart.x) / 2;
            const midy = (ny + resizeStart.y) / 2;
            return {
              ...s,
              width: Math.max(5, Math.abs(dx)),
              height: Math.max(5, Math.abs(dy)),
              x: midx,
              y: midy,
            };
          })
        );
        return;
      }
      if (draggingId !== null) {
        setShapes((prev) =>
          prev.map((s) =>
            s.id === draggingId ? { ...s, x: x - dragOffset.x, y: y - dragOffset.y } : s
          )
        );
      }
    };
    const handleUp = (e) => {
      if (drawingImage && imageStart && pendingImage) {
        const { x, y } = getPos(e);
        const newShape = {
          id: Date.now(),
          type: 'image',
          x: (imageStart.x + x) / 2,
          y: (imageStart.y + y) / 2,
          width: Math.abs(x - imageStart.x),
          height: Math.abs(y - imageStart.y),
          src: pendingImage.src,
          img: pendingImage.img,
          rotation: 0,
          opacity: 1,
          strokeWidth: 0,
          lineDash: 0
        };
        setShapes((prev) => [...prev, newShape]);
        setDrawingImage(false);
        setImageStart(null);
        setPendingImage(null);
        return;
      }
      if (drawingShape && shapeStart && pendingShape) {
        const { x, y } = getPos(e);
        const w = Math.abs(x - shapeStart.x);
        const h = Math.abs(y - shapeStart.y);
        const midx = (x + shapeStart.x) / 2;
        const midy = (y + shapeStart.y) / 2;
        const newShape = { ...pendingShape, id: Date.now(), x: midx, y: midy };
        if (['circle','pentagon','hexagon','heptagon','octagon','star'].includes(pendingShape.type)) {
          newShape.radius = Math.max(w, h) / 2;
        } else if (pendingShape.type === 'square') {
          const side = Math.max(w, h);
          newShape.width = side;
          newShape.height = side;
        } else if (pendingShape.type === 'text') {
          newShape.fontSize = Math.max(5, Math.max(w, h));
        } else {
          newShape.width = w;
          newShape.height = h;
        }
        setShapes((prev) => [...prev, newShape]);
        setDrawingShape(false);
        setShapeStart(null);
        setPendingShape(null);
        return;
      }
      setDraggingId(null);
      setResizingId(null);
      setRotateId(null);
    };
    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      canvas.removeEventListener('mousedown', handleDown);
      canvas.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [shapes, draggingId, dragOffset, drawingImage, imageStart, pendingImage, resizingId, resizeStart, drawingShape, shapeStart, pendingShape, selectedId, rotateId, rotateStart]);

  const drawShape = (ctx, shape) => {
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

  const addShape = () => {
    setPendingShape({ ...current });
    setDrawingShape(true);
  };

  const loadJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = JSON.parse(ev.target.result);
      const loaded = data.map((s) => {
        if (s.type === 'image' && s.src) {
          const img = new Image();
          img.src = s.src;
          return { ...s, img };
        }
        return s;
      });
      setShapes(loaded);
    };
    reader.readAsText(file);
  };

  const saveJSON = () => {
    const cleanShapes = shapes.map(({ img, ...rest }) => rest);
    const dataStr = JSON.stringify(cleanShapes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'design.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const savePDF = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait';
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: [canvas.width, canvas.height],
    });
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('design.pdf');
  };

  const updateCurrent = (field, value) => {
    setCurrent({ ...current, [field]: value });
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        setPendingImage({ src: ev.target.result, img });
        setDrawingImage(true);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const shapeOptions = [
    { type: 'rectangle', icon: <TbRectangle /> },
    { type: 'square', icon: <TbSquare /> },
    { type: 'circle', icon: <TbCircle /> },
    { type: 'ellipse', icon: <IoEllipse /> },
    { type: 'triangle', icon: <TbTriangle /> },
    { type: 'diamond', icon: <TbDiamond /> },
    { type: 'pentagon', icon: <TbPentagon /> },
    { type: 'hexagon', icon: <TbHexagon /> },
    { type: 'heptagon', icon: <BsHeptagon /> },
    { type: 'octagon', icon: <TbOctagon /> },
    { type: 'star', icon: <TbStar /> },
    { type: 'trapezoid', icon: <TrapezoidIcon /> },
    { type: 'parallelogram', icon: <PiParallelogram /> },
    { type: 'arrow', icon: <TbArrowRight /> },
    { type: 'heart', icon: <TbHeart /> },
    { type: 'image', icon: <MdImage />, isImage: true },
    { type: 'text', icon: <TbTypography /> },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '250px', padding: '10px', overflowY: 'auto' }}>
        <h2>Agregar Forma</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
          {shapeOptions.map((opt) => (
            <button
              key={opt.type}
              style={{
                border: current.type === opt.type ? '2px solid blue' : '1px solid #ccc',
                padding: '4px',
                background: '#fff',
                cursor: 'pointer'
              }}
              onClick={() => {
                if (opt.isImage) {
                  handleImageClick();
                } else {
                  updateCurrent('type', opt.type);
                  setPendingShape({ ...current, type: opt.type });
                  setDrawingShape(true);
                }
              }}
            >
              {opt.icon}
            </button>
          ))}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageChange}
        />
        <label>
          X:
          <input type="number" value={current.x} onChange={(e) => updateCurrent('x', parseInt(e.target.value))} />
        </label>
        <label>
          Y:
          <input type="number" value={current.y} onChange={(e) => updateCurrent('y', parseInt(e.target.value))} />
        </label>
        <label>
          Ancho:
          <input type="number" value={current.width} onChange={(e) => updateCurrent('width', parseInt(e.target.value))} />
        </label>
        <label>
          Alto:
          <input type="number" value={current.height} onChange={(e) => updateCurrent('height', parseInt(e.target.value))} />
        </label>
        <label>
          Radio:
          <input type="number" value={current.radius} onChange={(e) => updateCurrent('radius', parseInt(e.target.value))} />
        </label>
        <label>
          Rotación:
          <input type="number" value={current.rotation} onChange={(e) => updateCurrent('rotation', parseInt(e.target.value))} />
        </label>
        <label>
          Opacidad:
          <input type="number" step="0.1" min="0" max="1" value={current.opacity} onChange={(e) => updateCurrent('opacity', parseFloat(e.target.value))} />
        </label>
        <label>
          Color Relleno:
          <input type="color" value={current.fillColor} onChange={(e) => updateCurrent('fillColor', e.target.value)} />
        </label>
        <label>
          Color Borde:
          <input type="color" value={current.strokeColor} onChange={(e) => updateCurrent('strokeColor', e.target.value)} />
        </label>
        <label>
          Grosor Borde:
          <input type="number" value={current.strokeWidth} onChange={(e) => updateCurrent('strokeWidth', parseInt(e.target.value))} />
        </label>
        <label>
          Guion Borde:
          <input type="number" value={current.lineDash} onChange={(e) => updateCurrent('lineDash', parseInt(e.target.value))} />
        </label>
        {current.type === 'text' && (
          <>
            <label>
              Texto:
              <input type="text" value={current.text} onChange={(e) => updateCurrent('text', e.target.value)} />
            </label>
            <label>
              Tamaño Fuente:
              <input type="number" value={current.fontSize} onChange={(e) => updateCurrent('fontSize', parseInt(e.target.value))} />
            </label>
            <label>
              Color Fuente:
              <input type="color" value={current.fontColor} onChange={(e) => updateCurrent('fontColor', e.target.value)} />
            </label>
          </>
        )}
        <button onClick={addShape}>Agregar</button>
        <hr />
        <button onClick={saveJSON}>Guardar JSON</button>
        <button onClick={savePDF}>Guardar PDF</button>
        <input type="file" accept="application/json" onChange={loadJSON} />
      </div>
      <canvas ref={canvasRef} width={800} height={600} style={{ border: '1px solid black', margin: '10px' }} />
    </div>
  );
}
