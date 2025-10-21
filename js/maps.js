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
  visualMatch: true, // Mostrar en pantalla el porcentaje de coincidencia segun peso
  searchTimeout: null, // Timer para debouncing de búsqueda
  debounceDelay: 300,  // Delay en ms para debouncing (300ms por defecto)
  autocompleteTimeout: null, // Timer para debouncing de autocompletado
  autocompleteDelay: 200, // Delay en ms para autocompletado (200ms)
  selectedSuggestionIndex: -1, // Índice de sugerencia seleccionada con teclado
  performanceMetrics: { // Métricas de rendimiento
    indexingTime: 0,
    lastSearchTime: 0,
    totalSearches: 0,
    averageSearchTime: 0
  }
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

    // Inicialmente, mostrar todos los mapas
    app.filteredMaps = [...app.allMaps];
    renderMaps();
    updateResultsCount();

    // Mostrar estadísticas de indexación
    console.log(`📊 Estadísticas de indexación:
      - Mapas indexados: ${app.allMaps.length}
      - Términos únicos: ${Object.keys(app.searchIndex).length}
      - Tiempo de indexación: ${app.performanceMetrics.indexingTime.toFixed(2)}ms
      - Promedio por mapa: ${(app.performanceMetrics.indexingTime / app.allMaps.length).toFixed(2)}ms
    `);

  } catch (error) {
    console.error('Error cargando mapas:', error);
    elements.resultsGrid.innerHTML = `<p class="error-message">Error cargando mapas. Por favor, intente nuevamente más tarde.</p>`;
  }
}

/**
 * Construye el índice invertido para búsquedas O(1)
 * Crea un diccionario donde cada término apunta a los índices de mapas que lo contienen
 */
function buildSearchIndex() {
  const startTime = performance.now();
  
  // Reiniciar índice
  app.searchIndex = {};
  
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
      if (!app.searchIndex[term]) {
        app.searchIndex[term] = {
          mapIndices: [],
          inTitle: [],
          inKeywords: []
        };
      }
      
      // Agregar índice del mapa
      if (!app.searchIndex[term].mapIndices.includes(mapIndex)) {
        app.searchIndex[term].mapIndices.push(mapIndex);
      }
      
      // Marcar si aparece en título
      if (titleTerms.includes(term)) {
        app.searchIndex[term].inTitle.push(mapIndex);
      }
      
      // Marcar si aparece en keywords
      if (keywordTerms.includes(term)) {
        app.searchIndex[term].inKeywords.push(mapIndex);
      }
    });
  });
  
  const endTime = performance.now();
  app.performanceMetrics.indexingTime = endTime - startTime;
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
  
  // Reemplazar la última palabra con la sugerencia
  words[words.length - 1] = suggestion;
  const newValue = words.join(' ') + ' '; // Agregar espacio al final
  
  elements.keywordInput.value = newValue;
  elements.keywordInput.focus();
  
  // Ocultar dropdown
  hideAutocomplete();
  
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
        app.activeFilters.keyword = val;
        app.currentBatch = 0;
        filterMaps();
        renderMaps(true);
        updateActiveFilters();
        updateResultsCount();
      }, app.debounceDelay); // Esperar 300ms (configurable) antes de buscar
    });
    
    // Navegación con teclado en autocompletado
    elements.keywordInput.addEventListener('keydown', (e) => {
      const dropdown = elements.autocompleteDropdown;
      const isDropdownVisible = dropdown && dropdown.style.display === 'block';
      
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
      radio.addEventListener('change', handleSearch);
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
  
  // Paso 6: Validar longitud mínima (opcional, pero recomendado)
  if (sanitized.length > 0 && sanitized.length < 2) {
    return {
      sanitized: sanitized,
      valid: false,
      error: 'La búsqueda debe tener al menos 2 caracteres'
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
  
  if (errorElement) {
    errorElement.style.display = 'none';
  }
  
  if (elements.keywordInput) {
    elements.keywordInput.style.borderColor = '';
  }
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
 * Verifica si un término coincide con un campo usando búsqueda difusa
 * @param {string} term - Término de búsqueda normalizado
 * @param {string} field - Campo de búsqueda normalizado
 * @param {number} threshold - Umbral de distancia (por defecto 2)
 * @returns {Object} - {match: boolean, score: number, type: 'exact'|'fuzzy', percentage: number}
 */
function fuzzyMatch(term, field, threshold = 2) {
  // Coincidencia exacta (prioridad máxima)
  if (field.includes(term)) {
    return { match: true, score: 0, type: 'exact', percentage: 100 };
  }
  
  // Solo aplicar búsqueda difusa a palabras de 5+ caracteres
  if (term.length < 5) {
    return { match: false, score: Infinity, type: 'none', percentage: 0 };
  }
  
  // Dividir el campo en palabras para comparar
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
  console.time('🔍 Tiempo de búsqueda');
  const searchStartTime = performance.now();
  
  const { keyword, category, advanced } = app.activeFilters;
  
  // OPTIMIZACIÓN: Si hay búsqueda de texto y el índice está disponible, usar búsqueda indexada
  let candidateMaps = app.allMaps;
  
  if (keyword && keyword.trim().length >= 3 && Object.keys(app.searchIndex).length > 0) {
    // Usar búsqueda indexada O(1) por término
    candidateMaps = searchUsingIndex(keyword.trim());
  }

  app.filteredMaps = candidateMaps.filter(map => {
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
        // Usar búsqueda exacta tradicional (método original)
        allTermsMatch = searchTerms.every(term => 
          searchableFields.some(field => field.includes(term))
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
  console.log(`⚡ Búsqueda completada en ${searchTime.toFixed(2)}ms (promedio: ${app.performanceMetrics.averageSearchTime.toFixed(2)}ms) | Resultados: ${app.filteredMaps.length}`);
}

/**
 * Realiza búsqueda utilizando el índice invertido (O(1) por término)
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
      app.searchIndex[term].mapIndices.forEach(idx => matchingIndices.add(idx));
    }
    
    // 2. Si fuzzyMatch está activado y el término es largo, buscar similares
    if (app.fuzzyMatch && term.length >= 5) {
      Object.keys(app.searchIndex).forEach(indexedTerm => {
        const distance = levenshteinDistance(term, indexedTerm);
        if (distance > 0 && distance <= 2) { // threshold = 2
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
    
    if (percentage >= 80) {
      color = '#28a745'; // Verde
      label = 'Alta';
    } else if (percentage >= 50) {
      color = '#ffc107'; // Amarillo
      label = 'Media';
    }
    
    relevanceIndicator = `
      <div class="relevance-indicator" style="
        position: absolute;
        top: 8px;
        right: 8px;
        background: ${color};
        color: white;
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

// Cerrar autocompletado al hacer click fuera
document.addEventListener('click', (e) => {
  if (elements.keywordInput && 
      elements.autocompleteDropdown && 
      !elements.keywordInput.contains(e.target) &&
      !elements.autocompleteDropdown.contains(e.target)) {
    hideAutocomplete();
  }
});

