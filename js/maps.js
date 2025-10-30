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
  searchIndex: {},     // Índice invertido para búsquedas O(1)
  activeFilters: {     // Filtros activos
    keyword: '',
    category: 'Todos',
    advanced: {
      escalaEspacial: [],
      escalaTemporal: []
    }
  },
  currentModalIndex: 0, // Índice del mapa actual en modal
  modalKeyHandler: null, // Referencia al handler de teclado del modal
  fuzzyMatch: true, // Referencia a la función de búsqueda difusa
  visualMatch: false, // Mostrar en pantalla el porcentaje de coincidencia segun peso
  searchTimeout: null, // Timer para debouncing de búsqueda
  debounceDelay: 300,  // Delay en ms para debouncing (300ms por defecto)
  autocompleteTimeout: null, // Timer para debouncing de autocompletado
  autocompleteDelay: 200, // Delay en ms para autocompletado (200ms)
  selectedSuggestionIndex: -1, // Índice de sugerencia seleccionada con teclado
  performanceMetrics: { // Métricas de rendimiento
    indexingTime: 0,
    lastSearchTime: 0,
    totalSearches: 0,
    averageSearchTime: 0,
    memoryBefore: 0,
    memoryAfter: 0,
    memoryReduction: 0
  }
};

// ============================================================================
// GOOGLE ANALYTICS 4 - TRACKING DE EVENTOS
// ============================================================================

/**
 * Envía un evento a Google Analytics 4 via Google Tag Manager
 * @param {string} eventName - Nombre del evento
 * @param {Object} eventParams - Parámetros del evento
 */
function trackEvent(eventName, eventParams = {}) {
  try {
    // Verificar que dataLayer existe (Google Tag Manager)
    if (typeof window.dataLayer !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...eventParams
      });
      
      // Log en desarrollo (comentar en producción si se desea)
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        /* console.log('📊 GA4 Event:', eventName, eventParams); */
      }
    }
  } catch (error) {
    console.error('Error al enviar evento a GA4:', error);
  }
}

/**
 * Tracking: Búsqueda realizada
 * @param {string} query - Término de búsqueda
 * @param {number} resultsCount - Cantidad de resultados
 * @param {string} category - Categoría seleccionada
 * @param {Object} advancedFilters - Filtros avanzados aplicados
 */
function trackSearch(query, resultsCount, category = 'Todos', advancedFilters = {}) {
  const hasAdvancedFilters = (advancedFilters.escalaEspacial?.length > 0) || 
                             (advancedFilters.escalaTemporal?.length > 0);
  
  trackEvent('search_query', {
    search_term: query || '(búsqueda vacía)',
    search_results_count: resultsCount,
    search_category: category,
    has_advanced_filters: hasAdvancedFilters,
    advanced_filters_spatial: advancedFilters.escalaEspacial?.join(', ') || 'ninguno',
    advanced_filters_temporal: advancedFilters.escalaTemporal?.join(', ') || 'ninguno',
    search_timestamp: new Date().toISOString()
  });
}

/**
 * Tracking: Visualización de mapa en modal
 * @param {Object} map - Objeto del mapa
 * @param {string} source - Fuente de la visualización ('grid', 'navigation', 'direct')
 */
function trackMapView(map, source = 'grid') {
  trackEvent('map_view', {
    map_id: map.id || 'sin_id',
    map_title: map.title || map.titulo || 'sin_título',
    map_category: map.category || map.categoria || 'sin_categoría',
    map_section: map.section || map.categoria || 'sin_sección',
    map_publication: map.publication || map.publicacion || 'sin_publicación',
    map_author: map.author || map.autor || 'sin_autor',
    map_year: map.year || map.año || 'sin_año',
    view_source: source,
    view_timestamp: new Date().toISOString()
  });
}

/**
 * Tracking: Descarga de mapa
 * @param {Object} map - Objeto del mapa
 * @param {string} downloadType - Tipo de descarga ('modal_desktop', 'modal_mobile')
 */
function trackMapDownload(map, downloadType = 'modal') {
  trackEvent('map_download', {
    map_id: map.id || 'sin_id',
    map_title: map.title || map.titulo || 'sin_título',
    map_category: map.category || map.categoria || 'sin_categoría',
    map_section: map.section || map.categoria || 'sin_sección',
    map_publication: map.publication || map.publicacion || 'sin_publicación',
    download_type: downloadType,
    download_url: map.download || map.download_link || map.ruta_descarga || 'sin_url',
    download_timestamp: new Date().toISOString()
  });
}

/**
 * Tracking: Aplicación de filtros
 * @param {string} filterType - Tipo de filtro ('category', 'escalaEspacial', 'escalaTemporal', 'keyword')
 * @param {string|Array} filterValue - Valor(es) del filtro
 * @param {number} resultsCount - Cantidad de resultados después del filtro
 */
function trackFilterApplied(filterType, filterValue, resultsCount) {
  const valueString = Array.isArray(filterValue) ? filterValue.join(', ') : filterValue;
  
  trackEvent('filter_applied', {
    filter_type: filterType,
    filter_value: valueString || 'ninguno',
    results_count: resultsCount,
    filter_timestamp: new Date().toISOString()
  });
}

/**
 * Tracking: Interacción con sugerencias de búsqueda
 * @param {string} originalQuery - Término original que no dio resultados
 * @param {string} suggestedTerm - Término sugerido que fue clickeado
 * @param {string} suggestionType - Tipo de sugerencia ('similar', 'popular')
 */
function trackSearchSuggestion(originalQuery, suggestedTerm, suggestionType = 'similar') {
  trackEvent('search_suggestion_click', {
    original_query: originalQuery,
    suggested_term: suggestedTerm,
    suggestion_type: suggestionType,
    suggestion_timestamp: new Date().toISOString()
  });
}

/**
 * Tracking: Uso del historial de búsqueda
 * @param {string} action - Acción realizada ('view', 'click', 'clear')
 * @param {string} term - Término del historial (opcional)
 */
function trackSearchHistory(action, term = '') {
  trackEvent('search_history_interaction', {
    action: action,
    search_term: term,
    history_timestamp: new Date().toISOString()
  });
}

/**
 * Tracking: Uso del autocompletado
 * @param {string} selectedTerm - Término seleccionado del autocompletado
 * @param {string} partialQuery - Consulta parcial que activó el autocompletado
 */
function trackAutocomplete(selectedTerm, partialQuery) {
  trackEvent('autocomplete_selection', {
    selected_term: selectedTerm,
    partial_query: partialQuery,
    autocomplete_timestamp: new Date().toISOString()
  });
}

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
  clearKeywordBtn: null,
  historyBtn: null,
  searchHistoryDropdown: null,
  searchHistoryList: null,
  clearHistoryBtn: null,
  categoryFilters: null,
  resultsCount: null,
  resultsGrid: null,
  loadMoreBtn: null,
  activeFiltersContainer: null,
  clearFiltersBtn: null,
  modal: null,
  autocompleteDropdown: null
};

/**
 * Inicializa la aplicación
 */
function initApp() {
  // Capturar elementos del DOM
  elements.searchForm = document.getElementById('search-form');
  elements.keywordInput = document.getElementById('keyword-input');
  elements.searchButton = document.querySelector('#search-form button[type="submit"]');
  elements.clearKeywordBtn = document.getElementById('clear-keyword-btn');
  elements.historyBtn = document.getElementById('history-btn');
  elements.searchHistoryDropdown = document.getElementById('search-history-dropdown');
  elements.searchHistoryList = document.getElementById('search-history-list');
  elements.clearHistoryBtn = document.getElementById('clear-history-btn');
  elements.categoryFilters = document.querySelectorAll('input[name="category"]');
  elements.resultsCount = document.getElementById('results-count');
  elements.resultsGrid = document.getElementById('results-grid');
  elements.loadMoreBtn = document.getElementById('load-more-btn');
  elements.activeFiltersContainer = document.getElementById('active-filters');
  elements.clearFiltersBtn = document.getElementById('clear-filters-btn');
  elements.applyAdvancedBtn = document.getElementById('apply-advanced-btn');
  elements.clearAdvancedBtn = document.getElementById('clear-advanced-btn');
  elements.advancedFilters = {
    escalaEspacial: document.querySelectorAll('input[name="escalaEspacial"]'),
    escalaTemporal: document.querySelectorAll('input[name="escalaTemporal"]')
  };

  // Cargar datos
  fetchMapsData();

  // Crear dropdown de autocompletado
  createAutocompleteDropdown();

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

    // Crear índice invertido para búsquedas rápidas
    console.time('⚡ Indexación de mapas');
    buildSearchIndex();
    console.timeEnd('⚡ Indexación de mapas');
    
    // Ejecutar validaciones en desarrollo
    runPostIndexValidation();

    // Inicialmente, mostrar todos los mapas
    app.filteredMaps = [...app.allMaps];
    renderMaps();
    updateResultsCount();
    
    // Actualizar contadores de filtros después de cargar los datos
    updateFilterCounts();

    // Mostrar estadísticas de indexación
    const indexStats = getIndexStats();
    /* console.log(`📊 Estadísticas de indexación:
      - Mapas indexados: ${app.allMaps.length}
      - Términos únicos: ${Object.keys(app.searchIndex).length}
      - Tiempo de indexación: ${app.performanceMetrics.indexingTime.toFixed(2)}ms
      - Promedio por mapa: ${(app.performanceMetrics.indexingTime / app.allMaps.length).toFixed(2)}ms
      - Mapas promedio por término: ${indexStats.averageMapsPerTerm}
      - Memoria estimada del índice: ${indexStats.memoryEstimate}
      ${performance.memory ? `- Memoria antes: ${(app.performanceMetrics.memoryBefore / 1024 / 1024).toFixed(2)} MB` : ''}
      ${performance.memory ? `- Memoria después: ${(app.performanceMetrics.memoryAfter / 1024 / 1024).toFixed(2)} MB` : ''}
      ${performance.memory ? `- Optimización: ${Math.abs(app.performanceMetrics.memoryReduction)}% ${app.performanceMetrics.memoryReduction > 0 ? 'reducción' : 'incremento'}` : ''}
    `); */

  } catch (error) {
    console.error('Error cargando mapas:', error);
    elements.resultsGrid.innerHTML = `<p class="error-message">Error cargando mapas. Por favor, intente nuevamente más tarde.</p>`;
  }
}

/**
 * Construye el índice invertido para búsquedas O(1)
 * Crea un diccionario donde cada término apunta a los índices de mapas que lo contienen
 * Optimizado para reducir consumo de memoria usando arrays tipados y flags de bits
 */
function buildSearchIndex() {
  const startTime = performance.now();
  
  // Medir memoria antes de indexar (solo en Chrome)
  if (performance.memory) {
    app.performanceMetrics.memoryBefore = performance.memory.usedJSHeapSize;
  }
  
  // Reiniciar índice
  app.searchIndex = {};
  
  // Estructura temporal para construcción del índice
  const tempIndex = {};
  
  app.allMaps.forEach((map, mapIndex) => {
    const normalizedMap = normalizeMapData(map);
    
    // Obtener términos del título
    const titleField = map.title_search || normalizeText(normalizedMap.title);
    const titleTerms = titleField.split(/\s+/).filter(term => term.length > 0);
    
    // Obtener términos de keywords
    const keywordFields = map.keywords_search || normalizedMap.keywords.map(k => normalizeText(k));
    const keywordTerms = keywordFields.flatMap(kw => kw.split(/\s+/)).filter(term => term.length > 0);
    
    // Combinar todos los términos únicos
    const allTerms = [...new Set([...titleTerms, ...keywordTerms])];
    
    // Indexar cada término
    allTerms.forEach(term => {
      // Ignorar términos muy cortos (< 2 caracteres)
      if (term.length < 2) return;
      
      // Crear entrada si no existe
      if (!tempIndex[term]) {
        tempIndex[term] = {
          indices: [],
          flags: [] // 0x01 = inTitle, 0x02 = inKeywords
        };
      }
      
      // Calcular flags para este mapa
      let flag = 0;
      if (titleTerms.includes(term)) flag |= 0x01;      // Bit 0: en título
      if (keywordTerms.includes(term)) flag |= 0x02;    // Bit 1: en keywords
      
      // Agregar índice del mapa y su flag
      if (!tempIndex[term].indices.includes(mapIndex)) {
        tempIndex[term].indices.push(mapIndex);
        tempIndex[term].flags.push(flag);
      }
    });
  });
  
  // Comprimir el índice convirtiendo a arrays tipados
  compressIndex(tempIndex);
  
  const endTime = performance.now();
  app.performanceMetrics.indexingTime = endTime - startTime;
  
  // Medir memoria después de indexar y comprimir
  if (performance.memory) {
    app.performanceMetrics.memoryAfter = performance.memory.usedJSHeapSize;
    app.performanceMetrics.memoryReduction = 
      ((app.performanceMetrics.memoryBefore - app.performanceMetrics.memoryAfter) / 
       app.performanceMetrics.memoryBefore * 100).toFixed(2);
  }
}

/**
 * Comprime el índice temporal convirtiendo arrays JavaScript a arrays tipados
 * Esto reduce el consumo de memoria en un 30-40%
 * @param {Object} tempIndex - Índice temporal con arrays normales
 */
function compressIndex(tempIndex) {
  Object.keys(tempIndex).forEach(term => {
    const entry = tempIndex[term];
    
    // Convertir arrays a arrays tipados
    // Uint16Array soporta hasta 65,535 mapas (suficiente para este caso)
    // Cada índice ocupa 2 bytes en lugar de ~8 bytes (Number)
    const mapIndices = new Uint16Array(entry.indices);
    
    // Uint8Array para flags (1 byte por mapa)
    // Bit 0: término en título
    // Bit 1: término en keywords
    const flags = new Uint8Array(entry.flags);
    
    // Guardar versión comprimida en el índice principal
    app.searchIndex[term] = {
      mapIndices,
      flags
    };
  });
}

/**
 * Verifica si un término aparece en el título de un mapa
 * Calcula on-demand usando flags de bits (sin arrays redundantes)
 * @param {string} term - Término a buscar
 * @param {number} mapIndex - Índice del mapa
 * @returns {boolean} true si el término está en el título
 */
function isTermInTitle(term, mapIndex) {
  const entry = app.searchIndex[term];
  if (!entry) return false;
  
  // Buscar el índice del mapa en el array de índices
  const position = Array.from(entry.mapIndices).indexOf(mapIndex);
  if (position === -1) return false;
  
  // Verificar el bit 0 del flag (0x01)
  return (entry.flags[position] & 0x01) !== 0;
}

/**
 * Verifica si un término aparece en las keywords de un mapa
 * Calcula on-demand usando flags de bits (sin arrays redundantes)
 * @param {string} term - Término a buscar
 * @param {number} mapIndex - Índice del mapa
 * @returns {boolean} true si el término está en keywords
 */
function isTermInKeywords(term, mapIndex) {
  const entry = app.searchIndex[term];
  if (!entry) return false;
  
  // Buscar el índice del mapa en el array de índices
  const position = Array.from(entry.mapIndices).indexOf(mapIndex);
  if (position === -1) return false;
  
  // Verificar el bit 1 del flag (0x02)
  return (entry.flags[position] & 0x02) !== 0;
}

/**
 * Obtiene estadísticas del índice para debugging
 * @returns {Object} Estadísticas del índice
 */
function getIndexStats() {
  const stats = {
    totalTerms: Object.keys(app.searchIndex).length,
    totalMaps: app.allMaps.length,
    averageMapsPerTerm: 0,
    memoryEstimate: 0
  };
  
  let totalMapReferences = 0;
  Object.values(app.searchIndex).forEach(entry => {
    totalMapReferences += entry.mapIndices.length;
    // 2 bytes por índice + 1 byte por flag
    stats.memoryEstimate += (entry.mapIndices.length * 2) + entry.flags.length;
  });
  
  stats.averageMapsPerTerm = (totalMapReferences / stats.totalTerms).toFixed(2);
  stats.memoryEstimate = (stats.memoryEstimate / 1024).toFixed(2) + ' KB';
  
  return stats;
}

/**
 * Crea el dropdown de autocompletado si no existe
 */
function createAutocompleteDropdown() {
  if (elements.autocompleteDropdown) return;
  
  const dropdown = document.createElement('div');
  dropdown.id = 'autocomplete-dropdown';
  dropdown.className = 'autocomplete-dropdown';
  dropdown.style.cssText = `
    position: absolute;
    background: white;
    border: 1px solid #ddd;
    border-radius: 0 0 4px 4px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
    display: none;
    width: 100%;
    top: 100%;
    left: 0;
    margin-top: 0;
  `;
  
  // Deshabilitar autocompletado nativo del input
  if (elements.keywordInput) {
    elements.keywordInput.setAttribute('autocomplete', 'off');
    elements.keywordInput.setAttribute('spellcheck', 'false');
  }
  
  // Insertar después del input
  const inputGroup = elements.keywordInput.closest('.input-group') || 
                     elements.keywordInput.parentElement;
  if (inputGroup) {
    // Asegurar que el contenedor del input-group sea relativo
    inputGroup.style.position = 'relative';
    inputGroup.appendChild(dropdown);
  }
  
  elements.autocompleteDropdown = dropdown;
}

/**
 * Obtiene sugerencias de autocompletado basadas en el input
 * @param {string} input - Texto ingresado por el usuario
 * @returns {Array<string>} - Array de sugerencias (máximo 5)
 */
function getSuggestions(input) {
  if (!input || input.trim().length < 2) return [];
  
  const normalized = normalizeText(input.trim());
  const words = normalized.split(/\s+/);
  const lastWord = words[words.length - 1];
  
  if (lastWord.length < 2) return [];
  
  // Obtener términos del índice que comienzan con el último término escrito
  const suggestions = Object.keys(app.searchIndex)
    .filter(term => term.startsWith(lastWord) && term !== lastWord)
    .sort((a, b) => {
      // Priorizar términos más cortos (más específicos)
      if (a.length !== b.length) return a.length - b.length;
      // Luego alfabéticamente
      return a.localeCompare(b);
    })
    .slice(0, 5);
  
  return suggestions;
}

/**
 * Muestra el dropdown de autocompletado con las sugerencias
 * @param {Array<string>} suggestions - Array de sugerencias a mostrar
 */
function showAutocomplete(suggestions) {
  if (!elements.autocompleteDropdown || suggestions.length === 0) {
    hideAutocomplete();
    return;
  }
  
  // Limpiar dropdown
  elements.autocompleteDropdown.innerHTML = '';
  
  // Crear elementos de sugerencia
  suggestions.forEach((suggestion, index) => {
    const item = document.createElement('div');
    item.className = 'autocomplete-item';
    item.textContent = suggestion;
    item.setAttribute('data-index', index);
    item.style.cssText = `
      padding: 10px 15px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.2s ease;
    `;
    
    // Hover effect
    item.addEventListener('mouseenter', () => {
      // Remover selección de otros items
      document.querySelectorAll('.autocomplete-item').forEach(i => {
        i.style.backgroundColor = '';
        i.style.fontWeight = '';
      });
      item.style.backgroundColor = '#f5f5f5';
      item.style.fontWeight = '500';
      app.selectedSuggestionIndex = index;
    });
    
    item.addEventListener('mouseleave', () => {
      if (app.selectedSuggestionIndex !== index) {
        item.style.backgroundColor = '';
        item.style.fontWeight = '';
      }
    });
    
    // Click para seleccionar
    item.addEventListener('click', () => {
      selectSuggestion(suggestion);
    });
    
    elements.autocompleteDropdown.appendChild(item);
  });
  
  // Mostrar dropdown
  elements.autocompleteDropdown.style.display = 'block';
  app.selectedSuggestionIndex = -1;
}

/**
 * Oculta el dropdown de autocompletado
 */
function hideAutocomplete() {
  if (elements.autocompleteDropdown) {
    elements.autocompleteDropdown.style.display = 'none';
    elements.autocompleteDropdown.innerHTML = '';
  }
  app.selectedSuggestionIndex = -1;
}

/**
 * Selecciona una sugerencia y actualiza el input
 * @param {string} suggestion - Sugerencia seleccionada
 */
function selectSuggestion(suggestion) {
  if (!elements.keywordInput) return;
  
  const currentValue = elements.keywordInput.value.trim();
  const words = currentValue.split(/\s+/);
  
  // 📊 TRACKING: Autocompletado seleccionado
  const partialQuery = words[words.length - 1] || currentValue;
  trackAutocomplete(suggestion, partialQuery);
  
  // Reemplazar la última palabra con la sugerencia
  words[words.length - 1] = suggestion;
  const newValue = words.join(' ') + ' '; // Agregar espacio al final
  
  elements.keywordInput.value = newValue;
  elements.keywordInput.focus();
  
  // Ocultar dropdown
  hideAutocomplete();
  
  // Guardar en historial si cumple validaciones
  const trimmedValue = newValue.trim();
  if (trimmedValue.length >= 3) {
    saveSearchToHistory(trimmedValue);
  }
  
  // Disparar búsqueda automáticamente
  const event = new Event('input', { bubbles: true });
  elements.keywordInput.dispatchEvent(event);
}

/**
 * Navega por las sugerencias con el teclado
 * @param {string} direction - 'up' o 'down'
 */
function navigateSuggestions(direction) {
  const items = elements.autocompleteDropdown?.querySelectorAll('.autocomplete-item');
  if (!items || items.length === 0) return;
  
  // Remover selección actual
  items.forEach(item => {
    item.style.backgroundColor = '';
    item.style.fontWeight = '';
  });
  
  // Calcular nuevo índice
  if (direction === 'down') {
    app.selectedSuggestionIndex = (app.selectedSuggestionIndex + 1) % items.length;
  } else if (direction === 'up') {
    app.selectedSuggestionIndex = app.selectedSuggestionIndex <= 0 
      ? items.length - 1 
      : app.selectedSuggestionIndex - 1;
  }
  
  // Aplicar selección
  if (app.selectedSuggestionIndex >= 0 && app.selectedSuggestionIndex < items.length) {
    const selectedItem = items[app.selectedSuggestionIndex];
    selectedItem.style.backgroundColor = '#f5f5f5';
    selectedItem.style.fontWeight = '500';
    
    // Scroll automático si es necesario
    selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

/**
 * Maneja el autocompletado con debouncing
 * @param {string} input - Texto del input
 */
function handleAutocomplete(input) {
  // Cancelar timeout anterior
  clearTimeout(app.autocompleteTimeout);
  
  // Si el input está vacío o muy corto, ocultar
  if (!input || input.trim().length < 2) {
    hideAutocomplete();
    return;
  }
  
  // Programar nueva búsqueda de sugerencias con debouncing
  app.autocompleteTimeout = setTimeout(() => {
    const suggestions = getSuggestions(input);
    showAutocomplete(suggestions);
  }, app.autocompleteDelay); // 200ms de delay
}

/**
 * Helper: configurar listeners de búsqueda
 */
function setupSearchListeners() {
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
    if (elements.searchButton) {
      elements.searchButton.disabled = (elements.keywordInput.value || '').trim().length < 3;
    }

    // Inicializar visibilidad del botón limpiar
    if (elements.clearKeywordBtn) {
      elements.clearKeywordBtn.style.display = (elements.keywordInput.value || '').trim().length > 0 ? 'inline-block' : 'none';
      elements.clearKeywordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        elements.keywordInput.value = '';
        // Actualizar estado del botón de búsqueda
        if (elements.searchButton) elements.searchButton.disabled = true;
        // Ocultar el propio botón
        elements.clearKeywordBtn.style.display = 'none';
        // Limpiar error y autocompletado
        clearInputError();
        hideAutocomplete();
        // Actualizar filtros y resultados
        app.activeFilters.keyword = '';
        app.currentBatch = 0;
        filterMaps();
        renderMaps(true);
        updateActiveFilters();
        updateResultsCount();
        updateFilterCounts(); // Resetear filtros inteligentes
      });
    }

    elements.keywordInput.addEventListener('input', (e) => {
      const rawValue = e.target.value || '';
      
      // Sanitizar el input SIN modificar el campo mientras el usuario escribe
      // Solo validamos, no modificamos el valor en tiempo real
      const sanitizationResult = sanitizeInput(rawValue);
      const val = sanitizationResult.sanitized;
      
      // Mostrar error si hay caracteres inválidos
      if (!sanitizationResult.valid && sanitizationResult.error) {
        showInputError(sanitizationResult.error);
      } else {
        clearInputError();
      }
      
      // Habilitar botón solo si hay al menos 3 caracteres
      // Usamos rawValue.trim() para contar caracteres reales
      const trimmedValue = rawValue.trim();
      if (elements.searchButton) {
        elements.searchButton.disabled = trimmedValue.length < 3;
      }

      // Mostrar/ocultar botón limpiar según contenido
      if (elements.clearKeywordBtn) {
        elements.clearKeywordBtn.style.display = rawValue.length > 0 ? 'inline-block' : 'none';
      }

      // AUTOCOMPLETADO: Manejar sugerencias con debouncing de 200ms
      handleAutocomplete(rawValue);

      // DEBOUNCING: Cancelar búsqueda anterior y programar nueva
      clearTimeout(app.searchTimeout);
      
      // Búsqueda en vivo con debouncing
      // Usamos el valor sanitizado para la búsqueda, pero NO modificamos el input
      app.searchTimeout = setTimeout(() => {
        // Solo buscar si hay al menos 3 caracteres o el campo está vacío (para resetear)
        if (val.length >= 3 || val.length === 0) {
          app.activeFilters.keyword = val;
          app.currentBatch = 0;
          filterMaps();
          renderMaps(true);
          updateActiveFilters();
          updateResultsCount();
          updateFilterCounts(); // Actualizar filtros inteligentes
        }
      }, app.debounceDelay); // Esperar 300ms (configurable) antes de buscar
    });
    
    // Navegación con teclado en autocompletado y Enter para buscar
    elements.keywordInput.addEventListener('keydown', (e) => {
      const dropdown = elements.autocompleteDropdown;
      const isDropdownVisible = dropdown && dropdown.style.display === 'block';
      
      // Manejar Enter cuando NO hay dropdown activo
      if (e.key === 'Enter' && !isDropdownVisible) {
        e.preventDefault();
        const trimmedValue = (e.target.value || '').trim();
        if (trimmedValue.length >= 3) {
          // Cancelar timeout de búsqueda en vivo
          clearTimeout(app.searchTimeout);
          // Ejecutar búsqueda inmediatamente
          handleSearch();
        }
        return;
      }
      
      // Resto del manejo solo si dropdown está visible
      if (!isDropdownVisible) return;
      
      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          navigateSuggestions('down');
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          navigateSuggestions('up');
          break;
          
        case 'Enter':
          e.preventDefault();
          const items = dropdown.querySelectorAll('.autocomplete-item');
          if (app.selectedSuggestionIndex >= 0 && 
              app.selectedSuggestionIndex < items.length) {
            const selectedText = items[app.selectedSuggestionIndex].textContent;
            selectSuggestion(selectedText);
          }
          break;
          
        case 'Escape':
          e.preventDefault();
          hideAutocomplete();
          break;
      }
    });
  }

  // Radio buttons de categoría
  if (elements.categoryFilters && elements.categoryFilters.length) {
    elements.categoryFilters.forEach(radio => {
      radio.addEventListener('change', () => {
        handleSearch();
        // 📊 TRACKING: Filtro de categoría aplicado
        trackFilterApplied('category', radio.value, app.filteredMaps.length);
      });
    });
  }
}

/**
 * Helper: configurar listeners de filtros avanzados
 */
function setupAdvancedFiltersListeners() {
  // Botón limpiar filtros avanzados (si existe)
  if (elements.clearAdvancedBtn) {
    elements.clearAdvancedBtn.addEventListener('click', clearAdvancedFilters);
  }

  // Configurar lógica de selección en cascada para filtros temporales PRIMERO
  // Esto maneja los listeners de cambio internamente
  setupCascadingTemporalFilters();

  // Configurar listeners en checkboxes de escala espacial (no temporal, ya manejados arriba)
  if (elements.advancedFilters.escalaEspacial) {
    elements.advancedFilters.escalaEspacial.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        // Obtener filtros actualizados y aplicar búsqueda automáticamente
        getAdvancedFilters();
        handleSearch();
        
        // 📊 TRACKING: Filtro espacial aplicado
        const activeFilters = Array.from(elements.advancedFilters.escalaEspacial)
          .filter(cb => cb.checked)
          .map(cb => cb.value);
        trackFilterApplied('escalaEspacial', activeFilters, app.filteredMaps.length);
      });
    });
  }
}

/**
 * Configura la lógica de selección en cascada para filtros temporales
 */
function setupCascadingTemporalFilters() {
  // Definir relaciones padre-hijo
  const parentChildRelations = {
    'Años censales': ['2001', '2010', '2022', 'Años anteriores'],
    'Periodos': ['1900-1950', '1950-1990', '1960-1970', '1970-1980', '1980-1990', '1990-2000', '2000-2010', '2010-2020', '2020-2030'],
    'Siglos': ['XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI']
  };

  // Configurar listeners para cada categoría padre
  Object.keys(parentChildRelations).forEach(parentValue => {
    const parentCheckbox = document.querySelector(`input[name="escalaTemporal"][value="${parentValue}"]`);
    const childValues = parentChildRelations[parentValue];
    
    if (!parentCheckbox) return;

    // Listener para el padre: selecciona/deselecciona todos los hijos
    parentCheckbox.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      
      childValues.forEach(childValue => {
        const childCheckbox = document.querySelector(`input[name="escalaTemporal"][value="${childValue}"]`);
        if (childCheckbox) {
          childCheckbox.checked = isChecked;
        }
      });
      
      // Aplicar filtros automáticamente después de la cascada
      getAdvancedFilters();
      handleSearch();
      
      // 📊 TRACKING: Filtro temporal (padre) aplicado
      const activeFilters = Array.from(document.querySelectorAll('input[name="escalaTemporal"]:checked'))
        .map(cb => cb.value);
      trackFilterApplied('escalaTemporal', activeFilters, app.filteredMaps.length);
    });

    // Listeners para los hijos: deselecciona el padre si algún hijo cambia
    childValues.forEach(childValue => {
      const childCheckbox = document.querySelector(`input[name="escalaTemporal"][value="${childValue}"]`);
      
      if (childCheckbox) {
        childCheckbox.addEventListener('change', () => {
          // Si se deselecciona un hijo, deseleccionar el padre
          if (!childCheckbox.checked) {
            parentCheckbox.checked = false;
          } else {
            // Si se selecciona un hijo, verificar si todos están seleccionados para marcar el padre
            const allChildrenChecked = childValues.every(cv => {
              const cb = document.querySelector(`input[name="escalaTemporal"][value="${cv}"]`);
              return cb && cb.checked;
            });
            
            if (allChildrenChecked) {
              parentCheckbox.checked = true;
            }
          }
          
          // Aplicar filtros automáticamente después del cambio
          getAdvancedFilters();
          handleSearch();
          
          // 📊 TRACKING: Filtro temporal (hijo) aplicado
          const activeFilters = Array.from(document.querySelectorAll('input[name="escalaTemporal"]:checked'))
            .map(cb => cb.value);
          trackFilterApplied('escalaTemporal', activeFilters, app.filteredMaps.length);
        });
      }
    });
  });
}

// ==================== HISTORIAL DE BÚSQUEDAS ====================

/**
 * Actualiza la visualización del botón de historial según si hay búsquedas guardadas
 */
function updateHistoryButtonVisibility() {
  if (!elements.historyBtn || !SearchHistory) return;
  
  if (SearchHistory.hasHistory()) {
    elements.historyBtn.style.display = 'inline-flex';
  } else {
    elements.historyBtn.style.display = 'none';
    hideSearchHistory();
  }
}

/**
 * Renderiza la lista de búsquedas recientes
 */
function renderSearchHistory() {
  if (!elements.searchHistoryList || !SearchHistory) return;
  
  const history = SearchHistory.get();
  
  // Limpiar lista actual
  elements.searchHistoryList.innerHTML = '';
  
  if (history.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'search-history-item';
    emptyItem.style.cssText = 'cursor: default; color: #999; font-style: italic;';
    emptyItem.textContent = 'No hay búsquedas recientes';
    elements.searchHistoryList.appendChild(emptyItem);
    return;
  }
  
  // Crear items para cada búsqueda
  history.forEach(query => {
    const li = document.createElement('li');
    li.className = 'search-history-item';
    
    const icon = document.createElement('i');
    icon.className = 'bx bx-search-alt';
    
    const text = document.createElement('span');
    text.textContent = query;
    
    li.appendChild(icon);
    li.appendChild(text);
    
    // Al hacer click, ejecutar esa búsqueda
    li.addEventListener('click', () => {
      elements.keywordInput.value = query;
      hideSearchHistory();
      handleSearch();
      
      // 📊 TRACKING: Click en historial de búsqueda
      trackSearchHistory('click', query);
    });
    
    elements.searchHistoryList.appendChild(li);
  });
}

/**
 * Muestra el dropdown del historial
 */
function showSearchHistory() {
  if (!elements.searchHistoryDropdown) return;
  
  renderSearchHistory();
  elements.searchHistoryDropdown.style.display = 'block';
  
  if (elements.historyBtn) {
    elements.historyBtn.classList.add('active');
  }
  
  // 📊 TRACKING: Ver historial de búsqueda
  trackSearchHistory('view');
}

/**
 * Oculta el dropdown del historial
 */
function hideSearchHistory() {
  if (!elements.searchHistoryDropdown) return;
  
  elements.searchHistoryDropdown.style.display = 'none';
  
  if (elements.historyBtn) {
    elements.historyBtn.classList.remove('active');
  }
}

/**
 * Toggle del dropdown del historial
 */
function toggleSearchHistory() {
  if (!elements.searchHistoryDropdown) return;
  
  const isVisible = elements.searchHistoryDropdown.style.display === 'block';
  
  if (isVisible) {
    hideSearchHistory();
  } else {
    showSearchHistory();
  }
}

/**
 * Limpia todo el historial de búsquedas
 */
/**
 * Limpia todo el historial de búsquedas
 */
function clearSearchHistory() {
  if (!SearchHistory) return;
  
  SearchHistory.clear();
  renderSearchHistory();
  updateHistoryButtonVisibility();
  
  // 📊 TRACKING: Limpiar historial
  trackSearchHistory('clear');
}

/**
 * Guarda la búsqueda actual en el historial
 * @param {string} query - Término de búsqueda a guardar
 */
function saveSearchToHistory(query) {
  if (!SearchHistory || !query || query.trim().length < 3) return;
  
  SearchHistory.save(query.trim());
  updateHistoryButtonVisibility();
}

/**
 * Configura los event listeners del historial de búsquedas
 */
function setupSearchHistoryListeners() {
  if (!elements.historyBtn || !SearchHistory) return;
  
  // Botón para mostrar/ocultar historial
  elements.historyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSearchHistory();
  });
  
  // Botón para limpiar historial
  if (elements.clearHistoryBtn) {
    elements.clearHistoryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearSearchHistory();
    });
  }
  
  // Cerrar dropdown al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!elements.searchHistoryDropdown) return;
    
    const isClickInside = elements.searchHistoryDropdown.contains(e.target) ||
                         elements.historyBtn.contains(e.target);
    
    if (!isClickInside) {
      hideSearchHistory();
    }
  });
  
  // Inicializar visibilidad del botón
  updateHistoryButtonVisibility();
}

/**
 * Configura todos los event listeners
 */
function setupEventListeners() {
  setupSearchListeners();
  setupAdvancedFiltersListeners();
  setupSearchHistoryListeners();

  // Botón cargar más
  if (elements.loadMoreBtn) {
    elements.loadMoreBtn.addEventListener('click', loadMoreMaps);
  }

  // Limpiar todos los filtros
  if (elements.clearFiltersBtn) {
    elements.clearFiltersBtn.addEventListener('click', clearAllFilters);
  }
}

// ==================== SUGERENCIAS DE BÚSQUEDA ====================

/**
 * Obtiene los términos más populares del índice de búsqueda
 * @param {number} limit - Cantidad máxima de términos a retornar
 * @returns {Array<{term: string, count: number}>} - Array de términos ordenados por popularidad
 */
function getPopularTerms(limit = 10) {
  if (!app.searchIndex || Object.keys(app.searchIndex).length === 0) {
    return [];
  }

  const terms = Object.keys(app.searchIndex)
    .filter(term => term.length >= 4) // Solo términos de 4+ caracteres
    .map(term => ({
      term: term,
      count: app.searchIndex[term].mapIndices.length
    }))
    .sort((a, b) => b.count - a.count) // Ordenar por popularidad (más mapas primero)
    .slice(0, limit);

  return terms;
}

/**
 * Encuentra términos similares usando distancia de Levenshtein
 * @param {string} searchTerm - Término de búsqueda original
 * @param {number} maxDistance - Distancia máxima de Levenshtein permitida
 * @param {number} limit - Cantidad máxima de sugerencias
 * @returns {Array<{term: string, distance: number, count: number}>} - Array de términos similares
 */
function getSimilarTerms(searchTerm, maxDistance = 2, limit = 5) {
  if (!searchTerm || !app.searchIndex || Object.keys(app.searchIndex).length === 0) {
    return [];
  }

  const normalized = normalizeText(searchTerm);
  const similar = [];

  // Buscar términos similares en el índice
  for (const term in app.searchIndex) {
    // Evitar sugerir el término exacto
    if (term === normalized) continue;

    const distance = levenshteinDistance(normalized, term);
    
    if (distance > 0 && distance <= maxDistance) {
      similar.push({
        term: term,
        distance: distance,
        count: app.searchIndex[term].mapIndices.length
      });
    }
  }

  // Ordenar por: menor distancia primero, luego por popularidad
  similar.sort((a, b) => {
    if (a.distance !== b.distance) {
      return a.distance - b.distance;
    }
    return b.count - a.count;
  });

  return similar.slice(0, limit);
}

/**
 * Genera sugerencias de búsqueda alternativas
 * @param {string} searchTerm - Término de búsqueda que no tuvo resultados
 * @param {number} maxSuggestions - Cantidad máxima de sugerencias
 * @returns {Array<string>} - Array de términos sugeridos
 */
function generateSearchSuggestions(searchTerm, maxSuggestions = 5) {
  const suggestions = [];
  
  // 1. Buscar términos similares (typos, variaciones)
  const similar = getSimilarTerms(searchTerm, 2, 3);
  similar.forEach(item => {
    if (suggestions.length < maxSuggestions) {
      suggestions.push(item.term);
    }
  });

  // 2. Si aún hay espacio, agregar términos populares
  if (suggestions.length < maxSuggestions) {
    const popular = getPopularTerms(10);
    for (const item of popular) {
      if (suggestions.length >= maxSuggestions) break;
      // No agregar si ya está en sugerencias
      if (!suggestions.includes(item.term)) {
        suggestions.push(item.term);
      }
    }
  }

  // Limitar a maxSuggestions
  return suggestions.slice(0, maxSuggestions);
}

/**
 * Muestra sugerencias de búsqueda cuando no hay resultados
 * @param {string} searchTerm - Término de búsqueda original
 */
function showSearchSuggestions(searchTerm) {
  if (!elements.resultsGrid) return;

  const suggestions = generateSearchSuggestions(searchTerm, 5);
  
  if (suggestions.length === 0) {
    // Sin sugerencias, solo mostrar mensaje básico
    elements.resultsGrid.innerHTML = `
      <div class="no-results-message">
        <i class='bx bx-search-alt' style="font-size: 48px; color: #999; margin-bottom: 16px;"></i>
        <p style="font-size: 18px; color: #333; margin-bottom: 8px;">No se encontraron resultados para "<strong>${escapeHTML(searchTerm)}</strong>"</p>
        <p style="font-size: 14px; color: #666;">Intenta con otros términos de búsqueda o utiliza los filtros.</p>
      </div>
    `;
    return;
  }

  // Crear HTML con sugerencias clickeables
  const suggestionLinks = suggestions.map(term => {
    return `<a href="#" class="suggestion-link" data-suggestion="${escapeHTML(term)}">${escapeHTML(term)}</a>`;
  }).join('');

  elements.resultsGrid.innerHTML = `
    <div class="no-results-message">
      <i class='bx bx-search-alt' style="font-size: 48px; color: #999; margin-bottom: 16px;"></i>
      <p style="font-size: 18px; color: #333; margin-bottom: 8px;">No se encontraron resultados para "<strong>${escapeHTML(searchTerm)}</strong>"</p>
      <p style="font-size: 14px; color: #666; margin-bottom: 16px;">¿Quizás buscabas?</p>
      <div class="suggestions-container">
        ${suggestionLinks}
      </div>
    </div>
  `;

  // Agregar event listeners a las sugerencias
  const suggestionElements = elements.resultsGrid.querySelectorAll('.suggestion-link');
  suggestionElements.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const suggestedTerm = link.getAttribute('data-suggestion');
      
      // 📊 TRACKING: Click en sugerencia de búsqueda
      // Determinar tipo de sugerencia basándose en distancia Levenshtein
      const similarTerms = getSimilarTerms(searchTerm, 2, 5);
      const suggestionType = similarTerms.some(t => t.term === suggestedTerm) ? 'similar' : 'popular';
      trackSearchSuggestion(searchTerm, suggestedTerm, suggestionType);
      
      // Cargar el término en el input y ejecutar búsqueda
      elements.keywordInput.value = suggestedTerm;
      handleSearch();
      
      // Scroll al inicio de resultados
      elements.resultsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/**
 * Helper para escapar HTML y prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} - Texto escapado
 */
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Normaliza texto (quita acentos, convierte a minúsculas)
 * @param {string} text - Texto a normalizar
 * @returns {string} - Texto normalizado
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/ñ/g, 'n')              // Normalizar ñ
    .replace(/Ñ/g, 'n')              // Normalizar Ñ
    .toLowerCase()
    .trim();
}

/**
 * Sanitiza el input del usuario para prevenir comportamientos erráticos
 * @param {string} input - Texto ingresado por el usuario
 * @param {number} maxLength - Longitud máxima permitida (por defecto 150)
 * @returns {Object} - {sanitized: string, valid: boolean, error: string|null}
 */
function sanitizeInput(input, maxLength = 150) {
  // Validar que el input sea string
  if (typeof input !== 'string') {
    return {
      sanitized: '',
      valid: false,
      error: 'El texto debe ser una cadena de caracteres válida'
    };
  }

  // Paso 1: Limpiar caracteres de control y prevenir inyección
  // Remover caracteres de control ASCII (0-31 excepto espacios) y DEL (127)
  let sanitized = input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Paso 2: Remover caracteres especiales peligrosos (mantener letras, números, espacios, guiones, paréntesis)
  // Permite: letras (cualquier idioma), números, espacios, guiones, paréntesis, comas, puntos
  sanitized = sanitized.replace(/[^\p{L}\p{N}\s\-_(),.áéíóúüñÁÉÍÓÚÜÑ]/gu, '');
  
  // Paso 3: Normalizar múltiples espacios a uno solo
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  // Paso 4: Eliminar espacios al inicio y final
  sanitized = sanitized.trim();
  
  // Paso 5: Limitar longitud
  if (sanitized.length > maxLength) {
    return {
      sanitized: sanitized.substring(0, maxLength),
      valid: false,
      error: `La búsqueda es demasiado larga. Máximo ${maxLength} caracteres. Se truncó a: "${sanitized.substring(0, maxLength)}"`
    };
  }
  
  // Validar que el resultado no esté vacío
  if (sanitized.length === 0 && input.length > 0) {
    return {
      sanitized: '',
      valid: false,
      error: 'El texto contiene solo caracteres no válidos. Use solo letras, números y espacios.'
    };
  }
  
  // Paso 6: Validar longitud mínima (requerido para búsqueda)
  if (sanitized.length > 0 && sanitized.length < 3) {
    return {
      sanitized: sanitized,
      valid: false,
      error: 'La búsqueda debe tener al menos 3 caracteres'
    };
  }
  
  // Todo OK
  return {
    sanitized: sanitized,
    valid: true,
    error: null
  };
}

/**
 * Muestra un mensaje de error en el campo de búsqueda
 * @param {string} message - Mensaje de error a mostrar
 */
function showInputError(message) {
  if (!elements.keywordInput || !message) return;
  
  // Buscar o crear elemento de error
  let errorElement = document.getElementById('search-input-error');
  
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.id = 'search-input-error';
    errorElement.style.cssText = `
      position: absolute;
      top: -45px;
      left: 0;
      right: 0;
      color: white;
      font-size: 0.875rem;
      padding: 0.5rem 0.75rem;
      background: #dc3545;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
      z-index: 1001;
      animation: slideDown 0.3s ease-out;
    `;
    
    // Insertar dentro del contenedor del input (que debe ser relativo)
    const inputGroup = elements.keywordInput.closest('.input-group') || 
                      elements.keywordInput.parentElement;
    if (inputGroup) {
      // Asegurar que el contenedor sea relativo
      inputGroup.style.position = 'relative';
      inputGroup.appendChild(errorElement);
    }
  }
  
  errorElement.innerHTML = `
    <i class='bx bx-error-circle' style='font-size: 1.2rem;'></i>
    <span>${message}</span>
  `;
  errorElement.style.display = 'flex';
  
  // Marcar el input como inválido
  elements.keywordInput.style.borderColor = '#dc3545';
}

/**
 * Limpia el mensaje de error del campo de búsqueda
 */
function clearInputError() {
  const errorElement = document.getElementById('search-input-error');
  const warningElement = document.getElementById('search-typo-warning');
  
  if (errorElement) {
    errorElement.style.display = 'none';
  }
  
  if (warningElement) {
    warningElement.style.display = 'none';
  }
  
  if (elements.keywordInput) {
    elements.keywordInput.style.borderColor = '';
  }
}

/**
 * Detecta si hay resultados por fuzzy match pero posibles errores de escritura
 * @param {string} keyword - Palabra clave buscada
 */
function detectTypoSuggestion(keyword) {
  // Solo verificar si:
  // 1. Hay keyword de búsqueda
  // 2. Hay resultados encontrados (por fuzzy match)
  // 3. Fuzzy match está activado
  if (!keyword || app.filteredMaps.length === 0 || !app.fuzzyMatch) {
    return;
  }
  
  const normalizedKeyword = normalizeText(keyword);
  const searchTerms = normalizedKeyword.trim().split(/\s+/);
  
  // Verificar si TODOS los términos tienen coincidencia exacta
  let allExactMatches = true;
  
  for (const term of searchTerms) {
    let hasExactMatch = false;
    
    // Buscar en los resultados filtrados si alguno tiene coincidencia exacta
    for (const map of app.filteredMaps) {
      const searchableFields = [
        map.title_search || normalizeText(normalizeMapData(map).title),
        ...(map.keywords_search || normalizeMapData(map).keywords.map(k => normalizeText(k)))
      ];
      
      // Verificar si el término existe como PALABRA COMPLETA en algún campo
      if (searchableFields.some(field => isWholeWordMatch(term, field))) {
        hasExactMatch = true;
        break;
      }
    }
    
    // Si al menos un término no tiene coincidencia exacta
    if (!hasExactMatch) {
      allExactMatches = false;
      break;
    }
  }
  
  // Si NO todos tienen coincidencia exacta, pero SÍ hay resultados (fuzzy match)
  // entonces sugerir verificar la escritura
  if (!allExactMatches && app.filteredMaps.length > 0) {
    showTypoWarning();
  }
}

/**
 * Muestra advertencia de posible error de escritura
 */
function showTypoWarning() {
  if (!elements.keywordInput) return;
  
  // Buscar o crear elemento de advertencia
  let warningElement = document.getElementById('search-typo-warning');
  
  if (!warningElement) {
    warningElement = document.createElement('div');
    warningElement.id = 'search-typo-warning';
    warningElement.style.cssText = `
      position: absolute;
      top: -45px;
      left: 0;
      right: 0;
      color: #856404;
      font-size: 0.875rem;
      padding: 0.5rem 0.75rem;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);
      z-index: 1001;
      animation: slideDown 0.3s ease-out;
    `;
    
    // Insertar dentro del contenedor del input
    const inputGroup = elements.keywordInput.closest('.input-group') || 
                      elements.keywordInput.parentElement;
    if (inputGroup) {
      inputGroup.style.position = 'relative';
      inputGroup.appendChild(warningElement);
    }
  }
  
  warningElement.innerHTML = `
    <i class='bx bx-info-circle' style='font-size: 1.2rem;'></i>
    <span>Verifique la ortografía de su búsqueda. Se encontraron resultados aproximados.</span>
  `;
  warningElement.style.display = 'flex';
  
  // Auto-ocultar después de 5 segundos
  setTimeout(() => {
    if (warningElement) {
      warningElement.style.display = 'none';
    }
  }, 5000);
}

/**
 * Calcula la distancia de Levenshtein entre dos strings
 * @param {string} str1 - Primer string
 * @param {string} str2 - Segundo string
 * @returns {number} - Distancia de Levenshtein
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Crear matriz de distancias
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
  
  // Inicializar primera fila y columna
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  
  // Calcular distancias
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // Eliminación
        matrix[i][j - 1] + 1,      // Inserción
        matrix[i - 1][j - 1] + cost // Sustitución
      );
    }
  }
  
  return matrix[len1][len2];
}

/**
 * Verifica si un término existe como palabra completa en un campo
 * Usa límites de palabra para evitar coincidencias parciales (ej: "rio" no coincide con "frio")
 * @param {string} term - Término de búsqueda normalizado
 * @param {string} field - Campo de búsqueda normalizado
 * @returns {boolean} - true si el término existe como palabra completa
 */
function isWholeWordMatch(term, field) {
  // Crear regex que busque el término como palabra completa
  // \b es límite de palabra, escapamos caracteres especiales del término
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escapedTerm}\\b`, 'i');
  return regex.test(field);
}

/**
 * Verifica si un término coincide con un campo usando búsqueda difusa
 * ACTUALIZADO: Busca palabras completas, no fragmentos dentro de otras palabras
 * @param {string} term - Término de búsqueda normalizado
 * @param {string} field - Campo de búsqueda normalizado
 * @param {number} threshold - Umbral de distancia (por defecto 2)
 * @returns {Object} - {match: boolean, score: number, type: 'exact'|'fuzzy', percentage: number}
 */
function fuzzyMatch(term, field, threshold = 2) {
  // 1. Verificar coincidencia exacta como PALABRA COMPLETA (no fragmento)
  if (isWholeWordMatch(term, field)) {
    return { match: true, score: 0, type: 'exact', percentage: 100 };
  }
  
  // 2. Solo aplicar búsqueda difusa a palabras de 5+ caracteres
  // Palabras cortas (1-4 chars) requieren coincidencia exacta
  if (term.length < 5) {
    return { match: false, score: Infinity, type: 'none', percentage: 0 };
  }
  
  // 3. Dividir el campo en palabras para comparar
  const words = field.split(/\s+/);
  let bestMatch = { match: false, score: Infinity, type: 'none', percentage: 0 };
  
  for (const word of words) {
    // Solo comparar con palabras de longitud similar (±2 caracteres)
    if (Math.abs(word.length - term.length) > threshold) {
      continue;
    }
    
    const distance = levenshteinDistance(term, word);
    
    // Si la distancia está dentro del umbral, es una coincidencia difusa
    if (distance <= threshold && distance < bestMatch.score) {
      // Calcular porcentaje de similitud: 100% - (distancia / longitud_max * 100)
      const maxLength = Math.max(term.length, word.length);
      const percentage = Math.round(((maxLength - distance) / maxLength) * 100);
      
      bestMatch = { match: true, score: distance, type: 'fuzzy', percentage };
    }
  }
  
  return bestMatch;
}

/**
 * Calcula el score de relevancia de un mapa respecto a los términos de búsqueda
 * @param {Object} map - Objeto mapa
 * @param {Array<string>} searchTerms - Términos de búsqueda normalizados
 * @returns {Object} - {score: number, percentage: number, matches: Object}
 */
function calculateRelevanceScore(map, searchTerms) {
  const normalizedMap = normalizeMapData(map);
  
  // Pesos por campo (título tiene mayor peso)
  const WEIGHTS = {
    title: 5,      // Mayor peso para título (antes era 3)
    keywords: 2
  };
  
  let totalScore = 0;
  let totalWeight = 0;
  let matchDetails = {
    title: [],
    keywords: []
  };
  
  // Campos normalizados
  const titleField = map.title_search || normalizeText(normalizedMap.title);
  const keywordFields = map.keywords_search || normalizedMap.keywords.map(k => normalizeText(k));
  
  // Detectar si el título completo coincide exactamente
  const fullSearchText = searchTerms.join(' ');
  const isTitleExactMatch = titleField === fullSearchText || titleField.includes(fullSearchText);
  
  // Si el título coincide exactamente con toda la búsqueda, retornar 100%
  if (isTitleExactMatch && searchTerms.length > 1) {
    return {
      score: WEIGHTS.title * 100,
      percentage: 100,
      matches: {
        title: [{
          term: fullSearchText,
          type: 'exact',
          percentage: 100,
          score: WEIGHTS.title * 100
        }],
        keywords: []
      },
      hasExactMatch: true
    };
  }
  
  searchTerms.forEach(term => {
    // Buscar en título (peso 5x)
    const titleMatch = fuzzyMatch(term, titleField);
    if (titleMatch.match) {
      const fieldScore = titleMatch.percentage * WEIGHTS.title;
      totalScore += fieldScore;
      totalWeight += WEIGHTS.title * 100; // 100% máximo por término
      matchDetails.title.push({
        term,
        type: titleMatch.type,
        percentage: titleMatch.percentage,
        score: fieldScore
      });
    }
    
    // Buscar en keywords (peso 2x)
    let bestKeywordMatch = { match: false, percentage: 0, type: 'none' };
    for (const keywordField of keywordFields) {
      const keywordMatch = fuzzyMatch(term, keywordField);
      if (keywordMatch.match && keywordMatch.percentage > bestKeywordMatch.percentage) {
        bestKeywordMatch = keywordMatch;
      }
    }
    
    if (bestKeywordMatch.match) {
      const fieldScore = bestKeywordMatch.percentage * WEIGHTS.keywords;
      totalScore += fieldScore;
      totalWeight += WEIGHTS.keywords * 100;
      matchDetails.keywords.push({
        term,
        type: bestKeywordMatch.type,
        percentage: bestKeywordMatch.percentage,
        score: fieldScore
      });
    }
  });
  
  // Calcular porcentaje global de relevancia
  let percentage = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
  
  // Si todos los términos tienen coincidencia exacta en el título, asegurar 100%
  const allTermsExactInTitle = searchTerms.length > 0 && 
    searchTerms.every(term => 
      matchDetails.title.some(m => m.term === term && m.type === 'exact')
    );
  
  if (allTermsExactInTitle) {
    percentage = 100;
    totalScore = WEIGHTS.title * 100 * searchTerms.length;
  }
  
  return {
    score: totalScore,
    percentage,
    matches: matchDetails,
    hasExactMatch: [...matchDetails.title, ...matchDetails.keywords].some(m => m.type === 'exact')
  };
}

/**
 * Maneja la búsqueda y filtrado
 */
function handleSearch() {
  // Capturar valores de búsqueda
  const rawKeyword = elements.keywordInput.value || '';
  
  // Sanitizar el keyword
  const sanitizationResult = sanitizeInput(rawKeyword);
  const keyword = sanitizationResult.sanitized;
  
  // Si el input no es válido, mostrar error y no continuar
  if (!sanitizationResult.valid && keyword.length > 0) {
    showInputError(sanitizationResult.error);
    return;
  }
  
  // Limpiar error si todo está bien
  clearInputError();
  
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
  
  // Actualizar contadores de filtros
  updateFilterCounts();
  
  // Detectar si hay resultados por fuzzy match pero posibles errores de escritura
  detectTypoSuggestion(keyword);
  
  // Guardar en historial si la búsqueda fue exitosa y tiene keyword
  if (keyword && keyword.length >= 3) {
    saveSearchToHistory(keyword);
  }
  
  // 📊 TRACKING: Enviar evento de búsqueda a Google Analytics
  if (keyword && keyword.length >= 3) {
    trackSearch(keyword, app.filteredMaps.length, category, app.activeFilters.advanced);
  }
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
  } else {
    // Actualizar contadores aunque no haya filtros activos
    updateFilterCounts();
  }
}

/**
 * Helper: obtener datos del mapa normalizados
 * @param {Object} map - Objeto mapa
 * @returns {Object} - Datos normalizados del mapa
 */
function normalizeMapData(map) {
  return {
    category: map.section || map.categoria || '',
    title: map.title || map.titulo || '',
    keywords: Array.isArray(map.keywords)
      ? map.keywords
      : (typeof map.keywords === 'string'
        ? map.keywords.split(';').map(k => k.trim()).filter(Boolean)
        : (map.keywords || [])),
    image: map.image || map.ruta_imagen || '',
    download: map.download || map.download_link || map.ruta_descarga || '',
    author: map.author || map.autor || '',
    year: map.year || map.año || '',
    publication: map.publication || map.publicacion || '',
    link: map.link || map.enlace || ''
  };
}

/**
 * Filtra los mapas según criterios actuales
 */
function filterMaps() {
  console.time('🔍 Tiempo de búsqueda');
  const searchStartTime = performance.now();
  
  const { keyword, category, advanced } = app.activeFilters;
  
  // Si hay keyword pero no cumple longitud mínima, mostrar todos los mapas
  const effectiveKeyword = (keyword && keyword.trim().length >= 3) ? keyword : '';
  
  // OPTIMIZACIÓN: Si hay búsqueda de texto y el índice está disponible, usar búsqueda indexada
  let candidateMaps = app.allMaps;
  
  // Solo usar índice para búsquedas >= 5 caracteres (para palabras más largas)
  // Búsquedas cortas (3-4 chars) usan búsqueda completa con fuzzy match
  if (effectiveKeyword && effectiveKeyword.trim().length >= 5 && Object.keys(app.searchIndex).length > 0) {
    // Usar búsqueda indexada O(1) por término
    candidateMaps = searchUsingIndex(effectiveKeyword.trim());
  }

  app.filteredMaps = candidateMaps.filter(map => {
    const normalizedMap = normalizeMapData(map);

    // Filtrar por categoría rápida
    if (category !== 'Todos' && normalizedMap.category !== category) {
      return false;
    }

    // Filtrar por keyword si existe y cumple longitud mínima
    if (effectiveKeyword) {
      // Usar keywords_search normalizado si existe, sino normalizar manualmente
      const searchableFields = [
        map.title_search || normalizeText(normalizedMap.title),
        ...(map.keywords_search || normalizedMap.keywords.map(k => normalizeText(k)))
      ];

      // Dividir la búsqueda en términos individuales
      const searchTerms = effectiveKeyword.trim().split(/\s+/).map(term => normalizeText(term));

      // Verificar coincidencias según configuración de búsqueda difusa
      let allTermsMatch;
      
      if (app.fuzzyMatch) {
        // Usar búsqueda difusa con priorización
        allTermsMatch = searchTerms.every(term => {
          let hasExactMatch = false;
          let hasFuzzyMatch = false;
          
          for (const field of searchableFields) {
            const result = fuzzyMatch(term, field);
            
            if (result.type === 'exact') {
              hasExactMatch = true;
              break; // Coincidencia exacta encontrada, no buscar más
            } else if (result.type === 'fuzzy') {
              hasFuzzyMatch = true;
            }
          }
          
          // Priorizar coincidencias exactas, pero aceptar difusas si no hay exactas
          return hasExactMatch || hasFuzzyMatch;
        });
      } else {
        // Usar búsqueda exacta tradicional con palabras completas
        allTermsMatch = searchTerms.every(term => 
          searchableFields.some(field => isWholeWordMatch(term, field))
        );
      }

      if (!allTermsMatch) {
        return false;
      }
      
      // Si está activado el sistema de ponderación, calcular score de relevancia
      if (app.visualMatch && app.fuzzyMatch) {
        const relevance = calculateRelevanceScore(map, searchTerms);
        map._relevance = relevance; // Guardar temporalmente el score
      } else {
        map._relevance = null; // Limpiar score si no está activo
      }
    } else {
      map._relevance = null; // Sin búsqueda, sin relevancia
    }

    // Filtrar por escala espacial (usando space_search con lógica OR)
    if (advanced.escalaEspacial.length > 0) {
      const mapSpaceSearch = map.space_search || [];
      // Normalizar los filtros seleccionados
      const normalizedFilters = advanced.escalaEspacial.map(f => normalizeText(f));
      
      // Al menos UNO de los filtros debe coincidir (OR lógico)
      const hasMatch = normalizedFilters.some(filter => 
        mapSpaceSearch.some(space => space.includes(filter) || filter.includes(space))
      );

      if (!hasMatch) {
        return false;
      }
    }

    // Filtrar por escala temporal con lógica híbrida (OR dentro de grupos, AND entre grupos)
    if (advanced.escalaTemporal.length > 0) {
      const mapTimeSearch = map.time_search || [];
      const normalizedFilters = advanced.escalaTemporal.map(f => normalizeText(f));
      
      // Definir categorías padre y sus hijos
      const parentCategories = {
        'anos censales': ['2001', '2010', '2022', 'anos anteriores'],
        'periodos': ['1900-1950', '1950-1990', '1960-1970', '1970-1980', '1980-1990', '1990-2000', '2000-2010', '2010-2020', '2020-2030'],
        'siglos': ['xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx', 'xxi']
      };

      // Clasificar filtros seleccionados por grupo
      const filtersByGroup = {
        'anos censales': [],
        'periodos': [],
        'siglos': []
      };

      normalizedFilters.forEach(filter => {
        // Primero verificar si es una categoría padre
        if (filter === 'anos censales' || filter === 'periodos' || filter === 'siglos') {
          // NO agregamos la categoría padre a los filtros
          // La cascada ya se encargó de seleccionar todos los hijos
          // Ignoramos esta etiqueta padre para no causar 0 resultados
          return;
        } else {
          // Si no, buscar en qué grupo pertenece
          let assigned = false;
          for (const [parent, children] of Object.entries(parentCategories)) {
            if (children.includes(filter)) {
              filtersByGroup[parent].push(filter);
              assigned = true;
              break;
            }
          }
          
          if (!assigned) {
            console.warn('Filtro temporal no clasificado:', filter);
          }
        }
      });

      // Evaluar cada grupo: dentro del grupo usa OR, entre grupos usa AND
      const groupResults = [];

      // NO evaluamos categorías padre directamente
      // Solo evaluamos los hijos que ya fueron seleccionados por la cascada

      // Evaluar cada grupo de hijos
      for (const [groupName, filters] of Object.entries(filtersByGroup)) {
        if (filters.length === 0) continue;

        // Dentro del grupo: OR (al menos uno debe coincidir con coincidencia exacta)
        const groupMatch = filters.some(filter => 
          mapTimeSearch.some(time => time === filter)
        );
        
        groupResults.push(groupMatch);
      }

      // Entre grupos: AND (todos los grupos con filtros deben coincidir)
      const allGroupsMatch = groupResults.length === 0 || groupResults.every(result => result === true);

      if (!allGroupsMatch) {
        return false;
      }
    }

    // Si pasó todos los filtros, incluir en resultados
    return true;
  });
  
  // Ordenar por relevancia si está activo el sistema de ponderación
  if (app.visualMatch && app.fuzzyMatch && keyword) {
    app.filteredMaps.sort((a, b) => {
      const aRel = a._relevance || { score: 0, hasExactMatch: false };
      const bRel = b._relevance || { score: 0, hasExactMatch: false };
      
      // Priorizar coincidencias exactas
      if (aRel.hasExactMatch && !bRel.hasExactMatch) return -1;
      if (!aRel.hasExactMatch && bRel.hasExactMatch) return 1;
      
      // Luego ordenar por score
      return bRel.score - aRel.score;
    });
  }
  
  // Registrar métricas de rendimiento
  const searchEndTime = performance.now();
  const searchTime = searchEndTime - searchStartTime;
  app.performanceMetrics.lastSearchTime = searchTime;
  app.performanceMetrics.totalSearches++;
  app.performanceMetrics.averageSearchTime = 
    ((app.performanceMetrics.averageSearchTime * (app.performanceMetrics.totalSearches - 1)) + searchTime) / app.performanceMetrics.totalSearches;
  
  console.timeEnd('🔍 Tiempo de búsqueda');
  /* console.log(`⚡ Búsqueda completada en ${searchTime.toFixed(2)}ms (promedio: ${app.performanceMetrics.averageSearchTime.toFixed(2)}ms) | Resultados: ${app.filteredMaps.length}`); */
}

/**
 * Realiza búsqueda utilizando el índice invertido (O(1) por término)
 * Compatible con la estructura optimizada (Uint16Array)
 * @param {string} searchValue - Texto de búsqueda
 * @returns {Array} Array de mapas candidatos
 */
function searchUsingIndex(searchValue) {
  const normalizedSearch = normalizeText(searchValue);
  const searchTerms = normalizedSearch.split(/\s+/).filter(term => term.length > 0);
  
  if (searchTerms.length === 0) {
    return app.allMaps;
  }

  // Conjuntos de índices de mapas que contienen cada término
  const termSets = [];
  
  searchTerms.forEach(term => {
    const matchingIndices = new Set();
    
    // 1. Buscar coincidencia exacta en el índice
    if (app.searchIndex[term]) {
      // mapIndices ahora es Uint16Array, pero es iterable igual que Array
      app.searchIndex[term].mapIndices.forEach(idx => matchingIndices.add(idx));
    }
    
    // 2. Si fuzzyMatch está activado, buscar similares con umbral adaptativo
    if (app.fuzzyMatch && term.length >= 3) {
      // Umbral adaptativo según longitud del término
      const threshold = term.length <= 4 ? 1 : 2;
      
      Object.keys(app.searchIndex).forEach(indexedTerm => {
        const distance = levenshteinDistance(term, indexedTerm);
        if (distance > 0 && distance <= threshold) {
          app.searchIndex[indexedTerm].mapIndices.forEach(idx => matchingIndices.add(idx));
        }
      });
    }
    
    if (matchingIndices.size > 0) {
      termSets.push(matchingIndices);
    }
  });

  // Si no hay resultados para algún término, retornar vacío
  if (termSets.length === 0) {
    return [];
  }
  
  // Intersección: todos los términos deben estar presentes
  let resultIndices = termSets[0];
  for (let i = 1; i < termSets.length; i++) {
    resultIndices = new Set([...resultIndices].filter(idx => termSets[i].has(idx)));
  }

  // Convertir índices a objetos de mapa
  return Array.from(resultIndices).map(index => app.allMaps[index]);
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
  const normalizedMap = normalizeMapData(map);

  miniatura.className = 'flex-item';
  miniatura.setAttribute('data-index', index);

  if (map.id) {
    miniatura.setAttribute('data-id', map.id);
  }

  // Construir indicador de relevancia si está activo
  let relevanceIndicator = '';
  if (app.visualMatch && map._relevance && map._relevance.percentage > 0) {
    const percentage = map._relevance.percentage;
    let color = '#dc3545'; // Rojo por defecto
    let label = 'Baja';
    
    if (percentage === 100) {
      color = '#28a745'; // Verde oscuro - Coincidencia perfecta
      label = 'Perfecta';
    } else if (percentage >= 80) {
      color = '#84e184'; // Verde lima - Muy alta
      label = 'Muy Alta';
    } else if (percentage >= 50) {
      color = '#ffc107'; // Amarillo - Media
      label = 'Media';
    }
    // Else: Rojo - Baja (< 50%)
    
    relevanceIndicator = `
      <div class="relevance-indicator" style="
        position: absolute;
        top: 8px;
        right: 8px;
        background: ${color};
        color: ${percentage === 100 || percentage >= 80 ? 'white' : percentage >= 50 ? '#856404' : 'white'};
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        z-index: 10;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      " title="Relevancia: ${label} (${percentage}%)">
        ${percentage}%
      </div>
    `;
  }

  miniatura.innerHTML = `
    <a href="#" title="${normalizedMap.title}" data-tracking-category="maps" data-tracking-action="click" data-tracking-label="${normalizedMap.title}">
      <div class="icon-box" style="position: relative;">
        ${relevanceIndicator}
        <div class="icon">
          <img src="${normalizedMap.image}" alt="${normalizedMap.title}" loading="lazy">
        </div>
        <h5>${normalizedMap.title}</h5>
      </div>
    </a>
  `;

  // Event listener para abrir modal
  const link = miniatura.querySelector('a');
  link.addEventListener('click', (e) => {
    e.preventDefault();
    // Si hay id, abrir modal usando id para garantizar unicidad
    const modalId = map.id ? map.id : index;
    openMapModal(modalId);
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
  
  // Si no hay resultados y hay búsqueda activa, mostrar sugerencias
  if (app.filteredMaps.length === 0 && app.activeFilters.keyword) {
    showSearchSuggestions(app.activeFilters.keyword);
  }
}

/**
 * Helper: crear etiqueta de filtro activo
 * @param {string} type - Tipo de filtro
 * @param {string} value - Valor del filtro
 * @param {string} displayName - Nombre a mostrar
 * @returns {HTMLElement} - Elemento div de la etiqueta
 */
function createFilterTag(type, value, displayName) {
  const tag = document.createElement('div');
  tag.className = 'filter-tag';
  tag.innerHTML = `
    ${displayName}: ${value} 
    <span class="remove-filter" data-filter="${type}" data-value="${value}">×</span>
  `;
  return tag;
}

/**
 * Helper: configurar listener para remover filtro
 * @param {HTMLElement} tag - Elemento de la etiqueta
 * @param {string} type - Tipo de filtro
 * @param {string} value - Valor del filtro
 */
function setupRemoveFilterListener(tag, type, value) {
  const removeBtn = tag.querySelector('.remove-filter');

  removeBtn.addEventListener('click', () => {
    if (type === 'keyword') {
      elements.keywordInput.value = '';
      handleSearch();
    } else if (type === 'category') {
      const todosRadio = document.querySelector('input[value="Todos"]');
      if (todosRadio) todosRadio.checked = true;
      handleSearch();
    } else {
      // Filtro avanzado
      elements.advancedFilters[type].forEach(checkbox => {
        if (checkbox.value === value) {
          checkbox.checked = false;
        }
      });

      app.activeFilters.advanced[type] = app.activeFilters.advanced[type]
        .filter(v => v !== value);

      handleSearch();
    }
  });
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
    const keywordTag = createFilterTag('keyword', keyword, 'Texto');
    elements.activeFiltersContainer.appendChild(keywordTag);
    setupRemoveFilterListener(keywordTag, 'keyword', keyword);
  }

  // Mostrar categoría como filtro activo si no es "Todos"
  if (category !== 'Todos') {
    hasActiveFilters = true;
    const categoryTag = createFilterTag('category', category, 'Categoría');
    elements.activeFiltersContainer.appendChild(categoryTag);
    setupRemoveFilterListener(categoryTag, 'category', category);
  }

  // Mostrar filtros avanzados activos
  const groupNames = {
    escalaEspacial: 'Escala espacial',
    escalaTemporal: 'Escala temporal'
  };

  Object.keys(advanced).forEach(filterGroup => {
    const filters = advanced[filterGroup];
    if (filters.length > 0) {
      hasActiveFilters = true;

      filters.forEach(value => {
        const advancedTag = createFilterTag(filterGroup, value, groupNames[filterGroup]);
        elements.activeFiltersContainer.appendChild(advancedTag);
        setupRemoveFilterListener(advancedTag, filterGroup, value);
      });
    }
  });

  // Mostrar u ocultar el botón "Limpiar todos" según haya filtros activos
  if (elements.clearFiltersBtn) {
    elements.clearFiltersBtn.style.display = hasActiveFilters ? 'block' : 'none';
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
 * Obtiene la cantidad de resultados para un filtro específico
 * @param {string} filterType - Tipo de filtro ('category', 'escalaEspacial', 'escalaTemporal')
 * @param {string} filterValue - Valor del filtro
 * @returns {number} - Cantidad de mapas que coinciden
 */
function getFilterResultCount(filterType, filterValue) {
  const currentKeyword = app.activeFilters.keyword;
  const currentCategory = app.activeFilters.category;
  const currentAdvanced = app.activeFilters.advanced;
  
  // Si hay keyword pero no cumple con longitud mínima, no contar (devolver 0)
  if (currentKeyword && currentKeyword.trim().length > 0 && currentKeyword.trim().length < 3) {
    return 0;
  }
  
  // Filtrar según el tipo
  return app.allMaps.filter(map => {
    const normalizedMap = normalizeMapData(map);
    
    // Aplicar filtro de keyword si existe y cumple longitud mínima
    if (currentKeyword && currentKeyword.trim().length >= 3) {
      const searchableFields = [
        map.title_search || normalizeText(normalizedMap.title),
        ...(map.keywords_search || normalizedMap.keywords.map(k => normalizeText(k)))
      ];
      const searchTerms = currentKeyword.trim().split(/\s+/).map(term => normalizeText(term));
      
      // Usar la MISMA lógica de búsqueda que filterMaps() - con fuzzy match
      let allTermsMatch;
      
      if (app.fuzzyMatch) {
        // Usar búsqueda difusa con priorización (IGUAL que filterMaps)
        allTermsMatch = searchTerms.every(term => {
          let hasExactMatch = false;
          let hasFuzzyMatch = false;
          
          for (const field of searchableFields) {
            const result = fuzzyMatch(term, field);
            
            if (result.type === 'exact') {
              hasExactMatch = true;
              break; // Coincidencia exacta encontrada, no buscar más
            } else if (result.type === 'fuzzy') {
              hasFuzzyMatch = true;
            }
          }
          
          // Priorizar coincidencias exactas, pero aceptar difusas si no hay exactas
          return hasExactMatch || hasFuzzyMatch;
        });
      } else {
        // Usar búsqueda exacta tradicional con palabras completas
        allTermsMatch = searchTerms.every(term => 
          searchableFields.some(field => isWholeWordMatch(term, field))
        );
      }
      
      if (!allTermsMatch) return false;
    }
    
    // Aplicar filtros avanzados activos (excepto el que estamos evaluando)
    // Escala espacial
    if (filterType !== 'escalaEspacial' && currentAdvanced.escalaEspacial.length > 0) {
      const mapSpaceSearch = map.space_search || [];
      const normalizedFilters = currentAdvanced.escalaEspacial.map(f => normalizeText(f));
      const hasMatch = normalizedFilters.some(filter => 
        mapSpaceSearch.some(space => space.includes(filter) || filter.includes(space))
      );
      if (!hasMatch) return false;
    }
    
    // Escala temporal
    if (filterType !== 'escalaTemporal' && currentAdvanced.escalaTemporal.length > 0) {
      const mapTimeSearch = map.time_search || [];
      const normalizedFilters = currentAdvanced.escalaTemporal.map(f => normalizeText(f));
      
      // Filtrar categorías padre
      const filteredTemporalFilters = normalizedFilters.filter(f => 
        f !== 'anos censales' && f !== 'periodos' && f !== 'siglos'
      );
      
      if (filteredTemporalFilters.length > 0) {
        const hasMatch = filteredTemporalFilters.some(filter => 
          mapTimeSearch.includes(filter)
        );
        if (!hasMatch) return false;
      }
    }
    
    // Aplicar categoría activa (excepto si estamos evaluando categorías)
    if (filterType !== 'category' && currentCategory !== 'Todos') {
      if (normalizedMap.category !== currentCategory) return false;
    }
    
    // Aplicar filtro específico que estamos evaluando
    switch(filterType) {
      case 'category':
        if (filterValue === 'Todos') return true;
        return normalizedMap.category === filterValue;
        
      case 'escalaEspacial':
        const mapSpaceSearch = map.space_search || [];
        const normalizedSpatialFilter = normalizeText(filterValue);
        return mapSpaceSearch.some(space => 
          space.includes(normalizedSpatialFilter) || normalizedSpatialFilter.includes(space)
        );
        
      case 'escalaTemporal':
        const mapTimeSearch = map.time_search || [];
        const normalizedTemporalFilter = normalizeText(filterValue);
        
        // Categorías padre
        const parentCategories = {
          'anos censales': ['2001', '2010', '2022', 'anos anteriores'],
          'periodos': ['1900-1950', '1950-1990', '1960-1970', '1970-1980', '1980-1990', '1990-2000', '2000-2010', '2010-2020', '2020-2030'],
          'siglos': ['xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx', 'xxi']
        };
        
        // Si es categoría padre, contar si tiene algún hijo
        if (parentCategories[normalizedTemporalFilter]) {
          const children = parentCategories[normalizedTemporalFilter];
          return children.some(child => mapTimeSearch.includes(child));
        }
        
        // Si es hijo, buscar coincidencia exacta
        return mapTimeSearch.includes(normalizedTemporalFilter);
        
      default:
        return true;
    }
  }).length;
}

/**
 * Actualiza los contadores de resultados en todos los filtros
 */
function updateFilterCounts() {
  // Actualizar filtros de categoría
  if (elements.categoryFilters && elements.categoryFilters.length) {
    elements.categoryFilters.forEach(radio => {
      const filterValue = radio.value;
      const count = getFilterResultCount('category', filterValue);
      const label = radio.nextElementSibling;
      
      if (label) {
        // Guardar texto original si no existe
        if (!label.hasAttribute('data-original-text')) {
          label.setAttribute('data-original-text', label.textContent.trim());
        }
        
        const originalText = label.getAttribute('data-original-text');
        label.textContent = `${originalText} (${count})`;
        
        // Deshabilitar si no hay resultados (excepto "Todos")
        if (count === 0 && filterValue !== 'Todos') {
          radio.disabled = true;
          label.style.opacity = '0.5';
          label.style.cursor = 'not-allowed';
          label.title = 'No hay resultados disponibles para esta categoría';
        } else {
          radio.disabled = false;
          label.style.opacity = '1';
          label.style.cursor = 'pointer';
          label.title = '';
        }
      }
    });
  }
  
  // Actualizar filtros de escala espacial
  if (elements.advancedFilters.escalaEspacial) {
    elements.advancedFilters.escalaEspacial.forEach(checkbox => {
      const filterValue = checkbox.value;
      const count = getFilterResultCount('escalaEspacial', filterValue);
      const label = checkbox.nextElementSibling;
      
      if (label) {
        // Guardar texto original si no existe
        if (!label.hasAttribute('data-original-text')) {
          label.setAttribute('data-original-text', label.textContent.trim());
        }
        
        const originalText = label.getAttribute('data-original-text');
        label.textContent = `${originalText} (${count})`;
        
        // Deshabilitar si no hay resultados
        if (count === 0) {
          checkbox.disabled = true;
          label.style.opacity = '0.5';
          label.style.cursor = 'not-allowed';
          label.title = 'No hay resultados disponibles para esta escala espacial';
        } else {
          checkbox.disabled = false;
          label.style.opacity = '1';
          label.style.cursor = 'pointer';
          label.title = '';
        }
      }
    });
  }
  
  // Actualizar filtros de escala temporal
  if (elements.advancedFilters.escalaTemporal) {
    elements.advancedFilters.escalaTemporal.forEach(checkbox => {
      const filterValue = checkbox.value;
      const count = getFilterResultCount('escalaTemporal', filterValue);
      const label = checkbox.nextElementSibling;
      
      if (label) {
        // Guardar texto original si no existe
        if (!label.hasAttribute('data-original-text')) {
          label.setAttribute('data-original-text', label.textContent.trim());
        }
        
        const originalText = label.getAttribute('data-original-text');
        
        // Para categorías padre, mostrar sin modificar el estilo bold
        if (label.classList.contains('fw-bold')) {
          label.innerHTML = `${originalText} <span style="font-weight: normal;">(${count})</span>`;
        } else {
          label.textContent = `${originalText} (${count})`;
        }
        
        // Deshabilitar si no hay resultados
        if (count === 0) {
          checkbox.disabled = true;
          label.style.opacity = '0.5';
          label.style.cursor = 'not-allowed';
          label.title = 'No hay resultados disponibles para esta escala temporal';
        } else {
          checkbox.disabled = false;
          label.style.opacity = '1';
          label.style.cursor = 'pointer';
          label.title = '';
        }
      }
    });
  }
}

/**
 * Helper: Crear botón de navegación
 * @param {string} direction - 'prev' o 'next'
 * @param {boolean} isMobile - Si es versión móvil
 * @param {number} idx - Índice actual
 * @returns {HTMLElement|null} - Elemento botón o null si hay error
 */
function createNavButton(direction, isMobile, idx) {
  // Validaciones
  if (!direction || (direction !== 'prev' && direction !== 'next')) {
    console.warn('Dirección de botón inválida:', direction);
    return null;
  }
  
  if (typeof idx !== 'number' || idx < 0) {
    console.warn('Índice inválido para botón de navegación:', idx);
    return null;
  }

  if (!app.filteredMaps || app.filteredMaps.length === 0) {
    console.warn('No hay mapas disponibles para crear botones de navegación');
    return null;
  }

  const button = document.createElement('button');
  const isPrev = direction === 'prev';
  const icon = isPrev ? 'bx-chevron-left' : 'bx-chevron-right';
  const label = isPrev ? 'Anterior' : 'Siguiente';

  button.setAttribute('aria-label', label);
  button.setAttribute('type', 'button');
  button.className = `modal-nav-btn ${direction}-map-btn ${isMobile ? 'mobile' : 'desktop'} ${isPrev ? 'left' : 'right'}`;
  button.innerHTML = `<i class='bx ${icon}'></i>`;

  // Deshabilitar según posición
  const shouldDisable = isPrev ? (idx <= 0) : (idx >= app.filteredMaps.length - 1);
  if (shouldDisable) {
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
  }

  return button;
}

/**
 * Helper: Configurar listeners de navegación
 * @param {HTMLElement} prevBtn - Botón anterior
 * @param {HTMLElement} nextBtn - Botón siguiente
 * @param {number} idx - Índice actual
 */
function setupNavListeners(prevBtn, nextBtn, idx) {
  // Validar que los índices sean válidos
  if (typeof idx !== 'number' || idx < 0 || idx >= app.filteredMaps.length) {
    console.warn('Índice inválido para navegación:', idx);
    return;
  }

  // Limpiar listener de teclado anterior si existe
  cleanupModalKeyHandler();

  // Configurar botones de navegación
  if (prevBtn && !prevBtn.disabled) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const newIdx = app.currentModalIndex - 1;
      if (newIdx >= 0) {
        updateModalContent(newIdx);
      }
    });
  }
  
  if (nextBtn && !nextBtn.disabled) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const newIdx = app.currentModalIndex + 1;
      if (newIdx < app.filteredMaps.length) {
        updateModalContent(newIdx);
      }
    });
  }

  // Crear handler de teclado para navegación con flechas
  app.modalKeyHandler = function(e) {
    // Solo procesar si el modal está abierto y no hay inputs activos
    if (!elements.modal || document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
      return;
    }

    const currentIdx = app.currentModalIndex;
    
    switch(e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (currentIdx > 0) {
          updateModalContent(currentIdx - 1);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (currentIdx < app.filteredMaps.length - 1) {
          updateModalContent(currentIdx + 1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeModal();
        break;
    }
  };

  // Agregar listener de teclado
  document.addEventListener('keydown', app.modalKeyHandler);
}

/**
 * Helper: Limpiar el handler de teclado del modal
 */
function cleanupModalKeyHandler() {
  if (app.modalKeyHandler) {
    document.removeEventListener('keydown', app.modalKeyHandler);
    app.modalKeyHandler = null;
  }
}

/**
 * Helper: Actualizar solo el contenido del modal existente
 * @param {number} idx - Índice del mapa a mostrar
 */
function updateModalContent(idx) {
  if (!elements.modal || idx < 0 || idx >= app.filteredMaps.length) {
    return;
  }

  const map = app.filteredMaps[idx];
  if (!map) {
    console.error('Mapa no encontrado en índice:', idx);
    return;
  }

  // Actualizar índice actual
  app.currentModalIndex = idx;
  
  // 📊 TRACKING: Navegación entre mapas en modal
  trackMapView(map, 'navigation');

  // Determinar si estamos en viewport móvil
  const isMobile = window.innerWidth < 900;

  // Buscar el contenedor de contenido del modal
  const existingContent = elements.modal.querySelector('.modal-mobile, .modal-desktop');
  if (!existingContent) {
    console.warn('No se encontró contenido del modal para actualizar');
    return;
  }

  try {
    // Crear nuevo contenido
    if (isMobile) {
      existingContent.outerHTML = createMobileModalContent(map);
    } else {
      const { html, citationText, citationHTML } = createDesktopModalContent(map);
      existingContent.outerHTML = html;
      setupCopyButton(citationText, citationHTML);
    }

    // Actualizar botones de navegación
    updateNavigationButtons(idx, isMobile);

    // Reconfigurar el listener del botón cerrar
    const closeBtn = elements.modal.querySelector('.close-modal-btn');
    if (closeBtn) {
      // Remover listeners existentes clonando el elemento
      const newCloseBtn = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
      
      newCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      });
    }
    
    // 📊 TRACKING: Configurar listeners para descargas después de actualizar contenido
    setupDownloadTracking(map, isMobile);

  } catch (error) {
    console.error('Error al actualizar contenido del modal:', error);
  }
}

/**
 * Helper: Actualizar estado de los botones de navegación
 * @param {number} idx - Índice actual
 * @param {boolean} isMobile - Si es versión móvil
 */
function updateNavigationButtons(idx, isMobile) {
  const prevBtn = elements.modal.querySelector('.prev-map-btn');
  const nextBtn = elements.modal.querySelector('.next-map-btn');

  if (prevBtn) {
    const shouldDisable = idx <= 0;
    prevBtn.disabled = shouldDisable;
    prevBtn.setAttribute('aria-disabled', shouldDisable ? 'true' : 'false');
    
    // Limpiar listeners existentes clonando el elemento
    const newPrevBtn = prevBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    
    // Agregar nuevo listener si no está deshabilitado
    if (!shouldDisable) {
      newPrevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const newIdx = app.currentModalIndex - 1;
        if (newIdx >= 0) {
          updateModalContent(newIdx);
        }
      });
    }
  }

  if (nextBtn) {
    const shouldDisable = idx >= app.filteredMaps.length - 1;
    nextBtn.disabled = shouldDisable;
    nextBtn.setAttribute('aria-disabled', shouldDisable ? 'true' : 'false');
    
    // Limpiar listeners existentes clonando el elemento
    const newNextBtn = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    
    // Agregar nuevo listener si no está deshabilitado
    if (!shouldDisable) {
      newNextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const newIdx = app.currentModalIndex + 1;
        if (newIdx < app.filteredMaps.length) {
          updateModalContent(newIdx);
        }
      });
    }
  }
}

/**
 * Helper: Crear contenido del modal móvil
 * @param {Object} map - Objeto mapa
 * @returns {string} - HTML del modal móvil
 */
function createMobileModalContent(map) {
  const mobileImage = map.image || map.ruta_imagen || '';
  const mobileDownload = map.download || map.download_link || map.ruta_descarga || mobileImage;

  return `
    <div class="modal-mobile modal-mobile-container">
      <img src="${mobileImage}" alt="${map.title || map.titulo}">
      <button class="close-modal-btn modal-mobile-close">×</button>
      <div class="modal-mobile-actions modal-mobile-actions-centered">
        <a href="${mobileDownload}" download class="download-btn modal-download-btn" target="_blank">
          <i class='bx bx-download'></i> Descargar
        </a>
      </div>
    </div>
  `;
}

/**
 * Helper: Crear contenido del modal desktop
 * @param {Object} map - Objeto mapa
 * @returns {Object} - Objeto con HTML y datos de citación
 */
function createDesktopModalContent(map) {
  const desktopImage = map.image || map.ruta_imagen || '';
  const desktopDownload = map.download || map.download_link || map.ruta_descarga || desktopImage;
  const title = map.title || map.titulo || '';
  const author = map.author || map.autor || '';
  const year = map.year || map.año || '';
  const section = map.section || map.categoria || '';
  const publication = map.publication || map.publicacion || '';
  const link = map.link || map.enlace || '';

  // Crear tanto la versión de texto plano como la de HTML para la cita
  const citationText = `${author} (${year}). ${title} [Mapa]. ${section}: ${publication}. ANIDA. Atlas Nacional Interactivo de Argentina. ${link}`;
  const citationHTML = `${author} (${year}). <i>${title}</i> [Mapa]. ${section}: ${publication}. ANIDA. Atlas Nacional Interactivo de Argentina. ${link}`;

  const html = `
  <div class="modal-desktop modal-desktop-container">
    <div class="modal-img-container">
      <img src="${desktopImage}" alt="${title}">
    </div>
    <aside class="modal-aside">
      <div class="modal-info">
        <h5 style="color: grey">${section}</h5>
        <h6 style="color: grey">${publication}</h6>
        <h4 style="margin-top: 0.5rem;">${title}</h4>
        <div class="map-metadata">
          <div class="metadata-item">
            ${author && section ? `
              <p class="map-author" id="map-citation">
                <strong>Referencia bibliográfica:</strong> ${author} (${year}). <i>${title}</i> [Mapa]. ${section}: ${publication}. ANIDA. Atlas Nacional Interactivo de Argentina. <a href="${link}" target="_blank" rel="noopener" style="word-break: break-all;">${link}</a>
              </p>
              <button class="copy-citation-btn">
                <i class='bx bx-copy'></i> Copiar cita
              </button>
            ` : ''}
          </div>
        </div>
      </div>
      
      <div class="modal-actions">
        <div class="modal-download">
          <a href="${desktopDownload}" download class="download-btn" target="_blank">
            <i class='bx bx-download'></i> Descargar
          </a>
          ${link ? `
            <a href="${link}" target="_blank" class="view-btn" rel="noopener">
              <i class='bx bx-link-external'></i>Ver publicación
            </a>
          ` : ''}
        </div>
      </div>
      
      <button class="close-modal-btn">×</button>
    </aside>
  </div>
  `;

  return { html, citationText, citationHTML };
}

/**
 * Helper: Configurar botón de copiar cita
 * @param {string} citationText - Texto plano de la cita
 * @param {string} citationHTML - Versión HTML de la cita con formato
 */
function setupCopyButton(citationText, citationHTML) {
  const copyBtn = elements.modal.querySelector('.copy-citation-btn');
  if (copyBtn && citationHTML) {
    copyBtn.addEventListener('click', () => {
      // Usar Clipboard API con HTML si está disponible
      if (navigator.clipboard && navigator.clipboard.write) {
        try {
          const blob = new Blob([citationHTML], { type: 'text/html' });
          const textBlob = new Blob([citationText], { type: 'text/plain' });
          const data = [new ClipboardItem({ 
            'text/html': blob,
            'text/plain': textBlob
          })];
          
          navigator.clipboard.write(data).then(() => {
            copyBtn.innerHTML = `<i class='bx bx-check'></i> ¡Copiado!`;
            setTimeout(() => {
              copyBtn.innerHTML = `<i class='bx bx-copy'></i> Copiar cita`;
            }, 1200);
          }).catch(() => {
            // Fallback si falla el copiado con HTML
            fallbackCopyText();
          });
        } catch (error) {
          // Fallback si hay error en la creación del ClipboardItem
          fallbackCopyText();
        }
      } else {
        // Fallback: copiar solo texto plano
        fallbackCopyText();
      }
      
      function fallbackCopyText() {
        navigator.clipboard.writeText(citationText).then(() => {
          copyBtn.innerHTML = `<i class='bx bx-check'></i> ¡Copiado!`;
          setTimeout(() => {
            copyBtn.innerHTML = `<i class='bx bx-copy'></i> Copiar cita`;
          }, 1200);
        }).catch(() => {
          // Último fallback: seleccionar texto manualmente
          console.warn('Error al copiar al portapapeles');
          copyBtn.innerHTML = `<i class='bx bx-x'></i> Error`;
          setTimeout(() => {
            copyBtn.innerHTML = `<i class='bx bx-copy'></i> Copiar cita`;
          }, 1200);
        });
      }
    });
  }
}

/**
 * Abre el modal con el mapa seleccionado
 * @param {number|string} index - Índice del mapa en la lista filtrada o ID del mapa
 */
function openMapModal(index) {
  // Validar que existen mapas filtrados
  if (!app.filteredMaps || app.filteredMaps.length === 0) {
    console.warn('No hay mapas disponibles para mostrar en modal');
    return;
  }

  // Determinar índice real
  let idx;
  if (typeof index === 'number') {
    idx = index;
  } else {
    // Intentar encontrar por ID
    idx = findIndexById(index);
    if (idx === -1) {
      // Como fallback, intentar parsear como número
      const asNum = parseInt(index, 10);
      if (!isNaN(asNum) && asNum >= 0 && asNum < app.filteredMaps.length) {
        idx = asNum;
      }
    }
  }

  // Validar índice final
  if (typeof idx !== 'number' || idx < 0 || idx >= app.filteredMaps.length) {
    console.warn('Índice de mapa inválido:', index, 'Calculado:', idx);
    return;
  }

  const map = app.filteredMaps[idx];
  if (!map) {
    console.error('Mapa no encontrado en índice:', idx);
    return;
  }
  
  // 📊 TRACKING: Visualización de mapa en modal
  trackMapView(map, 'grid');

  // Si el modal ya existe, solo actualizar contenido
  if (elements.modal) {
    updateModalContent(idx);
    return;
  }

  // Crear nuevo modal solo si no existe
  elements.modal = document.createElement('div');
  elements.modal.className = 'modal-fullscreen';
  document.body.appendChild(elements.modal);

  // Actualizar índice actual
  app.currentModalIndex = idx;

  // Determinar si estamos en viewport móvil
  const isMobile = window.innerWidth < 900;

  try {
    // Crear contenido del modal
    if (isMobile) {
      elements.modal.innerHTML = createMobileModalContent(map);
    } else {
      const { html, citationText, citationHTML } = createDesktopModalContent(map);
      elements.modal.innerHTML = html;
      setupCopyButton(citationText, citationHTML);
    }

    // Crear y configurar botones de navegación
    const prevBtn = createNavButton('prev', isMobile, idx);
    const nextBtn = createNavButton('next', isMobile, idx);

    if (prevBtn && nextBtn) {
      elements.modal.appendChild(prevBtn);
      elements.modal.appendChild(nextBtn);
      setupNavListeners(prevBtn, nextBtn, idx);
    }

    // Event listener para cerrar modal
    const closeBtn = elements.modal.querySelector('.close-modal-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      });
    }
    
    // 📊 TRACKING: Configurar listeners para descargas
    setupDownloadTracking(map, isMobile);

    // Bloquear scroll en el body
    document.body.style.overflow = 'hidden';

  } catch (error) {
    console.error('Error al crear contenido del modal:', error);
    closeModal();
  }
}

/**
 * Configura tracking para botones de descarga en el modal
 * @param {Object} map - Objeto del mapa actual
 * @param {boolean} isMobile - Si es versión móvil
 */
function setupDownloadTracking(map, isMobile) {
  const downloadBtns = elements.modal?.querySelectorAll('.download-btn');
  if (!downloadBtns || downloadBtns.length === 0) return;
  
  downloadBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const downloadType = isMobile ? 'modal_mobile' : 'modal_desktop';
      trackMapDownload(map, downloadType);
    });
  });
}

/**
 * Cierra el modal de mapa
 */
function closeModal() {
  if (elements.modal) {
    // Limpiar event listeners de teclado
    cleanupModalKeyHandler();
    
    // Remover modal del DOM
    document.body.removeChild(elements.modal);
    elements.modal = null;
    
    // Resetear índice del modal
    app.currentModalIndex = 0;

    // Restaurar scroll
    document.body.style.overflow = '';
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);

// Cerrar autocompletado al hacer click fuera
document.addEventListener('click', (e) => {
  if (elements.keywordInput && 
      elements.autocompleteDropdown && 
      !elements.keywordInput.contains(e.target) &&
      !elements.autocompleteDropdown.contains(e.target)) {
    hideAutocomplete();
  }
});

// ============================================================================
// FUNCIONES DE VALIDACIÓN Y TESTING (solo en desarrollo)
// ============================================================================

/**
 * Valida la integridad del índice optimizado
 * Verifica que la compresión no haya perdido información
 * @returns {Object} Resultado de la validación
 */
function validateIndexIntegrity() {
  /* console.log('🔍 Validando integridad del índice optimizado...'); */
  
  const validation = {
    passed: true,
    errors: [],
    warnings: [],
    stats: {
      termsChecked: 0,
      totalMapReferences: 0,
      flagsValidated: 0
    }
  };
  
  try {
    // Verificar que todos los términos tengan la estructura correcta
    Object.entries(app.searchIndex).forEach(([term, entry]) => {
      validation.stats.termsChecked++;
      
      // Verificar que mapIndices sea Uint16Array
      if (!(entry.mapIndices instanceof Uint16Array)) {
        validation.errors.push(`Término "${term}": mapIndices no es Uint16Array`);
        validation.passed = false;
      }
      
      // Verificar que flags sea Uint8Array
      if (!(entry.flags instanceof Uint8Array)) {
        validation.errors.push(`Término "${term}": flags no es Uint8Array`);
        validation.passed = false;
      }
      
      // Verificar que mapIndices y flags tengan la misma longitud
      if (entry.mapIndices.length !== entry.flags.length) {
        validation.errors.push(`Término "${term}": mapIndices.length (${entry.mapIndices.length}) !== flags.length (${entry.flags.length})`);
        validation.passed = false;
      }
      
      // Verificar que los índices sean válidos
      for (let i = 0; i < entry.mapIndices.length; i++) {
        const mapIndex = entry.mapIndices[i];
        validation.stats.totalMapReferences++;
        
        if (mapIndex >= app.allMaps.length) {
          validation.errors.push(`Término "${term}": índice de mapa inválido (${mapIndex} >= ${app.allMaps.length})`);
          validation.passed = false;
        }
        
        // Verificar que los flags sean válidos (solo bits 0 y 1)
        const flag = entry.flags[i];
        validation.stats.flagsValidated++;
        
        if (flag > 0x03) { // 0x03 = 0b00000011 (ambos bits activos)
          validation.warnings.push(`Término "${term}": flag inválido en posición ${i} (${flag})`);
        }
      }
    });
    
    /* console.log(`✅ Validación completada:
      - Términos validados: ${validation.stats.termsChecked}
      - Referencias a mapas: ${validation.stats.totalMapReferences}
      - Flags validados: ${validation.stats.flagsValidated}
      - Errores: ${validation.errors.length}
      - Advertencias: ${validation.warnings.length}
    `); */
    
    if (validation.errors.length > 0) {
      console.error('❌ Errores encontrados:', validation.errors);
    }
    
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Advertencias:', validation.warnings);
    }
    
  } catch (error) {
    validation.passed = false;
    validation.errors.push(`Error durante validación: ${error.message}`);
    console.error('❌ Error crítico durante validación:', error);
  }
  
  return validation;
}

/**
 * Compara el rendimiento del índice optimizado vs búsqueda lineal
 * Solo para testing/benchmarking
 * @param {string} searchTerm - Término a buscar
 * @returns {Object} Comparación de tiempos
 */
function benchmarkSearch(searchTerm = 'argentina') {
  /* console.log(`⚡ Benchmark de búsqueda para: "${searchTerm}"`); */
  
  // 1. Búsqueda con índice optimizado
  const indexStart = performance.now();
  const indexResults = searchUsingIndex(searchTerm);
  const indexEnd = performance.now();
  const indexTime = indexEnd - indexStart;
  
  // 2. Búsqueda lineal (sin índice) con palabras completas
  const linearStart = performance.now();
  const normalizedSearch = normalizeText(searchTerm);
  const linearResults = app.allMaps.filter(map => {
    const normalizedMap = normalizeMapData(map);
    const titleField = normalizeText(normalizedMap.title);
    const keywordFields = normalizedMap.keywords.map(k => normalizeText(k)).join(' ');
    return isWholeWordMatch(normalizedSearch, titleField) || isWholeWordMatch(normalizedSearch, keywordFields);
  });
  const linearEnd = performance.now();
  const linearTime = linearEnd - linearStart;
  
  const speedup = (linearTime / indexTime).toFixed(2);
  
  /* console.log(`📊 Resultados del benchmark:
    - Búsqueda con índice: ${indexTime.toFixed(2)}ms (${indexResults.length} resultados)
    - Búsqueda lineal: ${linearTime.toFixed(2)}ms (${linearResults.length} resultados)
    - Speedup: ${speedup}x más rápido
    - Diferencia: ${(linearTime - indexTime).toFixed(2)}ms
  `); */
  
  return {
    indexTime,
    linearTime,
    speedup,
    indexResults: indexResults.length,
    linearResults: linearResults.length
  };
}

/**
 * Ejecuta validaciones automáticas post-indexación (solo en desarrollo)
 * Desactivar en producción para mejor performance
 */
function runPostIndexValidation() {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    /* console.log('🔧 Modo desarrollo: ejecutando validaciones...'); */
    
    // Validar integridad del índice
    const validation = validateIndexIntegrity();
    
    if (!validation.passed) {
      console.error('❌ ALERTA: El índice tiene errores. Revisar inmediatamente.');
    } else {
      /* console.log('✅ Índice validado correctamente'); */
    }
    
    // Ejecutar benchmark de ejemplo
    benchmarkSearch('argentina');
    benchmarkSearch('clima');
    benchmarkSearch('poblacion');
  }
}

