# Documentación del Proyecto Anida Web

## Estructura de directorios

```plaintext
anida-web/
│
├── assets/
│   ├── fonts/
│   │   ├── Gotham-Light-Regular.otf
│   │   └── Gotham-Medium.otf
│   ├── icons/
│   │   ├── defensamargen-2024.svg
│   │   ├── favicon.png
│   │   ├── ign-logo-footer.svg
│   │   └── ...
│   └── images/
│       ├── fondo_horizontal_1900_1800.jpg
│       ├── fondo_horizontal_1900_1800.webp
│       ├── ambiental/
│       ├── econ/
│       ├── mundo/
│       ├── natural/
│       ├── politico_admin/
│       └── sociodemo/
│
├── components/
│   ├── footer.html
│   ├── form.html
│   └── navbar.html
│
├── docs/
│   └── documentation.md
│
├── js/
│   ├── main.js
│   └── utils/
│
├── old/
│   ├── data.json
│   ├── main.css
│   ├── menu-colaboradores.js
│   └── disabled/
│       ├── anida_hoy.html
│       ├── cita.html
│       ├── fuente_datos.html
│       └── img/
│
├── styles/
│   ├── acercade.css
│   ├── contacto.css
│   ├── equipo.css
│   ├── estructura.css
│   ├── footer.css
│   ├── fuente_datos.css
│   ├── main.css
│   ├── navbar.css
│   ├── normalize.css
│   ├── recursos_educativos.css
│   ├── responsive.css
│   └── tutoriales.css
│
├── acercade.html
├── arg_ambiental.html
├── arg_econ.html
├── arg_fisico_natural.html
├── arg_mundo.html
├── arg_socio_demo.html
├── contacto.html
├── equipo.html
├── estructura.html
├── index.html
├── otros_recursos.html
├── tutoriales.html
├── README.md
├── robots.txt
└── sitemap.xml
```

Instructivo: Modificación y Adición de Ítems en Secciones Temáticas

# Instructivo: Modificación y Adición de Ítems en Secciones Temáticas

## 1. Ubicación de los archivos

Cada sección temática corresponde a un archivo HTML en la raíz del proyecto. Ejemplos:

- `arg_mundo.html` (Argentina y el mundo)
- `arg_socio_demo.html` (Socio-demográfica)
- `arg_econ.html` (Económica)
- `arg_fisico_natural.html` (Físico-natural)
- `arg_ambiental.html` (Ambiental)

## 2. Estructura de los ítems

Cada ítem se encuentra dentro de un bloque `<div class="flex-item">...</div>` dentro de `<div class="flex-container">`. Generalmente, cada ítem contiene:

- Un enlace `<a>` con atributos de seguimiento y título.
- Un bloque `<div class="icon-box">` (puede incluir una imagen y un título `<h5>`).

**Ejemplo de ítem:**

```html
<div class="flex-item">
  <a href="URL_DESTINO" target="_blank" id="id-unico" data-tracking-category="navigation" data-tracking-action="click" data-tracking-label="Nombre del ítem" title="Nombre del ítem">
    <div class="icon-box">
      <div class="icon">
        <img src="/assets/images/seccion/imagen.jpg" alt="Nombre del ítem" />
      </div>
      <h5>Nombre del ítem</h5>
    </div>
  </a>
</div>
```

## 3. Cómo modificar un ítem existente

1. Abre el archivo HTML correspondiente a la sección.
2. Localiza el bloque `<div class="flex-item">` del ítem a modificar.
3. Cambia el enlace (`href`), el texto, la imagen o los atributos según lo necesario.
4. Guarda el archivo y recarga la página para ver los cambios.

## 4. Cómo agregar un nuevo ítem

1. Abre el archivo HTML de la sección deseada.
2. Dentro de `<div class="flex-container">`, copia y pega un bloque `<div class="flex-item">...</div>` de un ítem existente.
3. Modifica:
   - El atributo `href` con la URL de destino.
   - El atributo `id` (debe ser único en la página).
   - El atributo `data-tracking-label` y `title` con el nombre del nuevo ítem.
   - El contenido de `<h5>` y la imagen si corresponde.
4. Guarda el archivo y recarga la página.

## 5. Ejemplo de adición

Supón que quieres agregar un ítem "Nuevos Recursos" en la sección económica:

```html
<div class="flex-item">
  <a href="https://ejemplo.com/nuevos-recursos" target="_blank" id="nuevos-recursos" data-tracking-category="navigation" data-tracking-action="click" data-tracking-label="Nuevos Recursos" title="Nuevos Recursos">
    <div class="icon-box">
      <div class="icon">
        <img src="/assets/images/econ/nuevos_recursos.jpg" alt="Nuevos Recursos" />
      </div>
      <h5>Nuevos Recursos</h5>
    </div>
  </a>
</div>
```

## 6. Recomendaciones

- Mantén la consistencia en la estructura y estilos de los ítems.
- Usa imágenes optimizadas y con nombres descriptivos.
- Verifica que el `id` de cada ítem sea único en la página.
- Si el ítem no tiene imagen, puedes omitir el bloque `<img>`.
- Revisa que los enlaces funcionen correctamente y apunten a recursos válidos.
