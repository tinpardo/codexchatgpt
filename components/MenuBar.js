import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

/**
 * Barra de menú que agrupa acciones en "Archivo", "Edición" y "Vista".
 * Cada acción se pasa mediante props para mantener el componente desacoplado.
 */
export default function MenuBar({
  onSaveJSON,
  onLoadJSON,
  onSavePDF,
  onExportHTML,
  onResizePlus,
  onResizeMinus,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onDelete,
  onAddPage,
}) {
  const [archivoAnchor, setArchivoAnchor] = useState(null);
  const [edicionAnchor, setEdicionAnchor] = useState(null);
  const [vistaAnchor, setVistaAnchor] = useState(null);

  const openMenu = (setter) => (e) => setter(e.currentTarget);
  const closeMenu = (setter) => () => setter(null);

  return (
    <AppBar position="static" color="default" sx={{ mb: 1 }}>
      <Toolbar variant="dense">
        <Button onClick={openMenu(setArchivoAnchor)}>Archivo</Button>
        <Menu
          anchorEl={archivoAnchor}
          open={Boolean(archivoAnchor)}
          onClose={closeMenu(setArchivoAnchor)}
        >
          <MenuItem onClick={() => { onSaveJSON?.(); setArchivoAnchor(null); }}>
            Guardar JSON
          </MenuItem>
          <MenuItem onClick={() => { onLoadJSON?.(); setArchivoAnchor(null); }}>
            Cargar JSON
          </MenuItem>
          <MenuItem onClick={() => { onSavePDF?.(); setArchivoAnchor(null); }}>
            Guardar PDF
          </MenuItem>
          <MenuItem onClick={() => { onExportHTML?.(); setArchivoAnchor(null); }}>
            Exportar HTML
          </MenuItem>
        </Menu>

        <Button onClick={openMenu(setEdicionAnchor)}>Edición</Button>
        <Menu
          anchorEl={edicionAnchor}
          open={Boolean(edicionAnchor)}
          onClose={closeMenu(setEdicionAnchor)}
        >
          <MenuItem onClick={() => { onResizePlus?.(); setEdicionAnchor(null); }}>
            Aumentar Tamaño
          </MenuItem>
          <MenuItem onClick={() => { onResizeMinus?.(); setEdicionAnchor(null); }}>
            Reducir Tamaño
          </MenuItem>
          <MenuItem onClick={() => { onBringToFront?.(); setEdicionAnchor(null); }}>
            Al Frente
          </MenuItem>
          <MenuItem onClick={() => { onSendToBack?.(); setEdicionAnchor(null); }}>
            Al Fondo
          </MenuItem>
          <MenuItem onClick={() => { onBringForward?.(); setEdicionAnchor(null); }}>
            Adelantar
          </MenuItem>
          <MenuItem onClick={() => { onSendBackward?.(); setEdicionAnchor(null); }}>
            Atrasar
          </MenuItem>
          <MenuItem onClick={() => { onDelete?.(); setEdicionAnchor(null); }}>
            Eliminar
          </MenuItem>
        </Menu>

        <Button onClick={openMenu(setVistaAnchor)}>Vista</Button>
        <Menu
          anchorEl={vistaAnchor}
          open={Boolean(vistaAnchor)}
          onClose={closeMenu(setVistaAnchor)}
        >
          <MenuItem onClick={() => { onAddPage?.(); setVistaAnchor(null); }}>
            Nueva Página
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
