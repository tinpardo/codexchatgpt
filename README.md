# Aplicación de Diseño de Redes

Esta versión ha sido convertida a **Next.js** para facilitar su despliegue en Vercel.

## Ejecución en desarrollo

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Abre tu navegador en `http://localhost:3000` para interactuar con el editor de redes.
   Desde el menú superior puedes acceder al nuevo **Editor Canvas** para crear y guardar diseños de formas geométricas.

## Descripción

La aplicación utiliza [React Flow](https://reactflow.dev/) para la creación de diagramas.
El código principal se encuentra en `pages/index.js`.

## Editor Canvas

El archivo `pages/canvas.js` implementa un editor de formas basado en la etiqueta
`<canvas>` de HTML5. Desde este editor puedes:

1. Agregar hasta 15 formas geométricas populares (rectángulo, cuadrado, círculo,
   elipse, triángulo, rombo, pentágono, hexágono, heptágono, octágono, estrella,
   trapecio, paralelogramo, flecha y corazón) o texto.
2. Configurar 10 propiedades diferentes como posición, tamaño, color de relleno,
   color de borde, grosor de trazo, guion del borde, rotación, opacidad y para el
   texto su contenido, tamaño y color de fuente.
3. Guardar el diseño en un archivo JSON o cargar un archivo existente para
   continuar editando.
4. Las figuras se crean arrastrando sobre el lienzo al igual que las imágenes. Al seleccionar un objeto aparece un cuadro de selección con manejadores en las esquinas para cambiar su tamaño y un controlador para rotarlo.
5. Puedes aumentar o reducir su tamaño usando los nuevos botones de "Aumentar Tamaño" y "Reducir Tamaño".
6. Exportar el contenido del lienzo a **PDF** o **HTML** desde los botones correspondientes.
7. Cambiar el tamaño del lienzo a formatos de página estándar como **Carta**, **Legal**, **A4** o **A3**.
8. Generar una vista en miniatura del lienzo para previsualizar la página.

## Módulos

El proyecto se ha organizado en archivos de módulo ubicados en la carpeta `modules`:

- `modules/impresion.js` contiene las funciones para exportar el lienzo a **PDF** y **HTML**.
- `modules/figuras.js` agrupa la lógica de transformación y dibujo de las figuras sobre el canvas.
- `modules/eliminacion.js` incluye utilidades para borrar uno o varios objetos del listado de formas.
- `modules/thumbnail.js` permite obtener una miniatura del lienzo para previsualizaciones.
