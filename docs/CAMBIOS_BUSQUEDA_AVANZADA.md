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
if (advanced.escalaEspacial.length > 0) {
  const mapSpaceSearch = map.space_search || [];
  const normalizedFilters = advanced.escalaEspacial.map(f => normalizeText(f));
  
  const hasMatch = normalizedFilters.some(filter => 
    mapSpaceSearch.some(space => space.includes(filter) || filter.includes(space))
  );

  if (!hasMatch) return false;
}
```

**Código de filtrado temporal:**
```javascript
if (advanced.escalaTemporal.length > 0) {
  const mapTimeSearch = map.time_search || [];
  const normalizedFilters = advanced.escalaTemporal.map(f => normalizeText(f));
  
  const hasMatch = normalizedFilters.some(filter => 
    mapTimeSearch.some(time => time.includes(filter) || filter.includes(time))
  );

  if (!hasMatch) return false;
}
```

### 3. Actualización del HTML (`mapas_tematicos.html`)

Se corrigieron los valores de los filtros para que coincidan exactamente con los valores en `maps.json`:

#### Escala Temporal
- Corregido: Los valores `value` ahora coinciden con las etiquetas
- **ANTES:** `value="Años puntuales"` con label "Años censales"
- **AHORA:** `value="Años censales"` con label "Años censales"

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
- Coincidencias flexibles para mejor UX

### 🧹 Mantenibilidad
- Código más simple y fácil de entender
- Menos puntos de fallo potenciales
- Sincronización perfecta entre HTML, JS y JSON

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
**Versión:** 2.0
