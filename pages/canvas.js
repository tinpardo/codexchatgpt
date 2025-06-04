import React, { useRef, useState, useEffect } from 'react';

export default function CanvasPage() {
  const canvasRef = useRef(null);
  const [shapes, setShapes] = useState([]);
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

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes.forEach((shape) => {
      drawShape(ctx, shape);
    });
  }, [shapes]);

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
      setShapes(data);
    };
    reader.readAsText(file);
  };

  const saveJSON = () => {
    const dataStr = JSON.stringify(shapes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'design.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const updateCurrent = (field, value) => {
    setCurrent({ ...current, [field]: value });
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '250px', padding: '10px', overflowY: 'auto' }}>
        <h2>Agregar Forma</h2>
        <label>
          Tipo:
          <select value={current.type} onChange={(e) => updateCurrent('type', e.target.value)}>
            <option value="rectangle">Rectángulo</option>
            <option value="square">Cuadrado</option>
            <option value="circle">Círculo</option>
            <option value="ellipse">Elipse</option>
            <option value="triangle">Triángulo</option>
            <option value="diamond">Rombo</option>
            <option value="pentagon">Pentágono</option>
            <option value="hexagon">Hexágono</option>
            <option value="heptagon">Heptágono</option>
            <option value="octagon">Octágono</option>
            <option value="star">Estrella</option>
            <option value="trapezoid">Trapecio</option>
            <option value="parallelogram">Paralelogramo</option>
            <option value="arrow">Flecha</option>
            <option value="heart">Corazón</option>
            <option value="text">Texto</option>
          </select>
        </label>
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
        <input type="file" accept="application/json" onChange={loadJSON} />
      </div>
      <canvas ref={canvasRef} width={800} height={600} style={{ border: '1px solid black', margin: '10px' }} />
    </div>
  );
}
