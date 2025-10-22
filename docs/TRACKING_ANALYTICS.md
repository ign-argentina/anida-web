# Documentación Técnica: Sistema de Tracking con Google Analytics 4

**Proyecto:** ANIDA - Atlas Nacional Interactivo de Argentina  
**Archivo:** `js/maps.js`  
**Fecha de implementación:** Octubre 2025  
**Autor:** Equipo de desarrollo ANIDA

---

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Integración con Google Tag Manager](#integración-con-google-tag-manager)
3. [Eventos Implementados](#eventos-implementados)
4. [Funciones de Tracking](#funciones-de-tracking)
5. [Puntos de Integración](#puntos-de-integración)
6. [Visualización de Datos en GA4](#visualización-de-datos-en-ga4)
7. [Testing y Validación](#testing-y-validación)
8. [Mejores Prácticas](#mejores-prácticas)

---

## Descripción General

El sistema de tracking implementado en ANIDA utiliza **Google Analytics 4 (GA4)** mediante **Google Tag Manager (GTM)** para recopilar datos sobre el comportamiento de los usuarios en el buscador de mapas temáticos.

### Objetivos del Tracking

- **Optimizar contenido**: Identificar qué términos de búsqueda son más populares y qué mapas son más visualizados
- **Mejorar UX**: Detectar patrones de navegación y puntos de fricción en la experiencia de usuario
- **Tomar decisiones basadas en datos**: Proporcionar métricas concretas para guiar el desarrollo futuro
- **Medir efectividad**: Evaluar el rendimiento de funcionalidades como autocompletado, sugerencias e historial

### Arquitectura del Sistema

```
Usuario → Acción en UI → Función de Tracking → dataLayer (GTM) → Google Analytics 4
```

---

## Integración con Google Tag Manager

### Código Base

El sitio ya tiene integrado Google Tag Manager en `mapas_tematicos.html`:

```html
<!-- Google Tag Manager -->
<script>
  (function (w, d, s, l, i) {
    w[l] = w[l] || []; w[l].push({
      'gtm.start': new Date().getTime(), event: 'gtm.js'
    }); var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true; j.src =
        'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
  })(window, document, 'script', 'dataLayer', 'GTM-WSV8Q7P');
</script>
```

### Función Central de Tracking

Todas las funciones de tracking utilizan la función helper `trackEvent()`:

```javascript
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
      
      // Log en desarrollo
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('📊 GA4 Event:', eventName, eventParams);
      }
    }
  } catch (error) {
    console.error('Error al enviar evento a GA4:', error);
  }
}
```

#### Características:

- **Try-catch**: Protege contra errores que podrían romper la funcionalidad principal
- **Validación de dataLayer**: Verifica que GTM esté cargado antes de enviar eventos
- **Logs en desarrollo**: Facilita debugging en localhost/127.0.0.1
- **Flexible**: Acepta cualquier nombre de evento y parámetros personalizados

---

## Eventos Implementados

### 1. `search_query` - Búsqueda Realizada

**Función:** `trackSearch(query, resultsCount, category, advancedFilters)`

**Cuándo se dispara:**
- Usuario presiona "Buscar" o Enter en el campo de búsqueda
- Se ejecuta automáticamente al cambiar categorías o aplicar filtros

**Parámetros enviados:**

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `search_term` | string | Término buscado | "población" |
| `search_results_count` | number | Cantidad de resultados | 42 |
| `search_category` | string | Categoría activa | "Argentina socio-demográfica" |
| `has_advanced_filters` | boolean | Si hay filtros avanzados | true |
| `advanced_filters_spatial` | string | Filtros espaciales (CSV) | "País por provincia, Regional" |
| `advanced_filters_temporal` | string | Filtros temporales (CSV) | "2010, 2022" |
| `search_timestamp` | string | Timestamp ISO 8601 | "2025-10-22T14:30:00.000Z" |

**Ejemplo de uso:**

```javascript
// En handleSearch() - Línea ~1788
if (keyword && keyword.length >= 3) {
  trackSearch(keyword, app.filteredMaps.length, category, app.activeFilters.advanced);
}
```

**Insights que proporciona:**
- ✅ Términos más buscados (ranking de keywords)
- ✅ Efectividad de búsquedas (% con 0 resultados)
- ✅ Uso de filtros avanzados (% de búsquedas con filtros)
- ✅ Categorías más populares

---

### 2. `map_view` - Visualización de Mapa

**Función:** `trackMapView(map, source)`

**Cuándo se dispara:**
- Usuario hace click en una miniatura del grid de resultados
- Usuario navega entre mapas con botones prev/next en el modal

**Parámetros enviados:**

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `map_id` | string | ID único del mapa | "123" |
| `map_title` | string | Título del mapa | "Densidad de población" |
| `map_category` | string | Categoría del mapa | "Argentina socio-demográfica" |
| `map_section` | string | Sección del atlas | "Composición de la población" |
| `map_publication` | string | Publicación origen | "Atlas Digital 2022" |
| `map_author` | string | Autor del mapa | "IGN - Instituto Geográfico Nacional" |
| `map_year` | string | Año de publicación | "2022" |
| `view_source` | string | Origen de visualización | "grid" / "navigation" |
| `view_timestamp` | string | Timestamp ISO 8601 | "2025-10-22T14:30:00.000Z" |

**Valores de `view_source`:**
- `grid`: Click desde el grid de resultados
- `navigation`: Navegación prev/next dentro del modal

**Ejemplo de uso:**

```javascript
// En openMapModal() - Línea ~3079
trackMapView(map, 'grid');

// En updateModalContent() - Línea ~2800
trackMapView(map, 'navigation');
```

**Insights que proporciona:**
- ✅ Mapas más visualizados (ranking)
- ✅ Categorías de mayor interés
- ✅ Patrón de navegación (grid vs. navegación secuencial)
- ✅ Tasa de engagement (visualizaciones / búsquedas)

---

### 3. `map_download` - Descarga de Mapa

**Función:** `trackMapDownload(map, downloadType)`

**Cuándo se dispara:**
- Usuario hace click en el botón "Descargar" en el modal (versión desktop o mobile)

**Parámetros enviados:**

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `map_id` | string | ID único del mapa | "123" |
| `map_title` | string | Título del mapa | "Densidad de población" |
| `map_category` | string | Categoría del mapa | "Argentina socio-demográfica" |
| `map_section` | string | Sección del atlas | "Composición de la población" |
| `map_publication` | string | Publicación origen | "Atlas Digital 2022" |
| `download_type` | string | Tipo de descarga | "modal_desktop" / "modal_mobile" |
| `download_url` | string | URL del archivo | "/assets/data/mapa_123.pdf" |
| `download_timestamp` | string | Timestamp ISO 8601 | "2025-10-22T14:30:00.000Z" |

**Ejemplo de uso:**

```javascript
// En setupDownloadTracking() - Línea ~3148
btn.addEventListener('click', () => {
  const downloadType = isMobile ? 'modal_mobile' : 'modal_desktop';
  trackMapDownload(map, downloadType);
});
```

**Insights que proporciona:**
- ✅ Mapas más descargados (ranking)
- ✅ Tasa de conversión (descargas / visualizaciones)
- ✅ Dispositivos más usados para descargas (mobile vs. desktop)
- ✅ Horarios pico de descargas

---

### 4. `filter_applied` - Filtro Aplicado

**Función:** `trackFilterApplied(filterType, filterValue, resultsCount)`

**Cuándo se dispara:**
- Usuario selecciona una categoría (radio buttons)
- Usuario marca/desmarca un filtro de escala espacial (checkboxes)
- Usuario marca/desmarca un filtro de escala temporal (checkboxes)

**Parámetros enviados:**

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `filter_type` | string | Tipo de filtro | "category" / "escalaEspacial" / "escalaTemporal" |
| `filter_value` | string | Valor(es) del filtro | "Argentina económica" / "País por provincia, Regional" |
| `results_count` | number | Resultados después de filtrar | 15 |
| `filter_timestamp` | string | Timestamp ISO 8601 | "2025-10-22T14:30:00.000Z" |

**Ejemplo de uso:**

```javascript
// En setupEventListeners() - Línea ~835
radio.addEventListener('change', () => {
  handleSearch();
  trackFilterApplied('category', radio.value, app.filteredMaps.length);
});

// En setupAdvancedFiltersListeners() - Línea ~861
const activeFilters = Array.from(elements.advancedFilters.escalaEspacial)
  .filter(cb => cb.checked)
  .map(cb => cb.value);
trackFilterApplied('escalaEspacial', activeFilters, app.filteredMaps.length);
```

**Insights que proporciona:**
- ✅ Filtros más utilizados (ranking)
- ✅ Combinaciones de filtros populares
- ✅ Efectividad de filtros (% que devuelven 0 resultados)
- ✅ Abandono después de filtrar

---

### 5. `search_suggestion_click` - Click en Sugerencia de Búsqueda

**Función:** `trackSearchSuggestion(originalQuery, suggestedTerm, suggestionType)`

**Cuándo se dispara:**
- Usuario hace click en una sugerencia cuando no hay resultados (0 results)

**Parámetros enviados:**

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `original_query` | string | Término original sin resultados | "poblasion" (con error de ortografía) |
| `suggested_term` | string | Término sugerido clickeado | "población" |
| `suggestion_type` | string | Tipo de sugerencia | "similar" / "popular" |
| `suggestion_timestamp` | string | Timestamp ISO 8601 | "2025-10-22T14:30:00.000Z" |

**Valores de `suggestion_type`:**
- `similar`: Término similar (distancia Levenshtein ≤2)
- `popular`: Término popular del índice

**Ejemplo de uso:**

```javascript
// En showSearchSuggestions() - Línea ~1290
const suggestionType = similarTerms.some(t => t.term === suggestedTerm) ? 'similar' : 'popular';
trackSearchSuggestion(searchTerm, suggestedTerm, suggestionType);
```

**Insights que proporciona:**
- ✅ Efectividad de sugerencias (% de clicks)
- ✅ Errores ortográficos comunes
- ✅ Términos que los usuarios buscan pero no existen
- ✅ Tasa de recuperación (búsquedas con 0 resultados que se convierten en éxito)

---

### 6. `search_history_interaction` - Interacción con Historial

**Función:** `trackSearchHistory(action, term)`

**Cuándo se dispara:**
- Usuario hace click en el botón de historial (ver)
- Usuario hace click en un término del historial (click)
- Usuario limpia el historial completo (clear)

**Parámetros enviados:**

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `action` | string | Acción realizada | "view" / "click" / "clear" |
| `search_term` | string | Término clickeado (si aplica) | "población" |
| `history_timestamp` | string | Timestamp ISO 8601 | "2025-10-22T14:30:00.000Z" |

**Ejemplo de uso:**

```javascript
// En showSearchHistory() - Línea ~1024
trackSearchHistory('view');

// En renderSearchHistory() - Línea ~1003
trackSearchHistory('click', query);

// En clearSearchHistory() - Línea ~1073
trackSearchHistory('clear');
```

**Insights que proporciona:**
- ✅ Uso del historial (% de usuarios que lo utilizan)
- ✅ Términos más reutilizados
- ✅ Frecuencia de limpieza del historial
- ✅ Engagement con funcionalidades avanzadas

---

### 7. `autocomplete_selection` - Selección de Autocompletado

**Función:** `trackAutocomplete(selectedTerm, partialQuery)`

**Cuándo se dispara:**
- Usuario hace click o presiona Enter en una sugerencia del autocompletado

**Parámetros enviados:**

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `selected_term` | string | Término seleccionado completo | "población urbana" |
| `partial_query` | string | Consulta parcial que activó el autocompletado | "pobl" |
| `autocomplete_timestamp` | string | Timestamp ISO 8601 | "2025-10-22T14:30:00.000Z" |

**Ejemplo de uso:**

```javascript
// En selectSuggestion() - Línea ~616
const partialQuery = words[words.length - 1] || currentValue;
trackAutocomplete(suggestion, partialQuery);
```

**Insights que proporciona:**
- ✅ Efectividad del autocompletado (% de uso)
- ✅ Caracteres promedio antes de seleccionar
- ✅ Términos más autocompletados
- ✅ Ahorro de tiempo en escritura

---

## Puntos de Integración

### Mapa de Funciones y Líneas de Código

| Evento | Función Principal | Línea | Descripción |
|--------|-------------------|-------|-------------|
| `search_query` | `handleSearch()` | ~1788 | Después de aplicar filtros y actualizar UI |
| `filter_applied` (category) | `setupEventListeners()` | ~835 | Al cambiar radio button de categoría |
| `filter_applied` (spatial) | `setupAdvancedFiltersListeners()` | ~861 | Al cambiar checkbox de escala espacial |
| `filter_applied` (temporal) | `setupCascadingTemporalFilters()` | ~908, ~931 | Al cambiar checkbox de escala temporal |
| `map_view` (grid) | `openMapModal()` | ~3079 | Al abrir modal desde el grid |
| `map_view` (navigation) | `updateModalContent()` | ~2800 | Al navegar entre mapas en modal |
| `map_download` | `setupDownloadTracking()` | ~3148 | Al hacer click en botón de descarga |
| `search_suggestion_click` | `showSearchSuggestions()` | ~1290 | Al hacer click en sugerencia de búsqueda |
| `search_history_interaction` (view) | `showSearchHistory()` | ~1024 | Al abrir dropdown de historial |
| `search_history_interaction` (click) | `renderSearchHistory()` | ~1003 | Al hacer click en término del historial |
| `search_history_interaction` (clear) | `clearSearchHistory()` | ~1073 | Al limpiar todo el historial |
| `autocomplete_selection` | `selectSuggestion()` | ~616 | Al seleccionar sugerencia de autocompletado |

### Flujo de Datos Completo

```
1. Usuario realiza acción en UI
   ↓
2. Event listener captura la acción
   ↓
3. Se ejecuta lógica de negocio (búsqueda, filtrado, etc.)
   ↓
4. Se llama a función de tracking específica (trackSearch, trackMapView, etc.)
   ↓
5. Función helper trackEvent() valida y formatea datos
   ↓
6. Se envía evento a window.dataLayer (GTM)
   ↓
7. Google Tag Manager procesa el evento
   ↓
8. Se envía a Google Analytics 4
   ↓
9. Los datos están disponibles en reportes de GA4
```

---

## Visualización de Datos en GA4

### Configuración en Google Tag Manager

Para que los eventos se envíen correctamente a GA4, deben estar configurados en GTM:

1. **Crear Tags en GTM:**
   - Ir a GTM → Tags → New
   - Tag Type: Google Analytics: GA4 Event
   - Configuration Tag: Seleccionar la configuración GA4 existente
   - Event Name: `{{Event}}` (variable)
   - Event Parameters: Agregar parámetros personalizados

2. **Crear Triggers:**
   - Trigger Type: Custom Event
   - Event Name: `search_query`, `map_view`, etc.

3. **Variables Personalizadas:**
   - Crear variables Data Layer para cada parámetro
   - Ejemplo: `{{dlv - search_term}}` → `search_term`

### Reportes Recomendados en GA4

#### 1. Dashboard de Búsquedas

**Métricas clave:**
- Total de búsquedas (`search_query` count)
- Términos más buscados (`search_term` dimension)
- Búsquedas sin resultados (`search_results_count = 0`)
- Uso de filtros avanzados (`has_advanced_filters = true`)

**Visualizaciones:**
- Gráfico de líneas: Búsquedas por día
- Tabla: Top 20 términos buscados
- Gráfico circular: Distribución por categoría
- KPI: Tasa de éxito de búsquedas (% con resultados > 0)

#### 2. Dashboard de Engagement con Mapas

**Métricas clave:**
- Visualizaciones de mapas (`map_view` count)
- Descargas de mapas (`map_download` count)
- Tasa de conversión (descargas / visualizaciones)
- Mapas más populares (`map_title` dimension)

**Visualizaciones:**
- Tabla: Top 20 mapas visualizados
- Tabla: Top 20 mapas descargados
- Embudo: Búsqueda → Visualización → Descarga
- Gráfico de barras: Visualizaciones por categoría

#### 3. Dashboard de Funcionalidades Avanzadas

**Métricas clave:**
- Uso de autocompletado (`autocomplete_selection` count)
- Uso de historial (`search_history_interaction` count)
- Clicks en sugerencias (`search_suggestion_click` count)
- Uso de filtros (`filter_applied` count)

**Visualizaciones:**
- KPI: % de usuarios que usan autocompletado
- KPI: % de usuarios que usan historial
- Tabla: Filtros más aplicados
- Gráfico de líneas: Tendencia de uso de funcionalidades

#### 4. Dashboard de Experiencia de Usuario

**Métricas clave:**
- Búsquedas sin resultados (`search_results_count = 0`)
- Sugerencias efectivas (clicks en sugerencias)
- Errores ortográficos corregidos (`original_query` vs. `suggested_term`)
- Dispositivos (mobile vs. desktop)

**Visualizaciones:**
- KPI: Tasa de recuperación (búsquedas con 0 resultados → éxito)
- Tabla: Errores ortográficos más comunes
- Gráfico circular: Distribución mobile vs. desktop
- Heatmap: Horarios de mayor actividad

### Exploraciones Personalizadas

#### Análisis de Funnel de Conversión

```
Paso 1: search_query (100%)
  ↓
Paso 2: map_view (X%)
  ↓
Paso 3: map_download (Y%)
```

**Insights:**
- Drop-off en cada paso
- Tasa de conversión global
- Optimizaciones necesarias

#### Análisis de Cohortes

Agrupar usuarios por:
- Primera fecha de búsqueda
- Categoría más buscada
- Uso de funcionalidades avanzadas

**Insights:**
- Retención de usuarios
- Comportamiento por segmentos
- Evolución del engagement

---

## Testing y Validación

### Testing en Desarrollo (Localhost)

Los eventos se logean en consola cuando se ejecuta en localhost:

```javascript
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('📊 GA4 Event:', eventName, eventParams);
}
```

**Flujo de testing:**

1. Abrir Chrome DevTools → Console
2. Realizar acciones en la UI (búsqueda, click en mapa, descarga, etc.)
3. Verificar que aparecen logs con formato: `📊 GA4 Event: nombre_evento {parámetros}`
4. Validar que los parámetros sean correctos y completos

### Testing con Google Tag Manager Preview

1. Ir a GTM → Preview
2. Ingresar la URL del sitio: `https://anida.ign.gob.ar/mapas_tematicos.html`
3. Realizar acciones en la UI
4. En el panel de GTM Preview, verificar:
   - ✅ Eventos aparecen en la lista de "Tags Fired"
   - ✅ Variables tienen los valores esperados
   - ✅ Tags se disparan correctamente

### Testing con Google Analytics DebugView

1. Instalar extensión: [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)
2. Activar la extensión
3. Ir a GA4 → Configure → DebugView
4. Realizar acciones en el sitio
5. Verificar en DebugView que los eventos llegan con todos los parámetros

### Checklist de Validación

| Evento | Acción de Test | Validación Esperada |
|--------|----------------|---------------------|
| `search_query` | Buscar "población" | ✅ Evento con `search_term: "población"` y `search_results_count > 0` |
| `search_query` (sin resultados) | Buscar "xyz123" | ✅ Evento con `search_results_count: 0` |
| `filter_applied` | Cambiar categoría a "Argentina económica" | ✅ Evento con `filter_type: "category"` y `filter_value: "Argentina económica"` |
| `map_view` | Click en miniatura de mapa | ✅ Evento con `view_source: "grid"` y datos completos del mapa |
| `map_view` (navegación) | Click en botón "siguiente" en modal | ✅ Evento con `view_source: "navigation"` |
| `map_download` | Click en "Descargar" (desktop) | ✅ Evento con `download_type: "modal_desktop"` |
| `map_download` | Click en "Descargar" (mobile) | ✅ Evento con `download_type: "modal_mobile"` |
| `search_suggestion_click` | Buscar término inexistente y click en sugerencia | ✅ Evento con `original_query` y `suggested_term` diferentes |
| `search_history_interaction` | Abrir historial | ✅ Evento con `action: "view"` |
| `search_history_interaction` | Click en término del historial | ✅ Evento con `action: "click"` y `search_term` |
| `autocomplete_selection` | Escribir "pobl" y seleccionar "población" | ✅ Evento con `partial_query: "pobl"` y `selected_term: "población"` |

---

## Mejores Prácticas

### 1. Privacidad y Datos Sensibles

❌ **NO rastrear:**
- Datos personales (emails, nombres, documentos)
- Información privada de usuarios
- URLs con parámetros sensibles

✅ **SÍ rastrear:**
- Términos de búsqueda públicos
- Títulos de mapas (contenido público)
- Patrones de uso anónimos

### 2. Nomenclatura de Eventos

✅ **Convenciones seguidas:**
- snake_case para nombres de eventos: `search_query`, `map_view`
- snake_case para parámetros: `search_term`, `map_id`
- Nombres descriptivos y consistentes
- Sin espacios ni caracteres especiales

### 3. Calidad de Datos

✅ **Validaciones implementadas:**
- Try-catch en función `trackEvent()` para prevenir errores
- Verificación de existencia de `dataLayer`
- Valores por defecto para parámetros opcionales
- Timestamps en formato ISO 8601

### 4. Performance

✅ **Optimizaciones:**
- Tracking asíncrono (no bloquea UI)
- Sin callbacks que esperen respuesta de GA4
- Logs solo en desarrollo (no en producción)
- Llamadas mínimas e inteligentes

### 5. Mantenibilidad

✅ **Buenas prácticas aplicadas:**
- Funciones helper reutilizables (`trackEvent()`)
- Documentación inline con JSDoc
- Comentarios con emoji 📊 para identificar código de tracking
- Estructura modular y extensible

### 6. Testing Continuo

✅ **Recomendaciones:**
- Validar eventos después de cada deploy
- Revisar reportes semanalmente
- Ajustar tracking según insights obtenidos
- Mantener documentación actualizada

---

## Anexo: Código Completo de Funciones de Tracking

### Función Principal

```javascript
/**
 * Envía un evento a Google Analytics 4 via Google Tag Manager
 * @param {string} eventName - Nombre del evento
 * @param {Object} eventParams - Parámetros del evento
 */
function trackEvent(eventName, eventParams = {}) {
  try {
    if (typeof window.dataLayer !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...eventParams
      });
      
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('📊 GA4 Event:', eventName, eventParams);
      }
    }
  } catch (error) {
    console.error('Error al enviar evento a GA4:', error);
  }
}
```

### Funciones Específicas

```javascript
// 1. Tracking de búsquedas
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

// 2. Tracking de visualización de mapas
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

// 3. Tracking de descargas
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

// 4. Tracking de filtros
function trackFilterApplied(filterType, filterValue, resultsCount) {
  const valueString = Array.isArray(filterValue) ? filterValue.join(', ') : filterValue;
  
  trackEvent('filter_applied', {
    filter_type: filterType,
    filter_value: valueString || 'ninguno',
    results_count: resultsCount,
    filter_timestamp: new Date().toISOString()
  });
}

// 5. Tracking de sugerencias de búsqueda
function trackSearchSuggestion(originalQuery, suggestedTerm, suggestionType = 'similar') {
  trackEvent('search_suggestion_click', {
    original_query: originalQuery,
    suggested_term: suggestedTerm,
    suggestion_type: suggestionType,
    suggestion_timestamp: new Date().toISOString()
  });
}

// 6. Tracking de historial
function trackSearchHistory(action, term = '') {
  trackEvent('search_history_interaction', {
    action: action,
    search_term: term,
    history_timestamp: new Date().toISOString()
  });
}

// 7. Tracking de autocompletado
function trackAutocomplete(selectedTerm, partialQuery) {
  trackEvent('autocomplete_selection', {
    selected_term: selectedTerm,
    partial_query: partialQuery,
    autocomplete_timestamp: new Date().toISOString()
  });
}

// 8. Helper para tracking de descargas en modal
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
```

---

## Changelog

### Versión 1.0 - Octubre 2025

- ✅ Implementación inicial del sistema de tracking
- ✅ Integración con Google Tag Manager existente
- ✅ 7 eventos personalizados implementados
- ✅ 8 funciones de tracking creadas
- ✅ Logs de debugging para desarrollo
- ✅ Documentación técnica completa

---

## Contacto y Soporte

Para consultas sobre el sistema de tracking:
- **Equipo técnico:** Desarrollo ANIDA
- **Documentación actualizada:** `docs/TRACKING_ANALYTICS.md`
- **Repositorio:** anida-web

---

**Última actualización:** Octubre 2025
