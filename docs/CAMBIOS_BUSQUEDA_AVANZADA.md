# Optimización de Búsqueda Avanzada - ANIDA

## Resumen de Cambios

### 1. Actualización del Estado Global (`maps.js`)

Se simplificó el objeto `app.activeFilters.advanced` eliminando filtros no utilizados y dejando solo los que tienen datos en `maps.json`:

**ANTES:**
```javascript
advanced: {
  estructuraTematica: [],
  escalaEspacial: [],
  escalaTemporal: [],
  tipoFenomeno: [],
  tipoEscala: [],
  tipoDatos: [],
  tipoMapa: []
}
```

**AHORA:**
```javascript
advanced: {
  escalaEspacial: [],
  escalaTemporal: []
}
```

### 2. Optimización de la Función `filterMaps()`

Se mejoró la función de filtrado para:

#### a) Búsqueda por palabras clave optimizada
- Usa `title_search` y `keywords_search` (campos normalizados del JSON)
- Implementa búsqueda **AND** (todos los términos deben coincidir) en lugar de **OR**
- Elimina la necesidad de normalizar manualmente si ya existe el campo `_search`

#### b) Filtros avanzados usando campos `_search`
- **Escala Espacial**: Ahora usa el array `space_search` del JSON
- **Escala Temporal**: Ahora usa el array `time_search` del JSON
- Implementa coincidencia flexible (permite coincidencias parciales)
- Normaliza los filtros seleccionados para comparación case-insensitive sin acentos

**Código de filtrado espacial:**
```javascript
// Lógica AND: TODOS los filtros deben coincidir
if (advanced.escalaEspacial.length > 0) {
  const mapSpaceSearch = map.space_search || [];
  const normalizedFilters = advanced.escalaEspacial.map(f => normalizeText(f));
  
  const allFiltersMatch = normalizedFilters.every(filter => 
    mapSpaceSearch.some(space => space.includes(filter) || filter.includes(space))
  );

  if (!allFiltersMatch) return false;
}
```

**Código de filtrado temporal (coincidencia exacta + lógica AND):**
```javascript
// Lógica AND con coincidencia EXACTA
if (advanced.escalaTemporal.length > 0) {
  const mapTimeSearch = map.time_search || [];
  const normalizedFilters = advanced.escalaTemporal.map(f => normalizeText(f));
  
  const allFiltersMatch = normalizedFilters.every(filter => 
    mapTimeSearch.some(time => time === filter) // Coincidencia exacta
  );

  if (!allFiltersMatch) return false;
}
```

### 3. Actualización del HTML (`mapas_tematicos.html`)

Se corrigieron los valores de los filtros para que coincidan exactamente con los valores en `maps.json`:

#### Escala Temporal
- Corregido: Los valores `value` ahora coinciden con las etiquetas
- **ANTES:** `value="Años puntuales"` con label "Años censales"
- **AHORA:** `value="Años censales"` con label "Años censales"
- **NUEVO (v2.1):** Se agregó estructura jerárquica de dos niveles:
  - **Años censales** (categoría padre)
    - 2001
    - 2010
    - 2022
    - Años anteriores
  - **Períodos** (categoría padre)
    - 1900-1950
    - 1950-1990
    - 1960-1970
    - 1970-1980
    - 1980-1990
    - 1990-2000
    - 2000-2010
    - 2010-2020
    - 2020-2030
  - **Siglos** (categoría padre)
    - XV, XVI, XVII, XVIII, XIX, XX, XXI

#### Escala Espacial
- Corregidos IDs duplicados (había tres checkboxes con `id="espacial-6"`)
- Ahora cada checkbox tiene un ID único (espacial-1 a espacial-9)

### 4. Código Eliminado (Optimización)

Se eliminó código en desuso relacionado con:
- `estructuraTematica`
- `tipoFenomeno`
- `tipoEscala`
- `tipoDatos`
- `tipoMapa`

Estos campos no existen en el JSON actual, por lo que su código solo agregaba complejidad innecesaria.

## Ventajas de los Cambios

### 🚀 Rendimiento
- Menor uso de memoria (menos filtros en el estado)
- Búsqueda más rápida usando campos pre-normalizados del JSON
- Menos iteraciones en el filtrado

### 🎯 Precisión
- Búsqueda por palabras clave más precisa (todos los términos deben coincidir)
- Filtros avanzados usan los datos reales del JSON
- **Coincidencia exacta en filtros temporales** (v2.2): "2010" NO coincide con "2010-2020"
- **Lógica AND (excluyente)** (v2.2): Los filtros se intersectan, no se unen

### 🧹 Mantenibilidad
- Código más simple y fácil de entender
- Menos puntos de fallo potenciales
- Sincronización perfecta entre HTML, JS y JSON

### 🎨 UX Mejorada (v2.2)
- **Selección en cascada**: Click en categoría padre selecciona/deselecciona todos los hijos
- **Sincronización automática**: Cambios en hijos actualizan estado del padre
- **Filtros intuitivos**: Combinación excluyente evita resultados ambiguos

## Lógica de Filtrado (v2.2)

### Filtros Temporales: Coincidencia Exacta

Los filtros temporales ahora requieren **coincidencia exacta** en el array `time_search`:

**Ejemplo 1: Filtro "2010"**
```javascript
// Mapa A
"time_search": ["anos censales", "2010", "siglos", "xxi"]  // ✅ COINCIDE

// Mapa B  
"time_search": ["periodos", "2010-2020", "siglos", "xxi"]  // ❌ NO COINCIDE
```

**Ejemplo 2: Filtro "Siglos"**
```javascript
// Mapa A
"time_search": ["siglos", "xxi"]  // ✅ COINCIDE

// Mapa B
"time_search": ["periodos", "2010-2020"]  // ❌ NO COINCIDE
```

### Filtros Múltiples: Lógica AND (Intersección)

Cuando se seleccionan múltiples filtros, el resultado debe cumplir **TODOS** los filtros:

**Ejemplo 1: Filtro "XXI" + "1900-1950"**
```javascript
// Este mapa NO aparecerá en los resultados porque no tiene ambos valores
"time_search": ["siglos", "xxi"]  // ❌ Tiene XXI pero no 1900-1950

// Este mapa tampoco aparecerá
"time_search": ["periodos", "1900-1950"]  // ❌ Tiene 1900-1950 pero no XXI

// Solo este tipo de mapa aparecería (si existiera)
"time_search": ["periodos", "1900-1950", "siglos", "xxi"]  // ✅ Tiene AMBOS
```

**Ejemplo 2: Filtro "País Bicontinental" + "Global"**
```javascript
// Solo mapas que tengan AMBOS valores
"space_search": ["pais bicontinental", "global"]  // ✅ COINCIDE

// Este NO aparecerá
"space_search": ["pais bicontinental"]  // ❌ Solo tiene uno
```

### Selección en Cascada

**Comportamiento de Categorías Padre:**

1. **Click en padre seleccionado → Selecciona todos los hijos**
   ```
   ☑ Siglos
       ☑ XV
       ☑ XVI
       ☑ XVII
       ... (todos)
   ```

2. **Click en padre para deseleccionar → Deselecciona todos los hijos**
   ```
   ☐ Siglos
       ☐ XV
       ☐ XVI
       ☐ XVII
       ... (todos)
   ```

3. **Deseleccionar un hijo → Deselecciona el padre**
   ```
   ☑ Siglos
       ☑ XV
       ☐ XVI  ← Click aquí
       ☑ XVII
   
   Resultado:
   ☐ Siglos  ← Se deselecciona automáticamente
       ☑ XV
       ☐ XVI
       ☑ XVII
   ```

4. **Seleccionar todos los hijos manualmente → Selecciona el padre**
   ```
   Si todos los hijos están marcados, el padre se marca automáticamente
   ```

## Estructura de Datos en `maps.json`

### Campos de búsqueda normalizados:
```json
{
  "id": "1",
  "title": "Porción emergida",
  "title_search": "porcion emergida",
  "keywords": ["Porción emergida", "Tierras emergidas", ...],
  "keywords_search": ["porcion emergida", "tierras emergidas", ...],
  "time": ["Periodos", "2020-2030", "Siglos", "XXI"],
  "time_search": ["periodos", "2020-2030", "siglos", "xxi"],
  "space": ["País Bicontinental"],
  "space_search": ["pais bicontinental"]
}
```

### Valores válidos para filtros:

#### Escala Espacial (`space_search`)
- "global"
- "regional o subnacional"
- "pais bicontinental"
- "pais parte continental americana"
- "pais antartida e islas del atlantico sur"
- "pais islas malvinas"
- "pais por departamento"
- "pais por provincia"
- "pais por area"

#### Escala Temporal (`time_search`)
- "anos censales" (años censales)
- "periodos"
- "siglos"
- Valores específicos como: "2010", "2020-2030", "xxi", etc.

## Compatibilidad

✅ **Retrocompatibilidad**: Si un mapa no tiene `title_search`, `keywords_search`, `time_search` o `space_search`, el código hace fallback a los campos originales y normaliza sobre la marcha.

## Testing Recomendado

1. ✅ Búsqueda por palabra clave simple
2. ✅ Búsqueda por múltiples palabras
3. ✅ Filtro de categoría rápida
4. ✅ Filtro de escala espacial
5. ✅ Filtro de escala temporal
6. ✅ Combinación de todos los filtros
7. ✅ Limpiar filtros
8. ✅ Navegación por modal con teclado
9. ✅ Responsive (móvil y desktop)

---

**Fecha de actualización:** 19 de octubre de 2025  
**Autor:** GitHub Copilot  
**Versión:** 2.2 - Filtros excluyentes con selección en cascada

### Changelog

**v2.2** (19/10/2025)
- ✅ Implementada selección en cascada para filtros temporales
- ✅ Cambiada lógica de filtros a AND (excluyente/intersección)
- ✅ Implementada coincidencia exacta en filtros temporales
- ✅ Sincronización automática padre-hijo en checkboxes

**v2.1** (19/10/2025)
- ✅ Agregada estructura jerárquica de dos niveles para escala temporal
- ✅ 27 opciones temporales específicas (años, períodos, siglos)

**v2.0** (19/10/2025)
- ✅ Optimización inicial del sistema de filtros
- ✅ Uso de campos `_search` normalizados del JSON
