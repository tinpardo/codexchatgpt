import React, { useRef, useState, useEffect } from 'react';
import { savePDF, exportHTML } from '../utils/export';
import { pointToShape, bounds, cornerHit, getCornerPos, drawShape } from '../utils/shapes';
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
  const [previewShape, setPreviewShape] = useState(null);


  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes.forEach((shape) => {
      drawShape(ctx, shape, selectedId);
    });
    if (previewShape) {
      ctx.globalAlpha = 0.5;
      drawShape(ctx, previewShape);
      ctx.globalAlpha = 1;
    }
  }, [shapes, previewShape, selectedId]);

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
      const { x, y } = getPos(e);
      if (drawingImage && imageStart && pendingImage) {
        const preview = {
          id: 'preview',
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
          lineDash: 0,
        };
        setPreviewShape(preview);
        return;
      }
      if (drawingShape && shapeStart && pendingShape) {
        const w = Math.abs(x - shapeStart.x);
        const h = Math.abs(y - shapeStart.y);
        const midx = (x + shapeStart.x) / 2;
        const midy = (y + shapeStart.y) / 2;
        const preview = { ...pendingShape, x: midx, y: midy };
        if (['circle','pentagon','hexagon','heptagon','octagon','star'].includes(pendingShape.type)) {
          preview.radius = Math.max(w, h) / 2;
        } else if (pendingShape.type === 'square') {
          const side = Math.max(w, h);
          preview.width = side;
          preview.height = side;
        } else if (pendingShape.type === 'text') {
          preview.fontSize = Math.max(5, Math.max(w, h));
        } else {
          preview.width = w;
          preview.height = h;
        }
        setPreviewShape(preview);
        return;
      }
      setPreviewShape(null);
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
        setPreviewShape(null);
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
        setPreviewShape(null);
        return;
      }
      setDraggingId(null);
      setResizingId(null);
      setRotateId(null);
      setPreviewShape(null);
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

  const handleSavePDF = () => {
    savePDF(canvasRef.current);
  };

  const handleExportHTML = () => {
    exportHTML(canvasRef.current);
  };

  const resizeSelected = (delta) => {
    if (selectedId === null) return;
    setShapes((prev) =>
      prev.map((s) => {
        if (s.id !== selectedId) return s;
        if (s.type === 'text') {
          return { ...s, fontSize: Math.max(5, (s.fontSize || 10) + delta) };
        }
        if (['circle', 'pentagon', 'hexagon', 'heptagon', 'octagon', 'star'].includes(s.type)) {
          return { ...s, radius: Math.max(5, (s.radius || 10) + delta) };
        }
        return {
          ...s,
          width: Math.max(5, (s.width || 10) + delta),
          height: Math.max(5, (s.height || 10) + delta),
        };
      })
    );
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
        <button onClick={handleSavePDF}>Guardar PDF</button>
        <button onClick={handleExportHTML}>Exportar HTML</button>
        {selectedId !== null && (
          <div style={{ marginTop: '10px' }}>
            <button onClick={() => resizeSelected(10)}>Aumentar Tamaño</button>
            <button onClick={() => resizeSelected(-10)} style={{ marginLeft: '4px' }}>Reducir Tamaño</button>
          </div>
        )}
        <input type="file" accept="application/json" onChange={loadJSON} />
      </div>
      <canvas ref={canvasRef} width={800} height={600} style={{ border: '1px solid black', margin: '10px' }} />
    </div>
  );
}
