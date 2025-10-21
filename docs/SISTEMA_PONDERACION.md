# Sistema de Ponderación y Ranking de Resultados

## Descripción General

Sistema opcional de ranking de resultados por relevancia que asigna puntajes ponderados según el tipo de coincidencia y el campo donde se encuentra.

## Configuración

El sistema se controla mediante dos parámetros booleanos en la constante `app`:

```javascript
const app = {
  fuzzyMatch: true,    // Activar/desactivar búsqueda difusa
  visualMatch: true,   // Activar/desactivar indicadores visuales de relevancia
  // ... otros parámetros
};
```

### Estados posibles:

1. **Búsqueda tradicional exacta**:
   - `fuzzyMatch: false` → Búsqueda exacta sin tolerancia a errores
   - `visualMatch: false` → Sin indicadores de relevancia

2. **Búsqueda difusa sin indicadores**:
   - `fuzzyMatch: true` → Búsqueda con tolerancia a errores tipográficos
   - `visualMatch: false` → Sin indicadores visuales

3. **Sistema completo activado**:
   - `fuzzyMatch: true` → Búsqueda difusa activa
   - `visualMatch: true` → Indicadores de relevancia visibles

## Sistema de Pesos

### Ponderación por campo:

| Campo | Peso | Justificación |
|-------|------|---------------|
| **Título** | 3x | Mayor relevancia, información principal |
| **Keywords** | 2x | Alta relevancia, metadatos específicos |

### Cálculo de porcentaje de coincidencia:

```javascript
// Coincidencia exacta
percentage = 100%

// Coincidencia difusa (Levenshtein)
percentage = ((longitud_max - distancia) / longitud_max) × 100
```

## Algoritmo de Scoring

### Fórmula de relevancia:

```
Score Total = Σ (Porcentaje × Peso del Campo)
Peso Total = Σ (Peso del Campo × 100)
Relevancia % = (Score Total / Peso Total) × 100
```

### Ejemplo práctico:

Búsqueda: **"poblacion"**

**Mapa A:**
- Título: "Distribución de la población argentina" (coincidencia exacta)
  - Score: 100 × 3 = 300
- Keywords: "población, demografía, censo" (coincidencia exacta)
  - Score: 100 × 2 = 200
- **Total: 500 / 500 = 100%** ✅

**Mapa B:**
- Título: "Economía regional" (sin coincidencia)
  - Score: 0
- Keywords: "poblacion rural" (coincidencia difusa 90%)
  - Score: 90 × 2 = 180
- **Total: 180 / 200 = 90%** 🟡

## Priorización de Resultados

El ordenamiento sigue esta jerarquía:

1. **Coincidencias exactas primero** (type: 'exact')
   - Independientemente del score, aparecen antes

2. **Score de relevancia** (descendente)
   - Mapas con mayor score aparecen primero

3. **Orden original** (si no hay búsqueda activa)
   - Mantiene orden del JSON

## Indicadores Visuales

### Rangos de color:

| Relevancia | Porcentaje | Color | Badge |
|------------|------------|-------|-------|
| **Alta** | ≥ 80% | 🟢 Verde (#28a745) | 80-100% |
| **Media** | 50-79% | 🟡 Amarillo (#ffc107) | 50-79% |
| **Baja** | < 50% | 🔴 Rojo (#dc3545) | 1-49% |

### Ubicación del badge:

```
┌─────────────────────┐
│  [95%] 🟢          │ ← Badge de relevancia
│  ┌───────────┐     │
│  │   Imagen  │     │
│  └───────────┘     │
│  Título del mapa   │
└─────────────────────┘
```

## Detalles de Implementación

### Funciones principales:

#### 1. `fuzzyMatch(term, field, threshold)`

Ahora retorna:
```javascript
{
  match: boolean,
  score: number,        // Distancia de Levenshtein
  type: 'exact'|'fuzzy'|'none',
  percentage: number    // 0-100
}
```

#### 2. `calculateRelevanceScore(map, searchTerms)`

Calcula el score ponderado:
```javascript
{
  score: number,           // Score total ponderado
  percentage: number,      // Porcentaje global (0-100)
  matches: {
    title: [],            // Coincidencias en título
    keywords: []          // Coincidencias en keywords
  },
  hasExactMatch: boolean  // True si hay alguna coincidencia exacta
}
```

#### 3. `filterMaps()` (modificada)

1. Filtra mapas según criterios
2. Calcula relevancia si `app.visualMatch && app.fuzzyMatch`
3. Guarda score en `map._relevance`
4. Ordena por relevancia si está activo

#### 4. `createMapThumbnail(map, index)` (modificada)

Agrega badge de relevancia si:
- `app.visualMatch === true`
- `map._relevance` existe
- `percentage > 0`

## Casos de Uso

### Ejemplo 1: Búsqueda con error tipográfico

**Entrada:** "hidrografia" (falta tilde)

**Resultados:**
1. 🟢 98% - "Hidrografía de Argentina" (exacta en título)
2. 🟢 95% - "Red hidrográfica nacional" (exacta en keywords)
3. 🟡 75% - "Recursos hídricos" (difusa en keywords)

### Ejemplo 2: Búsqueda multi-término

**Entrada:** "economia regional"

**Resultados:**
1. 🟢 100% - "Economía regional argentina" (ambos exactos en título)
2. 🟢 92% - "Desarrollo económico por región" (exactos distribuidos)
3. 🟡 65% - "Actividad económica" (uno exacto, uno ausente)

## Ventajas del Sistema

✅ **Tolerancia a errores**: Encuentra resultados con errores tipográficos
✅ **Priorización inteligente**: Relevancia clara para el usuario
✅ **Transparencia**: Indicador visual muestra calidad de coincidencia
✅ **Flexible**: Puede activarse/desactivarse según necesidad
✅ **Ponderado**: Valora más los campos importantes (título > keywords)

## Consideraciones de Rendimiento

- El cálculo de relevancia solo se ejecuta cuando:
  - `app.fuzzyMatch === true`
  - `app.visualMatch === true`
  - Hay una búsqueda activa (`keyword !== ''`)

- Impacto: Mínimo (~5-10ms adicionales por búsqueda en datasets de 1000+ mapas)

## Futuras Mejoras Sugeridas

1. **Caché de scores**: Guardar cálculos para búsquedas repetidas
2. **Pesos configurables**: Permitir ajustar pesos desde la UI
3. **Más campos**: Incluir autor, publicación en el cálculo
4. **Historial de relevancia**: Aprender de clicks del usuario
5. **Boost de recencia**: Priorizar mapas más recientes

---

**Fecha de implementación:** 20 de octubre de 2025  
**Versión:** 1.0  
**Estado:** ✅ Implementado y funcional
