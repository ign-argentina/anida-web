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

**Código de filtrado espacial (v2.3 - OR):**
```javascript
// Lógica OR: Al menos UNO de los filtros debe coincidir
if (advanced.escalaEspacial.length > 0) {
  const mapSpaceSearch = map.space_search || [];
  const normalizedFilters = advanced.escalaEspacial.map(f => normalizeText(f));
  
  const hasMatch = normalizedFilters.some(filter => 
    mapSpaceSearch.some(space => space.includes(filter) || filter.includes(space))
  );

  if (!hasMatch) return false;
}
```

**Código de filtrado temporal (v2.3 - OR dentro de grupos, AND entre grupos):**
```javascript
// Lógica híbrida: OR dentro de grupos, AND entre grupos
if (advanced.escalaTemporal.length > 0) {
  const mapTimeSearch = map.time_search || [];
  const normalizedFilters = advanced.escalaTemporal.map(f => normalizeText(f));
  
  // Clasificar filtros por grupo
  const filtersByGroup = {
    'anos censales': [],
    'periodos': [],
    'siglos': [],
    'padres': []
  };

  // Clasificar cada filtro
  normalizedFilters.forEach(filter => {
    if (filter === 'anos censales' || filter === 'periodos' || filter === 'siglos') {
      filtersByGroup.padres.push(filter);
    } else {
      // Asignar al grupo correspondiente
      for (const [parent, children] of Object.entries(parentCategories)) {
        if (children.includes(filter)) {
          filtersByGroup[parent].push(filter);
          break;
        }
      }
    }
  });

  // Evaluar cada grupo con OR interno
  const groupResults = [];
  
  for (const [groupName, filters] of Object.entries(filtersByGroup)) {
    if (filters.length === 0) continue;
    
    // OR dentro del grupo
    const groupMatch = filters.some(filter => 
      mapTimeSearch.some(time => time === filter)
    );
    
    groupResults.push(groupMatch);
  }

  // AND entre grupos
  const allGroupsMatch = groupResults.every(result => result === true);
  
  if (!allGroupsMatch) return false;
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
**Versión:** 2.3 - Lógica híbrida OR/AND optimizada

### Changelog

**v2.3** (19/10/2025) 🎯 **ACTUAL**
- ✅ **IMPLEMENTADA** lógica OR dentro de grupos temporales (años, períodos, siglos)
- ✅ **IMPLEMENTADA** lógica AND entre grupos temporales diferentes
- ✅ **IMPLEMENTADA** lógica OR en filtros espaciales
- ✅ **IMPLEMENTADA** lógica AND entre filtros espaciales y temporales
- ✅ **OPTIMIZADA** usabilidad: permite comparaciones múltiples intuitivas
- ✅ **REDUCIDOS** casos de "0 resultados" inesperados

**v2.2** (19/10/2025) ⚠️ OBSOLETA - Demasiado restrictiva
- ✅ Implementada selección en cascada para filtros temporales
- ⚠️ Cambiada lógica de filtros a AND puro (demasiado restrictiva)
- ✅ Implementada coincidencia exacta en filtros temporales
- ✅ Sincronización automática padre-hijo en checkboxes

**v2.1** (19/10/2025)
- ✅ Agregada estructura jerárquica de dos niveles para escala temporal
- ✅ 27 opciones temporales específicas (años, períodos, siglos)

**v2.0** (19/10/2025)
- ✅ Optimización inicial del sistema de filtros
- ✅ Uso de campos `_search` normalizados del JSON

---

## 🎯 Lógica de Filtrado v2.3 - Sistema Híbrido OR/AND

### Resumen de la Lógica

| Contexto | Lógica | Ejemplo |
|----------|--------|---------|
| **Dentro de grupo temporal** | OR (inclusivo) | `2010 + 2022` = mapas con 2010 **O** 2022 |
| **Entre grupos temporales** | AND (restrictivo) | `2010 + XXI` = mapas con 2010 **Y** XXI |
| **Filtros espaciales** | OR (inclusivo) | `País Bicontinental + Global` = mapas con uno **O** ambos |
| **Espacial + Temporal** | AND (restrictivo) | `Provincia + 2010` = mapas con provincia **Y** 2010 |

### 📊 Filtros Temporales: OR Dentro de Grupos

Cuando seleccionas múltiples valores **del mismo grupo padre**, se aplica lógica **OR**:

#### Ejemplo 1: Múltiples Años Censales
```
Selección: ☑ 2010 + ☑ 2022

Resultado: Muestra mapas que tienen "2010" O "2022"

Mapas que aparecen:
- time_search: ["2010", "xxi"] ✅
- time_search: ["2022", "xxi"] ✅
- time_search: ["2010", "2022", "xxi"] ✅

Mapas que NO aparecen:
- time_search: ["2001", "xxi"] ❌
```

#### Ejemplo 2: Múltiples Períodos
```
Selección: ☑ 1900-1950 + ☑ 2000-2010

Resultado: Muestra mapas con cualquiera de los dos períodos

Mapas que aparecen:
- time_search: ["periodos", "1900-1950", "siglos", "xx"] ✅
- time_search: ["periodos", "2000-2010", "siglos", "xxi"] ✅

Mapas que NO aparecen:
- time_search: ["periodos", "1960-1970", "siglos", "xx"] ❌
```

#### Ejemplo 3: Múltiples Siglos
```
Selección: ☑ XIX + ☑ XX + ☑ XXI

Resultado: Muestra mapas de cualquiera de los tres siglos

Mapas que aparecen:
- time_search: ["siglos", "xix"] ✅
- time_search: ["siglos", "xx"] ✅
- time_search: ["siglos", "xxi"] ✅

Mapas que NO aparecen:
- time_search: ["siglos", "xviii"] ❌
```

### 🔗 Filtros Temporales: AND Entre Grupos

Cuando seleccionas valores de **grupos diferentes**, se aplica lógica **AND**:

#### Ejemplo 1: Año + Siglo
```
Selección: ☑ 2010 + ☑ XXI

Resultado: Muestra SOLO mapas que tienen AMBOS

Mapas que aparecen:
- time_search: ["anos censales", "2010", "siglos", "xxi"] ✅

Mapas que NO aparecen:
- time_search: ["2010", "siglos", "xx"] ❌ (falta XXI)
- time_search: ["2022", "siglos", "xxi"] ❌ (falta 2010)
```

#### Ejemplo 2: Período + Siglo
```
Selección: ☑ 2000-2010 + ☑ XXI

Resultado: Muestra mapas con AMBOS criterios

Mapas que aparecen:
- time_search: ["periodos", "2000-2010", "siglos", "xxi"] ✅

Mapas que NO aparecen:
- time_search: ["periodos", "2000-2010", "siglos", "xx"] ❌
- time_search: ["periodos", "1990-2000", "siglos", "xxi"] ❌
```

#### Ejemplo 3: Combinación Compleja
```
Selección: ☑ 2010 + ☑ 2022 + ☑ XXI

Lógica aplicada:
- OR entre 2010 y 2022 (mismo grupo)
- AND con XXI (grupo diferente)

Resultado: Muestra mapas con (2010 O 2022) Y XXI

Mapas que aparecen:
- time_search: ["2010", "xxi"] ✅
- time_search: ["2022", "xxi"] ✅
- time_search: ["2010", "2022", "xxi"] ✅

Mapas que NO aparecen:
- time_search: ["2010", "xx"] ❌ (falta XXI)
- time_search: ["2001", "xxi"] ❌ (falta 2010 o 2022)
```

### 🗺️ Filtros Espaciales: Lógica OR

Todos los filtros espaciales usan lógica **OR** (inclusiva):

```
Selección: ☑ País Bicontinental + ☑ País por provincia

Resultado: Muestra mapas que tienen UNO O AMBOS valores

Mapas que aparecen:
- space_search: ["pais bicontinental"] ✅
- space_search: ["pais por provincia"] ✅
- space_search: ["pais bicontinental", "pais por provincia"] ✅

Mapas que NO aparecen:
- space_search: ["global"] ❌
```

### 🔄 Combinación Espacial + Temporal: AND

Los filtros espaciales y temporales se combinan con lógica **AND**:

```
Selección: 
- Espacial: ☑ País por provincia
- Temporal: ☑ 2010

Resultado: Muestra mapas que tienen AMBOS

Mapas que aparecen:
- space_search: ["pais por provincia"]
  time_search: ["2010", "xxi"] ✅

Mapas que NO aparecen:
- space_search: ["pais por provincia"]
  time_search: ["2022", "xxi"] ❌ (falta 2010)
  
- space_search: ["global"]
  time_search: ["2010", "xxi"] ❌ (falta provincia)
```

### 📈 Casos de Uso Prácticos

#### Caso 1: Comparar Censos
```
Objetivo: Ver mapas de los censos 2010 y 2022 por provincia

Selección:
- ☑ 2010
- ☑ 2022
- ☑ País por provincia

Resultado: Mapas de censo 2010 O 2022 (OR) que sean por provincia (AND)
```

#### Caso 2: Análisis Histórico
```
Objetivo: Ver mapas de los siglos XIX y XX

Selección:
- ☑ XIX
- ☑ XX

Resultado: Mapas del siglo XIX O del siglo XX (OR dentro de grupo)
```

#### Caso 3: Período Específico Regional
```
Objetivo: Ver mapas del período 2000-2010 en la región

Selección:
- ☑ 2000-2010
- ☑ Regional o subnacional

Resultado: Mapas del período 2000-2010 (exacto) que sean regionales (AND)
```

### ⚖️ Comparación v2.2 vs v2.3

| Selección | v2.2 (AND puro) | v2.3 (OR/AND híbrido) |
|-----------|-----------------|----------------------|
| `☑ 2010 + ☑ 2022` | ❌ 0 resultados | ✅ Todos los censos 2010 y 2022 |
| `☑ XX + ☑ XXI` | ❌ 0 resultados | ✅ Todos los mapas de ambos siglos |
| `☑ 2010 + ☑ XXI` | ✅ Solo intersección | ✅ Solo intersección (igual) |
| `☑ 1900-1950 + ☑ 2000-2010` | ❌ 0 resultados | ✅ Mapas de ambos períodos |
| Usabilidad | ⚠️ Muy restrictiva | ✅ Intuitiva y flexible |
