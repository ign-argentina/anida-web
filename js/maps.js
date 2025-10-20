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
      escalaEspacial: [],
      escalaTemporal: []
    }
  },
  currentModalIndex: 0, // Índice del mapa actual en modal
  modalKeyHandler: null // Referencia al handler de teclado del modal
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
  clearKeywordBtn: null,
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
  elements.clearKeywordBtn = document.getElementById('clear-keyword-btn');
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
        // Actualizar filtros y resultados
        app.activeFilters.keyword = '';
        app.currentBatch = 0;
        filterMaps();
        renderMaps(true);
        updateActiveFilters();
        updateResultsCount();
      });
    }

    elements.keywordInput.addEventListener('input', (e) => {
      const val = (e.target.value || '').trim();
      // Habilitar solo si hay al menos 3 caracteres
      if (elements.searchButton) {
        elements.searchButton.disabled = val.length < 3;
      }

      // Mostrar/ocultar botón limpiar según contenido
      if (elements.clearKeywordBtn) {
        elements.clearKeywordBtn.style.display = val.length > 0 ? 'inline-block' : 'none';
      }

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
}

/**
 * Helper: configurar listeners de filtros avanzados
 */
function setupAdvancedFiltersListeners() {
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

  // Configurar lógica de selección en cascada para filtros temporales
  setupCascadingTemporalFilters();
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
        });
      }
    });
  });
}

/**
 * Configura todos los event listeners
 */
function setupEventListeners() {
  setupSearchListeners();
  setupAdvancedFiltersListeners();

  // Botón cargar más
  if (elements.loadMoreBtn) {
    elements.loadMoreBtn.addEventListener('click', loadMoreMaps);
  }

  // Limpiar todos los filtros
  if (elements.clearFiltersBtn) {
    elements.clearFiltersBtn.addEventListener('click', clearAllFilters);
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
  const { keyword, category, advanced } = app.activeFilters;

  app.filteredMaps = app.allMaps.filter(map => {
    const normalizedMap = normalizeMapData(map);

    // Filtrar por categoría rápida
    if (category !== 'Todos' && normalizedMap.category !== category) {
      return false;
    }

    // Filtrar por keyword si existe
    if (keyword) {
      // Usar keywords_search normalizado si existe, sino normalizar manualmente
      const searchableFields = [
        map.title_search || normalizeText(normalizedMap.title),
        ...(map.keywords_search || normalizedMap.keywords.map(k => normalizeText(k)))
      ];

      // Dividir la búsqueda en términos individuales
      const searchTerms = keyword.trim().split(/\s+/).map(term => normalizeText(term));

      // Verificar si todos los términos aparecen en algún campo
      const allTermsMatch = searchTerms.every(term => 
        searchableFields.some(field => field.includes(term))
      );

      if (!allTermsMatch) {
        return false;
      }
    }

    // Filtrar por escala espacial (usando space_search)
    if (advanced.escalaEspacial.length > 0) {
      const mapSpaceSearch = map.space_search || [];
      // Normalizar los filtros seleccionados
      const normalizedFilters = advanced.escalaEspacial.map(f => normalizeText(f));
      
      // Verificar si TODOS los filtros seleccionados tienen coincidencia (AND lógico)
      const allFiltersMatch = normalizedFilters.every(filter => 
        mapSpaceSearch.some(space => space.includes(filter) || filter.includes(space))
      );

      if (!allFiltersMatch) {
        return false;
      }
    }

    // Filtrar por escala temporal (usando time_search con coincidencia EXACTA)
    if (advanced.escalaTemporal.length > 0) {
      const mapTimeSearch = map.time_search || [];
      // Normalizar los filtros seleccionados
      const normalizedFilters = advanced.escalaTemporal.map(f => normalizeText(f));
      
      // Verificar si TODOS los filtros seleccionados tienen coincidencia EXACTA (AND lógico)
      const allFiltersMatch = normalizedFilters.every(filter => 
        mapTimeSearch.some(time => time === filter) // Coincidencia exacta
      );

      if (!allFiltersMatch) {
        return false;
      }
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
  const normalizedMap = normalizeMapData(map);

  miniatura.className = 'flex-item';
  miniatura.setAttribute('data-index', index);

  if (map.id) {
    miniatura.setAttribute('data-id', map.id);
  }

  miniatura.innerHTML = `
    <a href="#" title="${normalizedMap.title}" data-tracking-category="maps" data-tracking-action="click" data-tracking-label="${normalizedMap.title}">
      <div class="icon-box">
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

    // Bloquear scroll en el body
    document.body.style.overflow = 'hidden';

  } catch (error) {
    console.error('Error al crear contenido del modal:', error);
    closeModal();
  }
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
