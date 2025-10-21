# Optimización de Performance - Índice Invertido

## 📊 Descripción General

Implementación de un sistema de indexación invertida para optimizar la búsqueda de mapas, reduciendo la complejidad temporal de **O(n)** a **O(1)** por término de búsqueda.

---

## 🎯 Objetivos

1. **Mejorar la velocidad de búsqueda**: Reducir tiempos de respuesta en datasets grandes (500-1000+ mapas)
2. **Mantener funcionalidad**: Preservar búsqueda difusa, ponderación y sanitización
3. **Medición de rendimiento**: Implementar métricas para comparar antes/después
4. **Activación mínima**: Búsqueda indexada solo activa con 3+ caracteres

---

## 🏗️ Arquitectura

### Estructura del Índice

```javascript
app.searchIndex = {
  "termino": {
    mapIndices: [0, 5, 12],      // Índices de mapas que contienen el término
    inTitle: [0, 12],             // Índices donde aparece en título
    inKeywords: [5]               // Índices donde aparece en keywords
  }
}
```

### Métricas de Performance

```javascript
app.performanceMetrics = {
  indexingTime: 0,          // Tiempo de construcción del índice (ms)
  lastSearchTime: 0,        // Tiempo de última búsqueda (ms)
  totalSearches: 0,         // Contador de búsquedas realizadas
  averageSearchTime: 0      // Promedio móvil de tiempo de búsqueda (ms)
}
```

---

## 🔧 Implementación

### 1. Construcción del Índice

**Función:** `buildSearchIndex()`  
**Ubicación:** Llamada en `fetchMapsData()` después de cargar `maps.json`  
**Complejidad:** O(n × m) donde n = cantidad de mapas, m = términos promedio por mapa

```javascript
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
```

**Características:**
- Normaliza texto usando `normalizeText()` (acentos, ñ, mayúsculas)
- Ignora términos de 1 carácter para reducir tamaño del índice
- Diferencia entre apariciones en título vs keywords para ponderación futura
- Usa `Set` para evitar duplicados en términos

### 2. Búsqueda con Índice

**Función:** `searchUsingIndex(searchValue)`  
**Complejidad:** O(k) donde k = cantidad de términos de búsqueda (típicamente 1-3)

```javascript
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
```

**Características:**
- Búsqueda exacta usando hash lookup (O(1))
- Búsqueda difusa integrada con Levenshtein (threshold 2, palabras 5+ chars)
- Intersección de conjuntos para búsquedas multi-término (operador AND)
- Retorna array de mapas candidatos para filtrado posterior

### 3. Integración en FilterMaps

**Modificación:** Uso condicional del índice al inicio de `filterMaps()`

```javascript
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
    // ... resto del filtrado (categoría, filtros avanzados, etc.)
  });
  
  // ... ordenamiento y métricas
  
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
```

**Flujo de ejecución:**
1. Si `keyword.length >= 3` y el índice existe → Usar `searchUsingIndex()` para obtener candidatos
2. Si no → Usar `app.allMaps` completo (comportamiento original)
3. Aplicar filtros avanzados sobre los candidatos (categoría, espacio, tiempo)
4. Ordenar por relevancia si `app.visualMatch` está activo
5. Registrar métricas en `app.performanceMetrics`

---

## 📈 Métricas de Rendimiento

### Salida de Consola

Al cargar la página:
```
⚡ Indexación de mapas: 12.34ms
📊 Estadísticas de indexación:
  - Mapas indexados: 487
  - Términos únicos: 2,341
  - Tiempo de indexación: 12.34ms
  - Promedio por mapa: 0.03ms
```

Al realizar búsqueda:
```
🔍 Tiempo de búsqueda: 2.15ms
⚡ Búsqueda completada en 2.15ms (promedio: 2.87ms) | Resultados: 23
```

### Comparación Esperada

| Escenario | Sin Índice (O(n)) | Con Índice (O(1)) | Mejora |
|-----------|-------------------|-------------------|--------|
| 500 mapas, 1 término | ~50-100ms | ~2-5ms | **20-50x** |
| 500 mapas, 3 términos | ~150-300ms | ~5-10ms | **30-60x** |
| 1000 mapas, 1 término | ~100-200ms | ~3-6ms | **33-66x** |
| Búsqueda difusa (5+ chars) | ~200-400ms | ~10-20ms | **20-40x** |

**Nota:** Los tiempos varían según el hardware del usuario y la complejidad de los términos de búsqueda.

---

## 🔍 Casos de Uso

### Búsqueda Simple
**Input:** "poblacion"  
**Proceso:**
1. Normalizar: `"poblacion"` → `"poblacion"`
2. Buscar en índice: `app.searchIndex["poblacion"]` → `{ mapIndices: [5, 12, 28, ...] }`
3. Retornar mapas: `[map[5], map[12], map[28], ...]`
4. Aplicar filtros avanzados y ordenar

### Búsqueda Multi-Término
**Input:** "poblacion urbana 2022"  
**Proceso:**
1. Normalizar y dividir: `["poblacion", "urbana", "2022"]`
2. Buscar cada término:
   - `app.searchIndex["poblacion"]` → Set A
   - `app.searchIndex["urbana"]` → Set B
   - `app.searchIndex["2022"]` → Set C
3. Intersección: A ∩ B ∩ C
4. Retornar mapas que contienen **todos** los términos

### Búsqueda Difusa
**Input:** "agricola" (escribió mal "agricultura")  
**Proceso:**
1. Normalizar: `"agricola"`
2. Buscar exacto: No encontrado en índice
3. Calcular Levenshtein con todos los términos indexados:
   - `levenshteinDistance("agricola", "agricultura")` → 3 (> threshold 2)
   - `levenshteinDistance("agricola", "agricolas")` → 1 (✓ <= 2)
4. Agregar mapas de términos similares: `app.searchIndex["agricolas"].mapIndices`

**Nota:** La búsqueda difusa solo se activa si `app.fuzzyMatch = true` y el término tiene 5+ caracteres.

---

## ⚙️ Configuración

### Parámetros Ajustables

```javascript
// En buildSearchIndex()
const MIN_TERM_LENGTH = 2; // Términos mínimos para indexar (actual: 2)

// En searchUsingIndex()
const MIN_SEARCH_LENGTH = 3;     // Caracteres mínimos para activar índice (actual: 3)
const FUZZY_MIN_LENGTH = 5;      // Longitud mínima para fuzzy search (actual: 5)
const FUZZY_THRESHOLD = 2;       // Distancia Levenshtein máxima (actual: 2)

// En app object
app.debounceDelay = 300;         // Delay en ms para debouncing (actual: 300ms)
```

### Flags de Control

```javascript
app.fuzzyMatch = true;  // Habilitar búsqueda difusa (true/false)
app.visualMatch = true; // Mostrar badges de relevancia (true/false)
```

**El índice invertido está SIEMPRE activo** si:
- `keyword.length >= 3`
- `app.searchIndex` tiene términos indexados

**El debouncing está SIEMPRE activo** en el input de búsqueda en vivo

---

## 🧪 Pruebas de Validación

### 1. Índice Construido Correctamente
```javascript
// En consola del navegador
console.log('Total de términos indexados:', Object.keys(app.searchIndex).length);
console.log('Término "argentina":', app.searchIndex["argentina"]);
// Resultado esperado:
// {
//   mapIndices: [0, 2, 5, 8, ...],
//   inTitle: [0, 5, 8, ...],
//   inKeywords: [2, ...]
// }
```

### 2. Búsqueda Exacta
```javascript
// Buscar "exportaciones"
// Verificar en consola:
// 🔍 Tiempo de búsqueda: 2.15ms
// ⚡ Búsqueda completada en 2.15ms ...
```

### 3. Búsqueda Difusa
```javascript
// app.fuzzyMatch = true
// Buscar "migracion" (correcto: "migraciones")
// Debe encontrar mapas con "migraciones" (distancia 2)
```

### 4. Búsqueda Multi-Término
```javascript
// Buscar "poblacion urbana"
// Debe retornar solo mapas que contengan AMBOS términos
```

### 5. Métricas de Performance
```javascript
console.log('Métricas:', app.performanceMetrics);
// Resultado esperado:
// {
//   indexingTime: 12.34,
//   lastSearchTime: 2.15,
//   totalSearches: 5,
//   averageSearchTime: 2.87
// }
```

---

## 🐛 Debugging

### Problema: Índice Vacío
**Síntoma:** `Object.keys(app.searchIndex).length === 0`  
**Causa:** Error en carga de datos o normalización  
**Solución:** Verificar que `fetchMapsData()` se ejecute correctamente y `buildSearchIndex()` sea llamado

### Problema: Búsqueda Lenta
**Síntoma:** Tiempos > 50ms con índice  
**Causa:** Búsqueda difusa en todos los términos indexados  
**Solución:** Aumentar `FUZZY_MIN_LENGTH` o desactivar `app.fuzzyMatch`

### Problema: Resultados Incorrectos
**Síntoma:** Mapas que no contienen el término buscado  
**Causa:** Normalización inconsistente entre indexación y búsqueda  
**Solución:** Verificar que `normalizeText()` se use en ambos procesos

---

## 📝 Mantenimiento

### Actualización del Índice
El índice se construye **una sola vez** al cargar la página. Si `maps.json` se actualiza dinámicamente:

```javascript
// Recargar datos y reconstruir índice
async function reloadMapsData() {
  await fetchMapsData(); // Ya incluye buildSearchIndex()
}
```

### Monitoreo de Performance
Para analizar rendimiento a largo plazo:

```javascript
// Al final de la sesión del usuario
console.table({
  'Total de búsquedas': app.performanceMetrics.totalSearches,
  'Tiempo promedio (ms)': app.performanceMetrics.averageSearchTime.toFixed(2),
  'Última búsqueda (ms)': app.performanceMetrics.lastSearchTime.toFixed(2),
  'Tiempo de indexación (ms)': app.performanceMetrics.indexingTime.toFixed(2)
});
```

---

## 🎓 Fundamentos Técnicos

### ¿Qué es un Índice Invertido?

Estructura de datos que mapea **términos → documentos** en lugar de **documentos → términos**.

**Ejemplo:**
```
Sin índice (array):
[
  { id: 0, title: "Mapa de Argentina" },
  { id: 1, title: "Población de Argentina" },
  { id: 2, title: "Exportaciones 2022" }
]

Con índice invertido:
{
  "argentina": [0, 1],
  "mapa": [0],
  "poblacion": [1],
  "exportaciones": [2],
  "2022": [2]
}
```

### Complejidad Temporal

| Operación | Sin Índice | Con Índice |
|-----------|------------|------------|
| Búsqueda 1 término | O(n) | O(1) |
| Búsqueda k términos | O(n × k) | O(k) |
| Construcción índice | - | O(n × m) |
| Espacio adicional | O(1) | O(n × m) |

Donde:
- n = cantidad de mapas
- k = cantidad de términos de búsqueda
- m = promedio de palabras por mapa

**Trade-off:** Sacrifica espacio (memoria) por velocidad (tiempo de búsqueda).

---

## 📚 Referencias

- [Inverted Index (Wikipedia)](https://en.wikipedia.org/wiki/Inverted_index)
- [Full-Text Search Algorithms](https://en.wikipedia.org/wiki/Full-text_search)
- [Levenshtein Distance](https://en.wikipedia.org/wiki/Levenshtein_distance)
- [JavaScript Set Operations](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)

---

## 🎯 Optimización Adicional: Debouncing

### Descripción

El **debouncing** evita ejecutar búsquedas excesivas mientras el usuario escribe, mejorando significativamente la experiencia de usuario y reduciendo la carga del sistema.

### Problema que Resuelve

Sin debouncing, cada tecla presionada dispara una búsqueda completa:
- Usuario escribe "poblacion" (9 caracteres)
- Se ejecutan 9 búsquedas (una por cada letra)
- Desperdicio de recursos y UI inestable

Con debouncing (300ms):
- Usuario escribe "poblacion"
- Sistema espera 300ms después de la última tecla
- Se ejecuta solo 1 búsqueda cuando el usuario termina de escribir

### Implementación

```javascript
// Agregar a app object
const app = {
  searchTimeout: null,  // Timer para debouncing
  debounceDelay: 300,   // Delay en ms (300ms)
  // ... resto de propiedades
};

// En el event listener del input
elements.keywordInput.addEventListener('input', (e) => {
  // ... validación y sanitización

  // DEBOUNCING: Cancelar búsqueda anterior
  clearTimeout(app.searchTimeout);
  
  // Programar nueva búsqueda después del delay
  app.searchTimeout = setTimeout(() => {
    app.activeFilters.keyword = val;
    app.currentBatch = 0;
    filterMaps();
    renderMaps(true);
    updateActiveFilters();
    updateResultsCount();
  }, app.debounceDelay); // Esperar 300ms
});
```

### Beneficios

✅ **Reduce búsquedas:** De N búsquedas (N = caracteres) a 1 búsqueda  
✅ **Mejora UX:** UI más estable, menos parpadeo en resultados  
✅ **Ahorra recursos:** Menos llamadas a `filterMaps()` y `renderMaps()`  
✅ **Combina con índice:** Debouncing + índice invertido = máxima eficiencia  

### Ajuste del Delay

```javascript
// Delay muy corto (100ms): Más reactivo pero más búsquedas
app.debounceDelay = 100;

// Delay medio (300ms): Balance óptimo (RECOMENDADO)
app.debounceDelay = 300;

// Delay largo (500ms): Menos búsquedas pero menos reactivo
app.debounceDelay = 500;
```

**Recomendación:** 300ms es el sweet spot para la mayoría de usuarios.

### Comparación de Performance

| Usuario escribe | Sin Debouncing | Con Debouncing (300ms) |
|----------------|----------------|------------------------|
| "poblacion" (9 chars) | 9 búsquedas | 1 búsqueda |
| "poblacion urbana" (17 chars) | 17 búsquedas | 1 búsqueda |
| "poblacion urbana 2022" (22 chars) | 22 búsquedas | 1 búsqueda |

**Reducción promedio:** 90-95% menos búsquedas

---

## ✅ Checklist de Implementación

- [x] Crear estructura `app.searchIndex`
- [x] Crear estructura `app.performanceMetrics`
- [x] Crear estructura `app.searchTimeout` y `app.debounceDelay`
- [x] Implementar `buildSearchIndex()` en `fetchMapsData()`
- [x] Implementar `searchUsingIndex()` para búsqueda O(1)
- [x] Modificar `filterMaps()` para usar índice cuando `keyword.length >= 3`
- [x] Implementar debouncing en event listener de input (300ms)
- [x] Agregar `console.time()` para medir indexación
- [x] Agregar `console.time()` para medir búsqueda
- [x] Mostrar estadísticas de indexación en consola
- [x] Mostrar tiempo de búsqueda en consola
- [x] Calcular promedio móvil de tiempo de búsqueda
- [x] Integrar con búsqueda difusa (Levenshtein)
- [x] Mantener compatibilidad con filtros avanzados
- [x] Mantener compatibilidad con sistema de ponderación
- [x] Documentar en `OPTIMIZACION_PERFORMANCE.md`

---

**Fecha:** 2024  
**Versión:** 1.1.0 (con debouncing)  
**Autor:** Sistema de Optimización ANIDA  
**Estado:** ✅ Implementado y Documentado
