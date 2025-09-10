/**
 * Maps.js - Lógica para buscador de mapas temáticos
 * ANIDA - Atlas Digital de Argentina
 */

// Estado global de la aplicación
const app = {
  allMaps: [],         // Todos los mapas cargados desde maps.json
  filteredMaps: [],    // Mapas filtrados según búsqueda actual
  currentBatch: 0,     // Lote actual para infinite scroll
  batchSize: 20,       // Tamaño de cada lote
  activeFilters: {     // Filtros activos
    keyword: '',
    category: 'Todos',
    advanced: {
      estructuraTematica: [],
      escalaEspacial: [],
      escalaTemporal: [],
      tipoFenomeno: [],
      tipoEscala: [],
      tipoDatos: [],
      tipoMapa: []
    }
  },
  currentModalIndex: 0 // Índice del mapa actual en modal
};

// Helper: buscar índice en filteredMaps por id
function findIndexById(id) {
  if (!id) return -1;
  return app.filteredMaps.findIndex(m => (m.id || m.ID || m.Id || m.id === 0) ? String(m.id) === String(id) : false);
}

// DOM Elements
const elements = {
  searchForm: null,
  keywordInput: null,
  searchButton: null,
  categoryFilters: null,
  resultsCount: null,
  resultsGrid: null,
  loadMoreBtn: null,
  activeFiltersContainer: null,
  clearFiltersBtn: null,
  modal: null
};

/**
 * Inicializa la aplicación
 */
function initApp() {
  // Capturar elementos del DOM
  elements.searchForm = document.getElementById('search-form');
  elements.keywordInput = document.getElementById('keyword-input');
  elements.searchButton = document.querySelector('#search-form button[type="submit"]');
  elements.categoryFilters = document.querySelectorAll('input[name="category"]');
  elements.resultsCount = document.getElementById('results-count');
  elements.resultsGrid = document.getElementById('results-grid');
  elements.loadMoreBtn = document.getElementById('load-more-btn');
  elements.activeFiltersContainer = document.getElementById('active-filters');
  elements.clearFiltersBtn = document.getElementById('clear-filters-btn');
  elements.applyAdvancedBtn = document.getElementById('apply-advanced-btn');
  elements.clearAdvancedBtn = document.getElementById('clear-advanced-btn');
  elements.advancedFilters = {
    estructuraTematica: document.querySelectorAll('input[name="estructuraTematica"]'),
    escalaEspacial: document.querySelectorAll('input[name="escalaEspacial"]'),
    escalaTemporal: document.querySelectorAll('input[name="escalaTemporal"]'),
    tipoFenomeno: document.querySelectorAll('input[name="tipoFenomeno"]'),
    tipoEscala: document.querySelectorAll('input[name="tipoEscala"]'),
    tipoDatos: document.querySelectorAll('input[name="tipoDatos"]'),
    tipoMapa: document.querySelectorAll('input[name="tipoMapa"]')
  };

  // Cargar datos
  fetchMapsData();

  // Event Listeners
  setupEventListeners();
}

/**
 * Carga los datos de maps.json
 */
async function fetchMapsData() {
  try {
    const response = await fetch('/assets/data/maps.json');
    if (!response.ok) {
      throw new Error('Error al cargar datos');
    }

    app.allMaps = await response.json();

    // Inicialmente, mostrar todos los mapas
    app.filteredMaps = [...app.allMaps];
    renderMaps();
    updateResultsCount();

  } catch (error) {
    console.error('Error cargando mapas:', error);
    elements.resultsGrid.innerHTML = `<p class="error-message">Error cargando mapas. Por favor, intente nuevamente más tarde.</p>`;
  }
}

/**
 * Configura todos los event listeners
 */
function setupEventListeners() {
  // Evento de búsqueda
  if (elements.searchForm) {
    elements.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSearch();
    });
  }

  // Input listener: búsqueda en vivo y control de habilitación del botón
  if (elements.keywordInput) {
    // Inicializar estado del botón según contenido actual
    if (elements.searchButton) elements.searchButton.disabled = (elements.keywordInput.value || '').trim().length < 3;

    elements.keywordInput.addEventListener('input', (e) => {
      const val = (e.target.value || '').trim();
      // Habilitar solo si hay al menos 3 caracteres
      if (elements.searchButton) elements.searchButton.disabled = val.length < 3;

      // Búsqueda en vivo: actualizar filtros y resultados en cada cambio
      app.activeFilters.keyword = val;
      app.currentBatch = 0;
      filterMaps();
      renderMaps(true);
      updateActiveFilters();
      updateResultsCount();
    });
  }

  // Radio buttons de categoría
  if (elements.categoryFilters && elements.categoryFilters.length) {
    elements.categoryFilters.forEach(radio => {
      radio.addEventListener('change', handleSearch);
    });
  }

  // Botón cargar más
  if (elements.loadMoreBtn) elements.loadMoreBtn.addEventListener('click', loadMoreMaps);

  // Limpiar todos los filtros
  if (elements.clearFiltersBtn) elements.clearFiltersBtn.addEventListener('click', clearAllFilters);

  // Cerrar modal con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.modal) {
      closeModal();
    }
  });

  // Botón aplicar filtros avanzados (si existe)
  if (elements.applyAdvancedBtn) {
    elements.applyAdvancedBtn.addEventListener('click', () => {
      getAdvancedFilters();
      handleSearch();
      // Cerrar acordeón después de aplicar
      const accordionButton = document.querySelector('.accordion-button');
      if (accordionButton && !accordionButton.classList.contains('collapsed')) {
        accordionButton.click();
      }
    });
  }

  // Botón limpiar filtros avanzados (si existe)
  if (elements.clearAdvancedBtn) {
    elements.clearAdvancedBtn.addEventListener('click', clearAdvancedFilters);
  }
}

/**
 * Normaliza texto (quita acentos, convierte a minúsculas)
 * @param {string} text - Texto a normalizar
 * @returns {string} - Texto normalizado
 */
function normalizeText(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Maneja la búsqueda y filtrado
 */
function handleSearch() {
  // Capturar valores de búsqueda
  const keyword = elements.keywordInput.value.trim();
  let category = 'Todos';

  if (elements.categoryFilters && elements.categoryFilters.length) {
    elements.categoryFilters.forEach(radio => {
      if (radio.checked) {
        category = radio.value;
      }
    });
  }

  // Actualizar filtros activos
  app.activeFilters.keyword = keyword;
  app.activeFilters.category = category;

  // Resetear lote actual
  app.currentBatch = 0;

  // Aplicar filtros
  filterMaps();

  // Actualizar UI
  renderMaps(true);
  updateActiveFilters();
  updateResultsCount();
}

/**
 * Obtiene los filtros avanzados seleccionados
 */
function getAdvancedFilters() {
  // Recorrer cada grupo de filtros avanzados
  Object.keys(elements.advancedFilters).forEach(filterGroup => {
    const checkedValues = [];

    // Obtener valores seleccionados de cada grupo
    elements.advancedFilters[filterGroup].forEach(checkbox => {
      if (checkbox.checked) {
        checkedValues.push(checkbox.value);
      }
    });

    // Actualizar filtros activos
    app.activeFilters.advanced[filterGroup] = checkedValues;
  });
}

/**
 * Limpia todos los filtros avanzados
 */
function clearAdvancedFilters() {
  // Desmarcar todos los checkboxes
  Object.values(elements.advancedFilters).forEach(checkboxes => {
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
  });

  // Limpiar filtros activos
  Object.keys(app.activeFilters.advanced).forEach(key => {
    app.activeFilters.advanced[key] = [];
  });

  // Si hay algún filtro avanzado activo, actualizar resultados
  const hasActiveAdvancedFilters = Object.values(app.activeFilters.advanced)
    .some(filters => filters.length > 0);

  if (hasActiveAdvancedFilters) {
    handleSearch();
  }
}

/**
 * Filtra los mapas según criterios actuales
 */
function filterMaps() {
  const { keyword, category, advanced } = app.activeFilters;
  app.filteredMaps = app.allMaps.filter(map => {
    // Map schema helpers: compatibilidad con esquema antiguo y nuevo
    const mapCategory = map.section || map.categoria || '';
    const mapTitle = map.title || map.titulo || '';
    const mapKeywords = Array.isArray(map.keywords) ? map.keywords : (typeof map.keywords === 'string' ? map.keywords.split(';').map(k=>k.trim()).filter(Boolean) : (map.keywords || []));

    // Filtrar por categoría rápida
    if (category !== 'Todos' && mapCategory !== category) {
      return false;
    }

    // Filtrar por keyword si existe
    if (keyword) {
      const normalizedKeyword = normalizeText(keyword);
      const normalizedTitle = normalizeText(mapTitle);

      // Si no hay coincidencia en título ni keywords, excluir
      if (!normalizedTitle.includes(normalizedKeyword) &&
        !mapKeywords.some(k => normalizeText(k).includes(normalizedKeyword))) {
        return false;
      }
    }

    // Filtrar por filtros avanzados (si hay datos en el JSON los usará, si no, no filtrará)
    // Estructura temática
    if (advanced.estructuraTematica.length > 0 &&
      !advanced.estructuraTematica.includes(mapCategory)) {
      return false;
    }

    // Escala espacial
    if (advanced.escalaEspacial.length > 0 &&
      !advanced.escalaEspacial.includes(map.escala_espacial || map.escalaEspacial || '')) {
      return false;
    }

    // Escala temporal
    if (advanced.escalaTemporal.length > 0 &&
      !advanced.escalaTemporal.includes(map.escala_temporal || map.escalaTemporal || '')) {
      return false;
    }

    // Tipo de fenómeno (es un array en el mapa)
    const mapTipoFenomeno = Array.isArray(map.tipo_fenomeno) ? map.tipo_fenomeno : (map.tipoFenomeno || []);
    if (advanced.tipoFenomeno.length > 0 &&
      !advanced.tipoFenomeno.some(tipo => mapTipoFenomeno.includes(tipo))) {
      return false;
    }

    // Tipo de escala
    if (advanced.tipoEscala.length > 0 &&
      !advanced.tipoEscala.includes(map.tipo_escala || map.tipoEscala || '')) {
      return false;
    }

    // Tipo de datos
    if (advanced.tipoDatos.length > 0 &&
      !advanced.tipoDatos.includes(map.tipo_datos || map.tipoDatos || '')) {
      return false;
    }

    // Tipo de mapa
    if (advanced.tipoMapa.length > 0 &&
      !advanced.tipoMapa.includes(map.tipo_mapa || map.tipoMapa || '')) {
      return false;
    }

    // Si pasó todos los filtros, incluir en resultados
    return true;
  });
}

/**
 * Renderiza los mapas filtrados
 * @param {boolean} reset - Si true, limpia el grid antes de renderizar
 */
function renderMaps(reset = false) {
  // Si reset es true, limpiar grid y comenzar desde el principio
  if (reset) {
    elements.resultsGrid.innerHTML = '';
  }

  const start = app.currentBatch * app.batchSize;
  const end = start + app.batchSize;
  const mapsToRender = app.filteredMaps.slice(start, end);

  // Ocultar/mostrar botón "Cargar más" según haya más resultados
  if (end >= app.filteredMaps.length) {
    elements.loadMoreBtn.style.display = 'none';
  } else {
    elements.loadMoreBtn.style.display = 'block';
  }

  // Renderizar cada mapa
  mapsToRender.forEach(map => {
    const index = app.filteredMaps.indexOf(map);
    const miniatura = createMapThumbnail(map, index);
    elements.resultsGrid.appendChild(miniatura);
  });
}

/**
 * Crea el elemento HTML para una miniatura de mapa
 * @param {Object} map - Objeto mapa
 * @param {number} index - Índice en la lista filtrada
 * @returns {HTMLElement} - Elemento div de la miniatura
 */
function createMapThumbnail(map, index) {
  const miniatura = document.createElement('div');
  miniatura.className = 'miniatura';
  miniatura.setAttribute('data-index', index);
  if (map.id) miniatura.setAttribute('data-id', map.id);

  const imgSrc = map.image || map.ruta_imagen || '';
  const title = map.title || map.titulo || '';

  miniatura.innerHTML = `
    <img src="${imgSrc}" alt="${title}" loading="lazy">
    <div class="miniatura-titulo">${title}</div>
  `;

  // Event listener para abrir modal
  miniatura.addEventListener('click', () => {
    // Si hay id, abrir modal usando id para garantizar unicidad
    if (map.id) {
      openMapModal(map.id);
    } else {
      openMapModal(index);
    }
  });

  return miniatura;
}

/**
 * Carga más mapas (siguiente lote)
 */
function loadMoreMaps() {
  app.currentBatch++;
  renderMaps();
}

/**
 * Actualiza el contador de resultados
 */
function updateResultsCount() {
  if (!elements.resultsCount) return;
  elements.resultsCount.textContent = `${app.filteredMaps.length} resultados`;
}

/**
 * Actualiza los filtros activos mostrados
 */
function updateActiveFilters() {
  // Si el contenedor de filtros activos no existe en el DOM (puede estar comentado), salir
  if (!elements.activeFiltersContainer) {
    // Asegurar que el botón de limpiar filtros esté oculto si existe
    if (elements.clearFiltersBtn) elements.clearFiltersBtn.style.display = 'none';
    return;
  }

  elements.activeFiltersContainer.innerHTML = '';

  const { keyword, category, advanced } = app.activeFilters;
  let hasActiveFilters = false;

  // Mostrar keyword como filtro activo si existe
  if (keyword) {
    hasActiveFilters = true;
    const keywordTag = document.createElement('div');
    keywordTag.className = 'filter-tag';
    keywordTag.innerHTML = `
      Texto: ${keyword} <span class="remove-filter" data-filter="keyword">×</span>
    `;
    elements.activeFiltersContainer.appendChild(keywordTag);

    // Event listener para quitar este filtro
    keywordTag.querySelector('.remove-filter').addEventListener('click', () => {
      elements.keywordInput.value = '';
      handleSearch();
    });
  }

  // Mostrar categoría como filtro activo si no es "Todos"
  if (category !== 'Todos') {
    hasActiveFilters = true;
    const categoryTag = document.createElement('div');
    categoryTag.className = 'filter-tag';
    categoryTag.innerHTML = `
      Categoría: ${category} <span class="remove-filter" data-filter="category">×</span>
    `;
    elements.activeFiltersContainer.appendChild(categoryTag);

    // Event listener para quitar este filtro
    categoryTag.querySelector('.remove-filter').addEventListener('click', () => {
      document.querySelector('input[value="Todos"]').checked = true;
      handleSearch();
    });
  }

  // Mostrar filtros avanzados activos
  Object.keys(advanced).forEach(filterGroup => {
    const filters = advanced[filterGroup];
    if (filters.length > 0) {
      hasActiveFilters = true;

      // Nombre legible del grupo de filtro
      const groupNames = {
        estructuraTematica: 'Estructura temática',
        escalaEspacial: 'Escala espacial',
        escalaTemporal: 'Escala temporal',
        tipoFenomeno: 'Tipo de fenómeno',
        tipoEscala: 'Tipo de escala',
        tipoDatos: 'Tipo de datos',
        tipoMapa: 'Tipo de mapa'
      };

      // Crear etiqueta para cada valor de filtro en el grupo
      filters.forEach(value => {
        const advancedTag = document.createElement('div');
        advancedTag.className = 'filter-tag';
        advancedTag.innerHTML = `
          ${groupNames[filterGroup]}: ${value} 
          <span class="remove-filter" data-filter="${filterGroup}" data-value="${value}">×</span>
        `;
        elements.activeFiltersContainer.appendChild(advancedTag);

        // Event listener para quitar este filtro
        advancedTag.querySelector('.remove-filter').addEventListener('click', () => {
          // Encontrar y desmarcar el checkbox correspondiente
          elements.advancedFilters[filterGroup].forEach(checkbox => {
            if (checkbox.value === value) {
              checkbox.checked = false;
            }
          });

          // Quitar el valor del array de filtros activos
          app.activeFilters.advanced[filterGroup] = app.activeFilters.advanced[filterGroup]
            .filter(v => v !== value);

          // Actualizar búsqueda
          handleSearch();
        });
      });
    }
  });

  // Mostrar u ocultar el botón "Limpiar todos" según haya filtros activos
  if (hasActiveFilters) {
    elements.clearFiltersBtn.style.display = 'block';
  } else {
    elements.clearFiltersBtn.style.display = 'none';
  }
}

/**
 * Limpia todos los filtros activos
 */
function clearAllFilters() {
  // Resetear input de keyword
  elements.keywordInput.value = '';

  // Resetear radio button a "Todos"
  document.querySelector('input[value="Todos"]').checked = true;

  // Limpiar filtros avanzados
  clearAdvancedFilters();

  // Ejecutar búsqueda para actualizar resultados
  handleSearch();
}

/**
 * Abre el modal con el mapa seleccionado
 * @param {number} index - Índice del mapa en la lista filtrada
 */
function openMapModal(index) {
  // index puede ser numérico (índice) o un id (string)
  let idx = typeof index === 'number' ? index : findIndexById(index);
  if (idx === -1) {
    // intentar interpretar como número
    const asNum = parseInt(index, 10);
    if (!isNaN(asNum) && app.filteredMaps[asNum]) idx = asNum;
  }

  if (idx < 0 || idx >= app.filteredMaps.length) return;

  app.currentModalIndex = idx;
  const map = app.filteredMaps[idx];

  // Crear modal si no existe
  if (!elements.modal) {
    elements.modal = document.createElement('div');
    elements.modal.className = 'modal-fullscreen';
    document.body.appendChild(elements.modal);
  }

  // Formatear fecha para visualización
 /*  const fecha = new Date(map.fecha_actualizacion);
  const fechaFormateada = fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }); */

  // Determinar si estamos en viewport móvil
  const isMobile = window.innerWidth < 900;

  // Contenido del modal según dispositivo
  if (isMobile) {
    // Versión móvil (imagen fullscreen + botón descarga)
    const mobileImage = map.image || map.ruta_imagen || '';
    const mobileDownload = map.download || map.download_link || map.ruta_descarga || mobileImage;
    elements.modal.innerHTML = `
      <div class="modal-mobile">
        <img src="${mobileImage}" alt="${map.title || map.titulo}">
        <div class="modal-mobile-actions">
          <button class="close-modal-btn">×</button>
          <a href="${mobileDownload}" download class="download-btn" target="_blank">
            <i class='bx bx-download'></i> Descargar
          </a>
          <a href="${mobileImage}" class="view-btn" target="_blank">
            <i class='bx bx-window-open'></i> Ver
          </a>
        </div>
      </div>
    `;
  // Añadir botones overlay chevron para navegación móvil
  const mobilePrev = document.createElement('button');
  mobilePrev.setAttribute('aria-label', 'Anterior');
  mobilePrev.className = 'modal-nav-btn prev-map-btn overlay left';
  // Inline styles: colocados dentro del modal, en la parte inferior para no tapar la imagen
  mobilePrev.setAttribute('style', [
    'position:absolute',
    'bottom:18px',
    'left:12px',
    'width:48px',
    'height:48px',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'background:transparent',
    'border:none',
    'padding:0',
    'cursor:pointer',
    'z-index:1200'
  ].join(';'));
  mobilePrev.innerHTML = `<i class='bx bx-chevron-left' style="font-size:30px;color:white;line-height:1;"></i>`;

  const mobileNext = document.createElement('button');
  mobileNext.setAttribute('aria-label', 'Siguiente');
  mobileNext.className = 'modal-nav-btn next-map-btn overlay right';
  mobileNext.setAttribute('style', [
    'position:absolute',
    'bottom:18px',
    'right:12px',
    'width:48px',
    'height:48px',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'background:transparent',
    'border:none',
    'padding:0',
    'cursor:pointer',
    'z-index:1200'
  ].join(';'));
  mobileNext.innerHTML = `<i class='bx bx-chevron-right' style="font-size:30px;color:white;line-height:1;"></i>`;

  // Deshabilitar según posición
  if (idx === 0) {
    mobilePrev.disabled = true;
    mobilePrev.style.opacity = '0.4';
    mobilePrev.style.pointerEvents = 'none';
  }
  if (idx === app.filteredMaps.length - 1) {
    mobileNext.disabled = true;
    mobileNext.style.opacity = '0.4';
    mobileNext.style.pointerEvents = 'none';
  }

  // Hover color change (no CSS :hover porque usamos estilos inline)
  const mobilePrevIcon = mobilePrev.querySelector('i');
  const mobileNextIcon = mobileNext.querySelector('i');
  if (mobilePrevIcon) {
    mobilePrev.addEventListener('mouseenter', () => mobilePrevIcon.style.color = '#d3d3d3');
    mobilePrev.addEventListener('mouseleave', () => mobilePrevIcon.style.color = 'white');
  }
  if (mobileNextIcon) {
    mobileNext.addEventListener('mouseenter', () => mobileNextIcon.style.color = '#d3d3d3');
    mobileNext.addEventListener('mouseleave', () => mobileNextIcon.style.color = 'white');
  }

  elements.modal.appendChild(mobilePrev);
  elements.modal.appendChild(mobileNext);

  if (!mobilePrev.disabled) mobilePrev.addEventListener('click', () => openMapModal(idx - 1));
  if (!mobileNext.disabled) mobileNext.addEventListener('click', () => openMapModal(idx + 1));
  } else {
    // Versión desktop (modal con aside lateral)
    const desktopImage = map.image || map.ruta_imagen || '';
    const desktopDownload = map.download || map.download_link || map.ruta_descarga || desktopImage;
    const title = map.title || map.titulo || '';
    const author = map.author || map.autor || '';
    const year = map.year || map.año || '';
    const section = map.section || map.categoria || '';
    const publication = map.publication || map.publicacion || '';
    const link = map.link || map.enlace || '';
    
    elements.modal.innerHTML = `
      <div class="modal-img-container">
        <img src="${desktopImage}" alt="${title}">
      </div>
      <aside class="modal-aside">
        <div class="modal-info">
          <h4>${title}</h4>
          ${author ? `<p class="map-author"><strong>Autor:</strong> ${author}</p>` : ''}
          
          <div class="map-metadata">
            ${section ? `<div class="metadata-item">
              <strong>Sección:</strong> ${section}
            </div>` : ''}
            ${publication ? `<div class="metadata-item">
              <strong>Publicación:</strong> ${publication}
            </div>` : ''}
            ${year ? `<div class="metadata-item">
              <strong>Año:</strong> ${year}
            </div>` : ''}
            ${link ? `<div class="metadata-item">
              <strong>Enlace:</strong> <a href="${link}" target="_blank" rel="noopener">Ver publicación</a>
            </div>` : ''}
          </div>
        </div>
        
        <div class="modal-actions">
          <div class="modal-download">
            <a href="${desktopDownload}" download class="download-btn" target="_blank">
              <i class='bx bx-download'></i> Descargar
            </a>
          </div>
          
          <button class="close-modal-btn">×</button>
        </div>
      </aside>
    `;

    // Event listeners para navegación entre mapas
  // Crear y añadir botones overlay chevron a izquierda/derecha (desktop)
  const prevBtn = document.createElement('button');
  prevBtn.setAttribute('aria-label', 'Anterior');
  prevBtn.className = 'modal-nav-btn prev-map-btn overlay left';
  // Inline styles: fijados a la pantalla, centrados verticalmente
  prevBtn.setAttribute('style', [
    'position:fixed',
    'top:50%',
    'left:8px',
    'transform:translateY(-50%)',
    'width:48px',
    'height:48px',
    'min-width:40px',
    'min-height:40px',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'background:transparent',
    'border:none',
    'padding:0',
    'cursor:pointer',
    'z-index:1200'
  ].join(';'));
  prevBtn.innerHTML = `<i class='bx bx-chevron-left' style="font-size:30px;color:white;line-height:1;"></i>`;

  const nextBtn = document.createElement('button');
  nextBtn.setAttribute('aria-label', 'Siguiente');
  nextBtn.className = 'modal-nav-btn next-map-btn overlay right';
  nextBtn.setAttribute('style', [
    'position:fixed',
    'top:50%',
    'right:8px',
    'transform:translateY(-50%)',
    'width:48px',
    'height:48px',
    'min-width:40px',
    'min-height:40px',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'background:transparent',
    'border:none',
    'padding:0',
    'cursor:pointer',
    'z-index:1200'
  ].join(';'));
  nextBtn.innerHTML = `<i class='bx bx-chevron-right' style="font-size:30px;color:white;line-height:1;"></i>`;

  if (idx === 0) {
    prevBtn.disabled = true;
    prevBtn.style.opacity = '0.4';
    prevBtn.style.pointerEvents = 'none';
  }
  if (idx === app.filteredMaps.length - 1) {
    nextBtn.disabled = true;
    nextBtn.style.opacity = '0.4';
    nextBtn.style.pointerEvents = 'none';
  }

  // Hover color change for icons
  const prevIcon = prevBtn.querySelector('i');
  const nextIcon = nextBtn.querySelector('i');
  if (prevIcon) {
    prevBtn.addEventListener('mouseenter', () => prevIcon.style.color = '#d3d3d3');
    prevBtn.addEventListener('mouseleave', () => prevIcon.style.color = 'white');
  }
  if (nextIcon) {
    nextBtn.addEventListener('mouseenter', () => nextIcon.style.color = '#d3d3d3');
    nextBtn.addEventListener('mouseleave', () => nextIcon.style.color = 'white');
  }

  elements.modal.appendChild(prevBtn);
  elements.modal.appendChild(nextBtn);

  if (!prevBtn.disabled) prevBtn.addEventListener('click', () => openMapModal(idx - 1));
  if (!nextBtn.disabled) nextBtn.addEventListener('click', () => openMapModal(idx + 1));
  }

  // Event listener para cerrar modal
  elements.modal.querySelector('.close-modal-btn').addEventListener('click', closeModal);

  // Bloquear scroll en el body
  document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de mapa
 */
function closeModal() {
  if (elements.modal) {
    document.body.removeChild(elements.modal);
    elements.modal = null;

    // Restaurar scroll
    document.body.style.overflow = '';
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);
