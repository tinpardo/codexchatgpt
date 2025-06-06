import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CodeIcon from '@mui/icons-material/Code';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FlipToFrontIcon from '@mui/icons-material/FlipToFront';
import FlipToBackIcon from '@mui/icons-material/FlipToBack';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';

/**
 * Barra de menú que agrupa acciones en "Archivo", "Edición" y "Vista".
 * Cada acción se pasa mediante props para mantener el componente desacoplado.
 */
export default function MenuBar({
  onSaveJSON,
  onLoadJSON,
  onSavePDF,
  onExportHTML,
  onSignOut,
  onResizePlus,
  onResizeMinus,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onDelete,
  onAddPage,
  onZoomIn,
  onZoomOut,
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
            <ListItemIcon>
              <SaveIcon fontSize="small" />
            </ListItemIcon>
            Guardar JSON
          </MenuItem>
          <MenuItem onClick={() => { onLoadJSON?.(); setArchivoAnchor(null); }}>
            <ListItemIcon>
              <FolderOpenIcon fontSize="small" />
            </ListItemIcon>
            Cargar JSON
          </MenuItem>
          <MenuItem onClick={() => { onSavePDF?.(); setArchivoAnchor(null); }}>
            <ListItemIcon>
              <PictureAsPdfIcon fontSize="small" />
            </ListItemIcon>
            Guardar PDF
          </MenuItem>
          <MenuItem onClick={() => { onExportHTML?.(); setArchivoAnchor(null); }}>
            <ListItemIcon>
              <CodeIcon fontSize="small" />
            </ListItemIcon>
            Exportar HTML
          </MenuItem>
          <MenuItem onClick={() => { onSignOut?.(); setArchivoAnchor(null); }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Cerrar Sesión
          </MenuItem>
        </Menu>

        <Button onClick={openMenu(setEdicionAnchor)}>Edición</Button>
        <Menu
          anchorEl={edicionAnchor}
          open={Boolean(edicionAnchor)}
          onClose={closeMenu(setEdicionAnchor)}
        >
          <MenuItem onClick={() => { onResizePlus?.(); setEdicionAnchor(null); }}>
            <ListItemIcon>
              <ZoomInIcon fontSize="small" />
            </ListItemIcon>
            Aumentar Tamaño
          </MenuItem>
          <MenuItem onClick={() => { onResizeMinus?.(); setEdicionAnchor(null); }}>
            <ListItemIcon>
              <ZoomOutIcon fontSize="small" />
            </ListItemIcon>
            Reducir Tamaño
          </MenuItem>
          <MenuItem onClick={() => { onBringToFront?.(); setEdicionAnchor(null); }}>
            <ListItemIcon>
              <FlipToFrontIcon fontSize="small" />
            </ListItemIcon>
            Al Frente
          </MenuItem>
          <MenuItem onClick={() => { onSendToBack?.(); setEdicionAnchor(null); }}>
            <ListItemIcon>
              <FlipToBackIcon fontSize="small" />
            </ListItemIcon>
            Al Fondo
          </MenuItem>
          <MenuItem onClick={() => { onBringForward?.(); setEdicionAnchor(null); }}>
            <ListItemIcon>
              <ArrowUpwardIcon fontSize="small" />
            </ListItemIcon>
            Adelantar
          </MenuItem>
          <MenuItem onClick={() => { onSendBackward?.(); setEdicionAnchor(null); }}>
            <ListItemIcon>
              <ArrowDownwardIcon fontSize="small" />
            </ListItemIcon>
            Atrasar
          </MenuItem>
          <MenuItem onClick={() => { onDelete?.(); setEdicionAnchor(null); }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            Eliminar
          </MenuItem>
        </Menu>

        <Button onClick={openMenu(setVistaAnchor)}>Vista</Button>
        <Menu
          anchorEl={vistaAnchor}
          open={Boolean(vistaAnchor)}
          onClose={closeMenu(setVistaAnchor)}
        >
          <MenuItem onClick={() => { onZoomIn?.(); setVistaAnchor(null); }}>
            <ListItemIcon>
              <ZoomInIcon fontSize="small" />
            </ListItemIcon>
            Acercar
          </MenuItem>
          <MenuItem onClick={() => { onZoomOut?.(); setVistaAnchor(null); }}>
            <ListItemIcon>
              <ZoomOutIcon fontSize="small" />
            </ListItemIcon>
            Alejar
          </MenuItem>
          <MenuItem onClick={() => { onAddPage?.(); setVistaAnchor(null); }}>
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            Nueva Página
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
