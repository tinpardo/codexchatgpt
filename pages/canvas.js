import React, { useRef, useState, useEffect, useCallback } from 'react';
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
import {
  MdSave,
  MdPictureAsPdf,
  MdCode,
  MdZoomIn,
  MdZoomOut,
  MdFlipToFront,
  MdFlipToBack,
  MdArrowUpward,
  MdArrowDownward,
  MdDelete,
} from 'react-icons/md';
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
import { crearPagina, agregarPagina } from '../modules/paginas';
import MenuBar from '../components/MenuBar';
import useZoom from '../modules/zoom';
import { useUser, useClerk } from '@clerk/nextjs';
import { getAuth } from '@clerk/nextjs/server';

const TrapezoidIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <polygon points="4,6 20,6 16,18 8,18" fill="currentColor" />
  </svg>
);

export default function CanvasPage() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const jsonInputRef = useRef(null);
  // Información del usuario autenticado
  const { user } = useUser();
  const { signOut } = useClerk();
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
  const [canvasWidth, setCanvasWidth] = useState(816);
  const [canvasHeight, setCanvasHeight] = useState(1056);
  const [formatName, setFormatName] = useState('Carta');
  const [selectionBounds, setSelectionBounds] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [clipboard, setClipboard] = useState(null);
  const [pages, setPages] = useState([crearPagina(816, 1056)]);
  const [currentPage, setCurrentPage] = useState(0);
  const thumbRefs = useRef([]);
  const { zoom, zoomIn, zoomOut } = useZoom();
  const [viewRect, setViewRect] = useState(null);


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
    setPages((prev) =>
      prev.map((p, idx) => (idx === currentPage ? { ...p, thumbnail: thumb } : p))
    );
  }, [shapes, previewShape, selectedId, canvasWidth, canvasHeight, selectionBounds, currentPage]);

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

  // Cambia las formas y tamaño cuando se selecciona otra página
  useEffect(() => {
    const pg = pages[currentPage];
    if (pg) {
      setShapes(pg.shapes);
      setCanvasWidth(pg.width);
      setCanvasHeight(pg.height);
    }
  }, [currentPage]);

  // Guarda automáticamente los cambios en la página actual
  useEffect(() => {
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === currentPage
          ? { ...p, shapes, width: canvasWidth, height: canvasHeight }
          : p
      )
    );
  }, [shapes, canvasWidth, canvasHeight]);

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
      if (draggingId !== null) {
        const dropIndex = thumbRefs.current.findIndex((el) => {
          if (!el) return false;
          const r = el.getBoundingClientRect();
          return (
            e.clientX >= r.left &&
            e.clientX <= r.right &&
            e.clientY >= r.top &&
            e.clientY <= r.bottom
          );
        });
        if (dropIndex !== -1 && dropIndex !== currentPage) {
          const moving = shapes.find((s) => s.id === draggingId);
          if (moving) {
            setPages((prev) =>
              prev.map((p, idx) =>
                idx === dropIndex ? { ...p, shapes: [...p.shapes, moving] } : p
              )
            );
            setShapes((prev) => prev.filter((s) => s.id !== draggingId));
          }
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
        setContextMenu({ mouseX: e.clientX - 2, mouseY: e.clientY - 4, type: 'shape', pageIdx: currentPage });
      } else {
        setContextMenu({ mouseX: e.clientX - 2, mouseY: e.clientY - 4, type: 'page', pageIdx: currentPage });
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
  }, [shapes, draggingId, dragOffset, drawingImage, imageStart, pendingImage, resizingId, resizeStart, drawingShape, shapeStart, pendingShape, selectedId, rotateId, rotateStart, currentPage]);


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
    savePDF(pages);
  };

  const handleExportHTML = () => {
    exportHTML(pages);
  };

  const moveSelected = (dx, dy) => {
    if (selectedId === null) return;
    setShapes((prev) =>
      prev.map((s) =>
        s.id === selectedId ? { ...s, x: s.x + dx, y: s.y + dy } : s
      )
    );
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

  const copySelected = () => {
    if (selectedId === null) return;
    const sel = shapes.find((s) => s.id === selectedId);
    if (!sel) return;
    const { id, img, ...rest } = sel;
    const copy = { ...rest };
    if (sel.type === 'image' && sel.src) {
      copy.src = sel.src;
    }
    setClipboard(copy);
  };

  const pasteToPage = (pageIdx) => {
    if (!clipboard) return;
    const newShape = { ...clipboard, id: Date.now() + Math.random() };
    if (clipboard.type === 'image' && clipboard.src) {
      const img = new Image();
      img.src = clipboard.src;
      newShape.img = img;
    }
    if (pageIdx === currentPage) {
      setShapes((prev) => [...prev, newShape]);
    } else {
      setPages((prev) =>
        prev.map((p, idx) =>
          idx === pageIdx ? { ...p, shapes: [...p.shapes, newShape] } : p
        )
      );
    }
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

  const handleLoadJSONClick = () => {
    if (jsonInputRef.current) {
      jsonInputRef.current.value = '';
      jsonInputRef.current.click();
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
      setPages((prev) =>
        prev.map((p) => ({ ...p, width: fmt.width, height: fmt.height }))
      );
    }
  };

  const handleAddPage = () => {
    setPages((prev) => {
      const updated = agregarPagina(prev, canvasWidth, canvasHeight);
      setCurrentPage(updated.length - 1);
      return updated;
    });
    setShapes([]);
  };

  const handlePageChange = (e) => {
    setCurrentPage(parseInt(e.target.value));
  };

  const handleThumbContextMenu = (e, idx) => {
    e.preventDefault();
    setContextMenu({ mouseX: e.clientX - 2, mouseY: e.clientY - 4, type: 'page', pageIdx: idx });
  };

  const updateViewRect = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const left = Math.max(0, -rect.left);
    const top = Math.max(0, -rect.top);
    const right = Math.min(rect.width, window.innerWidth - rect.left);
    const bottom = Math.min(rect.height, window.innerHeight - rect.top);
    const width = Math.max(0, right - left);
    const height = Math.max(0, bottom - top);
    setViewRect({ x: left / zoom, y: top / zoom, width: width / zoom, height: height / zoom });
  }, [zoom]);

  useEffect(() => {
    updateViewRect();
    window.addEventListener('scroll', updateViewRect);
    window.addEventListener('resize', updateViewRect);
    return () => {
      window.removeEventListener('scroll', updateViewRect);
      window.removeEventListener('resize', updateViewRect);
    };
  }, [updateViewRect]);

  useEffect(() => {
    updateViewRect();
  }, [zoom, updateViewRect]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Delete') {
        deleteSelected();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveSelected(0, -5);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveSelected(0, 5);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveSelected(-5, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveSelected(5, 0);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedId]);

  return (
    <>
      <MenuBar
        onSaveJSON={saveJSON}
        onLoadJSON={handleLoadJSONClick}
        onSavePDF={handleSavePDF}
        onExportHTML={handleExportHTML}
        onSignOut={signOut}
        onResizePlus={() => resizeSelected(10)}
        onResizeMinus={() => resizeSelected(-10)}
        onBringToFront={bringSelectedToFront}
        onSendToBack={sendSelectedToBack}
        onBringForward={bringSelectedForward}
        onSendBackward={sendSelectedBackward}
        onDelete={deleteSelected}
        onAddPage={handleAddPage}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
      />
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
              <IconButton onClick={zoomIn} title="Acercar">
                <MdZoomIn />
              </IconButton>
              <IconButton onClick={zoomOut} title="Alejar">
                <MdZoomOut />
              </IconButton>
            </Box>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
            <Button
              variant="contained"
              onClick={addShape}
              sx={{ mt: 1, display: 'none' }}
            >
              Agregar
            </Button>
          </AccordionDetails>
        </Accordion>
        {selectedId !== null && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Propiedades</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 60px)', gap: 1 }}>
            <TextField
              label="X"
              type="number"
              size="small"
              margin="dense"
              sx={{ width: 60 }}
              value={current.x}
              onChange={(e) => updateCurrent('x', parseInt(e.target.value))}
            />
            <TextField
              label="Y"
              type="number"
              size="small"
              margin="dense"
              sx={{ width: 60 }}
              value={current.y}
              onChange={(e) => updateCurrent('y', parseInt(e.target.value))}
            />
            <TextField
              label="Ancho"
              type="number"
              size="small"
              margin="dense"
              sx={{ width: 60 }}
              value={current.width}
              onChange={(e) => updateCurrent('width', parseInt(e.target.value))}
            />
            <TextField
              label="Alto"
              type="number"
              size="small"
              margin="dense"
              sx={{ width: 60 }}
              value={current.height}
              onChange={(e) => updateCurrent('height', parseInt(e.target.value))}
            />
            <TextField
              label="Radio"
              type="number"
              size="small"
              margin="dense"
              sx={{ width: 60 }}
              value={current.radius}
              onChange={(e) => updateCurrent('radius', parseInt(e.target.value))}
            />
            <TextField
              label="Rotación"
              type="number"
              size="small"
              margin="dense"
              sx={{ width: 60 }}
              value={current.rotation}
              onChange={(e) => updateCurrent('rotation', parseInt(e.target.value))}
            />
            <TextField
              label="Opacidad"
              type="number"
              inputProps={{ step: 0.1, min: 0, max: 1 }}
              size="small"
              margin="dense"
              sx={{ width: 60 }}
              value={current.opacity}
              onChange={(e) => updateCurrent('opacity', parseFloat(e.target.value))}
            />
            <TextField
              label="Color Relleno"
              type="color"
              size="small"
              margin="dense"
              sx={{ width: 60 }}
              value={current.fillColor}
              onChange={(e) => updateCurrent('fillColor', e.target.value)}
            />
            <TextField
              label="Color Borde"
              type="color"
              size="small"
              margin="dense"
              sx={{ width: 60 }}
              value={current.strokeColor}
              onChange={(e) => updateCurrent('strokeColor', e.target.value)}
            />
            <TextField
              label="Grosor Borde"
              type="number"
              size="small"
              margin="dense"
              sx={{ width: 60 }}
              value={current.strokeWidth}
              onChange={(e) => updateCurrent('strokeWidth', parseInt(e.target.value))}
            />
            <TextField
              label="Guion Borde"
              type="number"
              size="small"
              margin="dense"
              sx={{ width: 60 }}
              value={current.lineDash}
              onChange={(e) => updateCurrent('lineDash', parseInt(e.target.value))}
            />
            {current.type === 'text' && (
              <>
                <TextField
                  label="Texto"
                  size="small"
                  margin="dense"
                  sx={{ width: 60 }}
                  value={current.text}
                  onChange={(e) => updateCurrent('text', e.target.value)}
                />
                <TextField
                  label="Tamaño Fuente"
                  type="number"
                  size="small"
                  margin="dense"
                  sx={{ width: 60 }}
                  value={current.fontSize}
                  onChange={(e) => updateCurrent('fontSize', parseInt(e.target.value))}
                />
                <TextField
                  label="Color Fuente"
                  type="color"
                  size="small"
                  margin="dense"
                  sx={{ width: 60 }}
                  value={current.fontColor}
                  onChange={(e) => updateCurrent('fontColor', e.target.value)}
                />
              </>
            )}
          </AccordionDetails>
        </Accordion>
        )}
        <Accordion defaultExpanded sx={{ display: 'none' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Acciones</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Button onClick={saveJSON} sx={{ mr: 1 }} variant="outlined" title="Guardar JSON">
              <MdSave />
            </Button>
            <Button onClick={handleSavePDF} sx={{ mr: 1 }} variant="outlined" title="Guardar PDF">
              <MdPictureAsPdf />
            </Button>
            <Button onClick={handleExportHTML} variant="outlined" title="Exportar HTML">
              <MdCode />
            </Button>
            {selectedId !== null && (
              <>
                <Box sx={{ mt: 1 }}>
                  <Button onClick={() => resizeSelected(10)} sx={{ mr: 1 }} size="small" variant="contained" title="Aumentar Tamaño">
                    <MdZoomIn />
                  </Button>
                  <Button onClick={() => resizeSelected(-10)} size="small" variant="contained" title="Reducir Tamaño">
                    <MdZoomOut />
                  </Button>
                </Box>
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Button onClick={bringSelectedToFront} size="small" variant="outlined" title="Al Frente">
                    <MdFlipToFront />
                  </Button>
                  <Button onClick={sendSelectedToBack} size="small" variant="outlined" title="Al Fondo">
                    <MdFlipToBack />
                  </Button>
                  <Button onClick={bringSelectedForward} size="small" variant="outlined" title="Adelantar">
                    <MdArrowUpward />
                  </Button>
                  <Button onClick={sendSelectedBackward} size="small" variant="outlined" title="Atrasar">
                    <MdArrowDownward />
                  </Button>
                  <Button onClick={deleteSelected} size="small" color="error" variant="contained" title="Eliminar">
                    <MdDelete />
                  </Button>
                </Box>
              </>
            )}
            <input
              type="file"
              ref={jsonInputRef}
              accept="application/json"
              style={{ display: 'none' }}
              onChange={loadJSON}
            />
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
        <Accordion defaultExpanded sx={{ display: 'none' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Páginas</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth size="small">
              <InputLabel id="page-label">Página</InputLabel>
              <Select
                labelId="page-label"
                value={currentPage}
                label="Página"
                onChange={handlePageChange}
              >
                {pages.map((_, idx) => (
                  <MenuItem key={idx} value={idx}>
                    Página {idx + 1}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button onClick={handleAddPage} sx={{ mt: 1 }} variant="contained" fullWidth>
              Nueva Página
            </Button>
          </AccordionDetails>
        </Accordion>
      </Box>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{ border: '1px solid black', margin: '10px', transform: `scale(${zoom})`, transformOrigin: '0 0' }}
      />
      <Box sx={{ width: 200, p: 1, overflowY: 'auto' }}>
        {pages.map((p, idx) => (
          <Box
            key={p.id}
            ref={(el) => (thumbRefs.current[idx] = el)}
            sx={{
              border: currentPage === idx ? '2px solid blue' : '1px solid #ccc',
              mb: 1,
              cursor: 'pointer',
              position: 'relative',
            }}
            onClick={() => setCurrentPage(idx)}
            onContextMenu={(e) => handleThumbContextMenu(e, idx)}
          >
            {p.thumbnail ? (
              <>
                <img src={p.thumbnail} alt={`Miniatura ${idx + 1}`} style={{ width: '100%' }} />
                {currentPage === idx && viewRect && (
                  <Box
                    sx={{
                      position: 'absolute',
                      border: '1px solid red',
                      boxSizing: 'border-box',
                      pointerEvents: 'none',
                      left: `${(viewRect.x * 200) / canvasWidth}px`,
                      top: `${(viewRect.y * 200) / canvasWidth}px`,
                      width: `${(viewRect.width * 200) / canvasWidth}px`,
                      height: `${(viewRect.height * 200) / canvasWidth}px`,
                    }}
                  />
                )}
              </>
            ) : (
              <Box sx={{ width: '100%', height: 100, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="caption">Sin vista previa</Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>
      <Menu
        open={Boolean(contextMenu)}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
        }
      >
        {contextMenu?.type === 'shape' && (
          <>
            <MenuItem
              onClick={() => {
                bringSelectedToFront();
                setContextMenu(null);
              }}
              title="Al Frente"
            >
              <MdFlipToFront />
            </MenuItem>
            <MenuItem
              onClick={() => {
                sendSelectedToBack();
                setContextMenu(null);
              }}
              title="Al Fondo"
            >
              <MdFlipToBack />
            </MenuItem>
            <MenuItem
              onClick={() => {
                bringSelectedForward();
                setContextMenu(null);
              }}
              title="Adelantar"
            >
              <MdArrowUpward />
            </MenuItem>
            <MenuItem
              onClick={() => {
                sendSelectedBackward();
                setContextMenu(null);
              }}
              title="Atrasar"
            >
              <MdArrowDownward />
            </MenuItem>
            <MenuItem
              onClick={() => {
                deleteSelected();
                setContextMenu(null);
              }}
              title="Eliminar"
            >
              <MdDelete />
            </MenuItem>
            <MenuItem
              onClick={() => {
                copySelected();
                setContextMenu(null);
              }}
              title="Copiar"
            >
              Copiar
            </MenuItem>
          </>
        )}
        {contextMenu?.type === 'page' && clipboard && (
          <MenuItem
            onClick={() => {
              pasteToPage(contextMenu.pageIdx);
              setContextMenu(null);
            }}
            title="Pegar"
          >
            Pegar
          </MenuItem>
        )}
      </Menu>
    </Box>
    </>
  );
}

// Protege la página para que solo usuarios autenticados puedan acceder
export async function getServerSideProps(ctx) {
  const { userId } = getAuth(ctx.req);
  if (!userId) {
    return {
      redirect: {
        destination: '/sign-in',
        permanent: false,
      },
    };
  }
  return { props: {} };
}
