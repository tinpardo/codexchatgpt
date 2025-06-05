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
      for (let i = shapes.length - 1; i >= 0; i--) {
        const s = shapes[i];
        if (hit(s, x, y)) {
          setDraggingId(s.id);
          setDragOffset({ x: x - s.x, y: y - s.y });
          break;
        }
      }
    };
    const handleMove = (e) => {
      if (drawingImage || draggingId === null) return;
      const { x, y } = getPos(e);
      setShapes((prev) =>
        prev.map((s) =>
          s.id === draggingId ? { ...s, x: x - dragOffset.x, y: y - dragOffset.y } : s
        )
      );
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
      setDraggingId(null);
    };
    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      canvas.removeEventListener('mousedown', handleDown);
      canvas.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [shapes, draggingId, dragOffset, drawingImage, imageStart, pendingImage]);

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
    ctx.restore();
  };

  const addShape = () => {
    setShapes([...shapes, { ...current, id: Date.now() }]);
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

  const saveHTML = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Dise\u00f1o Canvas</title>
</head>
<body>
  <img src="${dataUrl}" alt="Dise\u00f1o Canvas" />
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'design.html';
    link.click();
    URL.revokeObjectURL(url);

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
        <button onClick={saveHTML}>Guardar HTML</button>
        <button onClick={savePDF}>Guardar PDF</button>
        <input type="file" accept="application/json" onChange={loadJSON} />
      </div>
      <canvas ref={canvasRef} width={800} height={600} style={{ border: '1px solid black', margin: '10px' }} />
    </div>
  );
}
