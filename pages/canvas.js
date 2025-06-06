import React, { useRef, useState, useEffect } from 'react';
import { savePDF, exportHTML } from '../modules/impresion';
import { generateThumbnail } from '../modules/thumbnail';
import { bringToFront, sendToBack, bringForward, sendBackward } from '../modules/arrangement';
import { deleteById } from '../modules/eliminacion';
import { pointToShape, shapeToPoint, bounds, cornerHit, getCornerPos, drawShape } from '../modules/figuras';
import { TbRectangle, TbSquare, TbCircle, TbTriangle, TbDiamond, TbPentagon, TbHexagon, TbOctagon, TbStar, TbArrowRight, TbHeart, TbTypography } from 'react-icons/tb';
import { IoEllipse } from 'react-icons/io5';
import { BsHeptagon } from 'react-icons/bs';
import { PiParallelogram } from 'react-icons/pi';
import { MdImage } from 'react-icons/md';
import { FiMousePointer } from 'react-icons/fi';
import Box from '@mui/material/Box';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';

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
  const [activeTool, setActiveTool] = useState('select');
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
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [formatName, setFormatName] = useState('');
  const [selectionBounds, setSelectionBounds] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);


  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes.forEach((shape) => {
      const bounds = shape.id === selectedId ? selectionBounds : null;
      drawShape(ctx, shape, selectedId, bounds);
    });
    if (previewShape) {
      ctx.globalAlpha = 0.5;
      drawShape(ctx, previewShape);
      ctx.globalAlpha = 1;
    }
    // Update thumbnail automatically whenever the canvas content changes
    const thumb = generateThumbnail(canvas);
    setThumbnailUrl(thumb);
  }, [shapes, previewShape, selectedId, canvasWidth, canvasHeight, selectionBounds]);

  useEffect(() => {
    if (selectedId !== null) {
      const sel = shapes.find((s) => s.id === selectedId);
      if (sel) {
        setSelectionBounds(bounds(sel));
      }
    } else {
      setSelectionBounds(null);
    }
  }, [selectedId]);

  // Sync property controls with the selected shape
  useEffect(() => {
    if (selectedId !== null) {
      const sel = shapes.find((s) => s.id === selectedId);
      if (sel) {
        const { id, img, ...rest } = sel;
        setCurrent((prev) => ({ ...prev, ...rest }));
      }
    }
  }, [selectedId, shapes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };
    const hit = (shape, x, y) => {
      const { w, h } = bounds(shape);
      const p = pointToShape(shape, x, y);
      return p.x >= -w / 2 && p.x <= w / 2 && p.y >= -h / 2 && p.y <= h / 2;
    };

    const handleDown = (e) => {
      setContextMenu(null);
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
            setResizeStart({
              anchorX: pos.x,
              anchorY: pos.y,
              width: sel.width,
              height: sel.height,
              radius: sel.radius,
              fontSize: sel.fontSize,
              rotation: sel.rotation,
            });
            return;
          }
        }
      }
      for (let i = shapes.length - 1; i >= 0; i--) {
        const s = shapes[i];
        if (hit(s, x, y)) {
          setSelectedId(s.id);
          setSelectionBounds(bounds(s));
          if (e.shiftKey) {
            setResizingId(s.id);
            setResizeStart({
              anchorX: x,
              anchorY: y,
              width: s.width,
              height: s.height,
              radius: s.radius,
              fontSize: s.fontSize,
              rotation: s.rotation,
            });
          } else {
            setDraggingId(s.id);
            setDragOffset({ x: x - s.x, y: y - s.y });
          }
          return;
        }
      }
      setSelectedId(null);
      setSelectionBounds(null);
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
        const sel = shapes.find((s) => s.id === resizingId);
        if (sel) {
          const angle = (-sel.rotation * Math.PI) / 180;
          const dx = x - resizeStart.anchorX;
          const dy = y - resizeStart.anchorY;
          const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
          const localY = dx * Math.sin(angle) + dy * Math.cos(angle);
          const w = Math.abs(localX);
          const h = Math.abs(localY);
          const midLocalX = localX / 2;
          const midLocalY = localY / 2;
          const angle2 = (sel.rotation * Math.PI) / 180;
          const mid = {
            x:
              resizeStart.anchorX +
              midLocalX * Math.cos(angle2) -
              midLocalY * Math.sin(angle2),
            y:
              resizeStart.anchorY +
              midLocalX * Math.sin(angle2) +
              midLocalY * Math.cos(angle2),
          };
          setShapes((prev) =>
            prev.map((s) => {
              if (s.id !== resizingId) return s;
              if (s.type === 'text') {
                const diff = Math.max(localX, localY);
                return {
                  ...s,
                  fontSize: Math.max(5, resizeStart.fontSize + diff),
                  x: mid.x,
                  y: mid.y,
                };
              }
              if (
                typeof resizeStart.radius === 'number' &&
                ['circle', 'pentagon', 'hexagon', 'heptagon', 'octagon', 'star'].includes(s.type)
              ) {
                const diff = Math.max(w, h);
                return { ...s, radius: Math.max(5, diff / 2), x: mid.x, y: mid.y };
              }
              if (s.type === 'square') {
                const side = Math.max(w, h);
                return { ...s, width: side, height: side, x: mid.x, y: mid.y };
              }
              return {
                ...s,
                width: Math.max(5, w),
                height: Math.max(5, h),
                x: mid.x,
                y: mid.y,
              };
            })
          );
        }
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
        setShapeStart(null);
        setPreviewShape(null);
        return;
      }
      if (resizingId !== null && resizeStart) {
        const { x, y } = getPos(e);
        const sel = shapes.find((s) => s.id === resizingId);
        if (sel) {
          const angle = (-sel.rotation * Math.PI) / 180;
          const dx = x - resizeStart.anchorX;
          const dy = y - resizeStart.anchorY;
          const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
          const localY = dx * Math.sin(angle) + dy * Math.cos(angle);
          const w = Math.abs(localX);
          const h = Math.abs(localY);
          const midLocalX = localX / 2;
          const midLocalY = localY / 2;
          const angle2 = (sel.rotation * Math.PI) / 180;
          const mid = {
            x:
              resizeStart.anchorX +
              midLocalX * Math.cos(angle2) -
              midLocalY * Math.sin(angle2),
            y:
              resizeStart.anchorY +
              midLocalX * Math.sin(angle2) +
              midLocalY * Math.cos(angle2),
          };
          setShapes((prev) =>
            prev.map((s) => {
              if (s.id !== resizingId) return s;
              if (s.type === 'text') {
                const diff = Math.max(localX, localY);
                return {
                  ...s,
                  fontSize: Math.max(5, resizeStart.fontSize + diff),
                  x: mid.x,
                  y: mid.y,
                };
              }
              if (
                typeof resizeStart.radius === 'number' &&
                ['circle', 'pentagon', 'hexagon', 'heptagon', 'octagon', 'star'].includes(s.type)
              ) {
                const diff = Math.max(w, h);
                return { ...s, radius: Math.max(5, diff / 2), x: mid.x, y: mid.y };
              }
              if (s.type === 'square') {
                const side = Math.max(w, h);
                return { ...s, width: side, height: side, x: mid.x, y: mid.y };
              }
              return {
                ...s,
                width: Math.max(5, w),
                height: Math.max(5, h),
                x: mid.x,
                y: mid.y,
              };
            })
          );
        }
      }
      setDraggingId(null);
      setResizingId(null);
      setRotateId(null);
      setPreviewShape(null);
    };
    const handleContextMenu = (e) => {
      e.preventDefault();
      const { x, y } = getPos(e);
      const sel = shapes.find((s) => s.id === selectedId);
      if (sel && hit(sel, x, y)) {
        setContextMenu({ mouseX: e.clientX - 2, mouseY: e.clientY - 4 });
      } else {
        setContextMenu(null);
      }
    };
    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('mouseup', handleUp);
    return () => {
      canvas.removeEventListener('mousedown', handleDown);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('contextmenu', handleContextMenu);
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
      const toNumber = (v) => (v !== undefined ? Number(v) : v);
      const loaded = data.map((s) => {
        const base = {
          ...s,
          id: s.id ?? Date.now() + Math.random(),
          x: toNumber(s.x),
          y: toNumber(s.y),
          width: toNumber(s.width),
          height: toNumber(s.height),
          radius: toNumber(s.radius),
          strokeWidth: toNumber(s.strokeWidth),
          rotation: toNumber(s.rotation),
          opacity: toNumber(s.opacity),
          lineDash: toNumber(s.lineDash),
          fontSize: toNumber(s.fontSize),
        };
        if (base.type === 'image' && base.src) {
          const img = new Image();
          img.src = base.src;
          return { ...base, img };
        }
        return base;
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

  const handleShowThumbnail = () => {
    const url = generateThumbnail(canvasRef.current);
    setThumbnailUrl(url);
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

  const bringSelectedToFront = () => {
    if (selectedId === null) return;
    setShapes((prev) => bringToFront(prev, selectedId));
  };

  const sendSelectedToBack = () => {
    if (selectedId === null) return;
    setShapes((prev) => sendToBack(prev, selectedId));
  };

  const bringSelectedForward = () => {
    if (selectedId === null) return;
    setShapes((prev) => bringForward(prev, selectedId));
  };

  const sendSelectedBackward = () => {
    if (selectedId === null) return;
    setShapes((prev) => sendBackward(prev, selectedId));
  };

  const deleteSelected = () => {
    if (selectedId === null) return;
    setShapes((prev) => deleteById(prev, selectedId));
    setSelectedId(null);
  };


  const updateCurrent = (field, value) => {
    setCurrent({ ...current, [field]: value });
    if (selectedId !== null && field !== 'type') {
      setShapes((prev) =>
        prev.map((s) => (s.id === selectedId ? { ...s, [field]: value } : s))
      );
    }
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
    { type: 'select', icon: <FiMousePointer />, isSelect: true },
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

  const paperFormats = [
    { name: 'Carta', width: 816, height: 1056 },
    { name: 'Legal', width: 816, height: 1344 },
    { name: 'A4', width: 794, height: 1123 },
    { name: 'A3', width: 1123, height: 1587 },
  ];

  const handleFormatChange = (e) => {
    const fmt = paperFormats.find((f) => f.name === e.target.value);
    if (fmt) {
      setCanvasWidth(fmt.width);
      setCanvasHeight(fmt.height);
      setFormatName(fmt.name);
    }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Delete') {
        deleteSelected();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedId]);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Box sx={{ width: 250, p: 1, overflowY: 'auto' }}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Herramientas</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {shapeOptions.map((opt) => (
                <IconButton
                  key={opt.type}
                  color={activeTool === opt.type ? 'primary' : 'default'}
                  onClick={() => {
                    setActiveTool(opt.type);
                    if (opt.isImage) {
                      handleImageClick();
                    } else if (opt.isSelect) {
                      setPendingShape(null);
                      setPendingImage(null);
                      setDrawingShape(false);
                      setDrawingImage(false);
                    } else {
                      updateCurrent('type', opt.type);
                      setPendingShape({ ...current, type: opt.type });
                      setDrawingShape(true);
                    }
                  }}
                >
                  {opt.icon}
                </IconButton>
              ))}
            </Box>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
            <Button variant="contained" onClick={addShape} sx={{ mt: 1 }}>
              Agregar
            </Button>
          </AccordionDetails>
        </Accordion>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Propiedades</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TextField
              label="X"
              type="number"
              size="small"
              margin="dense"
              sx={{ width: 120 }}
              value={current.x}
              onChange={(e) => updateCurrent('x', parseInt(e.target.value))}
            />
            <TextField
              label="Y"
              type="number"
              size="small"
              margin="dense"
              sx={{ width: 120 }}
              value={current.y}
              onChange={(e) => updateCurrent('y', parseInt(e.target.value))}
            />
            <TextField
              label="Ancho"
              type="number"
              size="small"
              margin="dense"
              sx={{ width: 120 }}
              value={current.width}
              onChange={(e) => updateCurrent('width', parseInt(e.target.value))}
            />
            <TextField
              label="Alto"
              type="number"
              size="small"
              margin="dense"
              sx={{ width: 120 }}
              value={current.height}
              onChange={(e) => updateCurrent('height', parseInt(e.target.value))}
            />
            <TextField
              label="Radio"
              type="number"
              size="small"
              margin="dense"
              sx={{ width: 120 }}
              value={current.radius}
              onChange={(e) => updateCurrent('radius', parseInt(e.target.value))}
            />
            <TextField
              label="Rotación"
              type="number"
              size="small"
              margin="dense"
              sx={{ width: 120 }}
              value={current.rotation}
              onChange={(e) => updateCurrent('rotation', parseInt(e.target.value))}
            />
            <TextField
              label="Opacidad"
              type="number"
              inputProps={{ step: 0.1, min: 0, max: 1 }}
              size="small"
              margin="dense"
              sx={{ width: 120 }}
              value={current.opacity}
              onChange={(e) => updateCurrent('opacity', parseFloat(e.target.value))}
            />
            <TextField
              label="Color Relleno"
              type="color"
              size="small"
              margin="dense"
              sx={{ width: 120 }}
              value={current.fillColor}
              onChange={(e) => updateCurrent('fillColor', e.target.value)}
            />
            <TextField
              label="Color Borde"
              type="color"
              size="small"
              margin="dense"
              sx={{ width: 120 }}
              value={current.strokeColor}
              onChange={(e) => updateCurrent('strokeColor', e.target.value)}
            />
            <TextField
              label="Grosor Borde"
              type="number"
              size="small"
              margin="dense"
              sx={{ width: 120 }}
              value={current.strokeWidth}
              onChange={(e) => updateCurrent('strokeWidth', parseInt(e.target.value))}
            />
            <TextField
              label="Guion Borde"
              type="number"
              size="small"
              margin="dense"
              sx={{ width: 120 }}
              value={current.lineDash}
              onChange={(e) => updateCurrent('lineDash', parseInt(e.target.value))}
            />
            {current.type === 'text' && (
              <>
                <TextField
                  label="Texto"
                  size="small"
                  margin="dense"
                  sx={{ width: 120 }}
                  value={current.text}
                  onChange={(e) => updateCurrent('text', e.target.value)}
                />
                <TextField
                  label="Tamaño Fuente"
                  type="number"
                  size="small"
                  margin="dense"
                  sx={{ width: 120 }}
                  value={current.fontSize}
                  onChange={(e) => updateCurrent('fontSize', parseInt(e.target.value))}
                />
                <TextField
                  label="Color Fuente"
                  type="color"
                  size="small"
                  margin="dense"
                  sx={{ width: 120 }}
                  value={current.fontColor}
                  onChange={(e) => updateCurrent('fontColor', e.target.value)}
                />
              </>
            )}
          </AccordionDetails>
        </Accordion>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Acciones</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Button onClick={saveJSON} sx={{ mr: 1 }} variant="outlined">
              Guardar JSON
            </Button>
            <Button onClick={handleSavePDF} sx={{ mr: 1 }} variant="outlined">
              Guardar PDF
            </Button>
            <Button onClick={handleExportHTML} variant="outlined">
              Exportar HTML
            </Button>
            <Button onClick={handleShowThumbnail} sx={{ mt: 1 }} variant="outlined">
              Ver Miniatura
            </Button>
            {selectedId !== null && (
              <>
                <Box sx={{ mt: 1 }}>
                  <Button onClick={() => resizeSelected(10)} sx={{ mr: 1 }} size="small" variant="contained">
                    Aumentar Tamaño
                  </Button>
                  <Button onClick={() => resizeSelected(-10)} size="small" variant="contained">
                    Reducir Tamaño
                  </Button>
                </Box>
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Button onClick={bringSelectedToFront} size="small" variant="outlined">
                    Al Frente
                  </Button>
                  <Button onClick={sendSelectedToBack} size="small" variant="outlined">
                    Al Fondo
                  </Button>
                  <Button onClick={bringSelectedForward} size="small" variant="outlined">
                    Adelantar
                  </Button>
                  <Button onClick={sendSelectedBackward} size="small" variant="outlined">
                    Atrasar
                  </Button>
                  <Button onClick={deleteSelected} size="small" color="error" variant="contained">
                    Eliminar
                  </Button>
                </Box>
              </>
            )}
            <input type="file" accept="application/json" onChange={loadJSON} />
            <FormControl fullWidth sx={{ mt: 1 }} size="small">
              <InputLabel id="format-label">Tamaño Página</InputLabel>
              <Select
                labelId="format-label"
                value={formatName}
                label="Tamaño Página"
                onChange={handleFormatChange}
              >
                <MenuItem value="" disabled>
                  Seleccionar formato
                </MenuItem>
                {paperFormats.map((fmt) => (
                  <MenuItem key={fmt.name} value={fmt.name}>
                    {fmt.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>
      </Box>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{ border: '1px solid black', margin: '10px' }}
      />
      {thumbnailUrl && (
        <Box sx={{ ml: 2 }}>
          <img src={thumbnailUrl} alt="Miniatura" style={{ border: '1px solid #ccc' }} />
        </Box>
      )}
      <Menu
        open={Boolean(contextMenu)}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
        }
      >
        <MenuItem
          onClick={() => {
            bringSelectedToFront();
            setContextMenu(null);
          }}
        >
          Al Frente
        </MenuItem>
        <MenuItem
          onClick={() => {
            sendSelectedToBack();
            setContextMenu(null);
          }}
        >
          Al Fondo
        </MenuItem>
        <MenuItem
          onClick={() => {
            bringSelectedForward();
            setContextMenu(null);
          }}
        >
          Adelantar
        </MenuItem>
        <MenuItem
          onClick={() => {
            sendSelectedBackward();
            setContextMenu(null);
          }}
        >
          Atrasar
        </MenuItem>
        <MenuItem
          onClick={() => {
            deleteSelected();
            setContextMenu(null);
          }}
        >
          Eliminar
        </MenuItem>
      </Menu>
    </Box>
  );
}
