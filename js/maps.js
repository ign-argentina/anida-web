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

// DOM Elements
const elements = {
  searchForm: null,
  keywordInput: null,
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
  elements.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSearch();
  });

  // Radio buttons de categoría
  elements.categoryFilters.forEach(radio => {
    radio.addEventListener('change', handleSearch);
  });

  // Botón cargar más
  elements.loadMoreBtn.addEventListener('click', loadMoreMaps);

  // Limpiar todos los filtros
  elements.clearFiltersBtn.addEventListener('click', clearAllFilters);

  // Cerrar modal con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.modal) {
      closeModal();
    }
  });

  // Botón aplicar filtros avanzados
  elements.applyAdvancedBtn.addEventListener('click', () => {
    getAdvancedFilters();
    handleSearch();
    // Cerrar acordeón después de aplicar
    const accordionButton = document.querySelector('.accordion-button');
    if (!accordionButton.classList.contains('collapsed')) {
      accordionButton.click();
    }
  });

  // Botón limpiar filtros avanzados
  elements.clearAdvancedBtn.addEventListener('click', clearAdvancedFilters);
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

  elements.categoryFilters.forEach(radio => {
    if (radio.checked) {
      category = radio.value;
    }
  });

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
    // Filtrar por categoría rápida
    if (category !== 'Todos' && map.categoria !== category) {
      return false;
    }

    // Filtrar por keyword si existe
    if (keyword) {
      const normalizedKeyword = normalizeText(keyword);
      const normalizedTitle = normalizeText(map.titulo);

      // Si no hay coincidencia en título ni keywords, excluir
      if (!normalizedTitle.includes(normalizedKeyword) &&
        !map.keywords.some(k => normalizeText(k).includes(normalizedKeyword))) {
        return false;
      }
    }

    // Filtrar por filtros avanzados
    // Estructura temática
    if (advanced.estructuraTematica.length > 0 &&
      !advanced.estructuraTematica.includes(map.categoria)) {
      return false;
    }

    // Escala espacial
    if (advanced.escalaEspacial.length > 0 &&
      !advanced.escalaEspacial.includes(map.escala_espacial)) {
      return false;
    }

    // Escala temporal
    if (advanced.escalaTemporal.length > 0 &&
      !advanced.escalaTemporal.includes(map.escala_temporal)) {
      return false;
    }

    // Tipo de fenómeno (es un array en el mapa)
    if (advanced.tipoFenomeno.length > 0 &&
      !advanced.tipoFenomeno.some(tipo => map.tipo_fenomeno.includes(tipo))) {
      return false;
    }

    // Tipo de escala
    if (advanced.tipoEscala.length > 0 &&
      !advanced.tipoEscala.includes(map.tipo_escala)) {
      return false;
    }

    // Tipo de datos
    if (advanced.tipoDatos.length > 0 &&
      !advanced.tipoDatos.includes(map.tipo_datos)) {
      return false;
    }

    // Tipo de mapa
    if (advanced.tipoMapa.length > 0 &&
      !advanced.tipoMapa.includes(map.tipo_mapa)) {
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

  miniatura.innerHTML = `
    <img src="${map.ruta_imagen}" alt="${map.titulo}" loading="lazy">
    <div class="miniatura-titulo">${map.titulo}</div>
  `;

  // Event listener para abrir modal
  miniatura.addEventListener('click', () => {
    openMapModal(index);
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
  elements.resultsCount.textContent = `${app.filteredMaps.length} resultados`;
}

/**
 * Actualiza los filtros activos mostrados
 */
function updateActiveFilters() {
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
  app.currentModalIndex = index;
  const map = app.filteredMaps[index];

  // Crear modal si no existe
  if (!elements.modal) {
    elements.modal = document.createElement('div');
    elements.modal.className = 'modal-fullscreen';
    document.body.appendChild(elements.modal);
  }

  // Formatear fecha para visualización
  const fecha = new Date(map.fecha_actualizacion);
  const fechaFormateada = fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Determinar si estamos en viewport móvil
  const isMobile = window.innerWidth < 900;

  // Contenido del modal según dispositivo
  if (isMobile) {
    // Versión móvil (imagen fullscreen + botón descarga)
    elements.modal.innerHTML = `
      <div class="modal-mobile">
        <img src="${map.ruta_imagen}" alt="${map.titulo}">
        <div class="modal-mobile-actions">
          <button class="close-modal-btn">×</button>
          <a href="${map.ruta_imagen}" download class="download-btn" target="_blank">
            <i class='bx bx-download'></i> Descargar
          </a>
          <a href="${map.ruta_imagen}" class="view-btn" target="_blank">
            <i class='bx bx-window-open'></i> Ver
          </a>
        </div>
      </div>
    `;
  } else {
    // Versión desktop (modal con aside lateral)
    elements.modal.innerHTML = `
      <div class="modal-img-container">
        <img src="${map.ruta_imagen}" alt="${map.titulo}">
      </div>
      <aside class="modal-aside">
        <div class="modal-info">
          <h2>${map.titulo}</h2>
          <p class="map-resumen">${map.resumen}</p>
          
          <div class="map-metadata">
            <div class="metadata-item">
              <strong>Categoría:</strong> ${map.categoria}
            </div>
            <div class="metadata-item">
              <strong>Institución:</strong> ${map.institucion}
            </div>
            <div class="metadata-item">
              <strong>Fecha de actualización:</strong> ${fechaFormateada}
            </div>
            <div class="metadata-item">
              <strong>Escala espacial:</strong> ${map.escala_espacial}
            </div>
            <div class="metadata-item">
              <strong>Escala temporal:</strong> ${map.escala_temporal}
            </div>
            <div class="metadata-item">
              <strong>Tipo de mapa:</strong> ${map.tipo_mapa}
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <div class="modal-nav">
            <button class="prev-map-btn" ${index === 0 ? 'disabled' : ''}>
              <i class='bx bx-chevron-left'></i> Anterior
            </button>
            <button class="next-map-btn" ${index === app.filteredMaps.length - 1 ? 'disabled' : ''}>
              Siguiente <i class='bx bx-chevron-right'></i>
            </button>
          </div>
          
          <div class="modal-download">
            <a href="${map.ruta_imagen}" download class="download-btn" target="_blank">
              <i class='bx bx-download'></i> Descargar
            </a>
            <a href="${map.ruta_imagen}" class="view-btn" target="_blank">
              <i class='bx bx-window-open'></i> Ver en pestaña
            </a>
          </div>
          
          <button class="close-modal-btn">×</button>
        </div>
      </aside>
    `;

    // Event listeners para navegación entre mapas
    const prevBtn = elements.modal.querySelector('.prev-map-btn');
    const nextBtn = elements.modal.querySelector('.next-map-btn');

    if (prevBtn && !prevBtn.disabled) {
      prevBtn.addEventListener('click', () => {
        openMapModal(index - 1);
      });
    }

    if (nextBtn && !nextBtn.disabled) {
      nextBtn.addEventListener('click', () => {
        openMapModal(index + 1);
      });
    }
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
