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
    category: 'Todos'
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
 * Filtra los mapas según criterios actuales
 */
function filterMaps() {
  const { keyword, category } = app.activeFilters;
  
  app.filteredMaps = app.allMaps.filter(map => {
    // Filtrar por categoría
    if (category !== 'Todos' && map.categoria !== category) {
      return false;
    }
    
    // Si no hay keyword, solo aplicamos filtro de categoría
    if (!keyword) {
      return true;
    }
    
    // Normalizar keyword y textos para búsqueda
    const normalizedKeyword = normalizeText(keyword);
    const normalizedTitle = normalizeText(map.titulo);
    
    // Comprobar coincidencia en título
    if (normalizedTitle.includes(normalizedKeyword)) {
      return true;
    }
    
    // Comprobar coincidencia en keywords
    return map.keywords.some(k => normalizeText(k).includes(normalizedKeyword));
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
  
  const { keyword, category } = app.activeFilters;
  
  // Mostrar keyword como filtro activo si existe
  if (keyword) {
    const keywordTag = document.createElement('div');
    keywordTag.className = 'filter-tag';
    keywordTag.innerHTML = `
      ${keyword} <span class="remove-filter" data-filter="keyword">×</span>
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
    const categoryTag = document.createElement('div');
    categoryTag.className = 'filter-tag';
    categoryTag.innerHTML = `
      ${category} <span class="remove-filter" data-filter="category">×</span>
    `;
    elements.activeFiltersContainer.appendChild(categoryTag);
    
    // Event listener para quitar este filtro
    categoryTag.querySelector('.remove-filter').addEventListener('click', () => {
      document.querySelector('input[value="Todos"]').checked = true;
      handleSearch();
    });
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
          
          <button class="close-modal-btn">Cerrar</button>
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
