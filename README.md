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
4. Cambiar el tamaño de las figuras manteniendo presionada la tecla **Shift** mientras las arrastras con el ratón.
