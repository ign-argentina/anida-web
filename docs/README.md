# 📚 Documentación - Sistema de Búsqueda Avanzada ANIDA

Índice de documentación técnica del sistema de filtros y búsqueda de mapas temáticos.

---

## 📖 Documentos Principales

### 1. [CHANGELOG.md](../CHANGELOG.md)
**Registro completo de versiones**
- Historial de cambios desde v1.0 hasta v2.3.1
- Changelog detallado con fechas y métricas
- Roadmap de funcionalidades futuras

**Última versión:** 2.3.1 (19 oct 2025)

---

### 2. [CAMBIOS_BUSQUEDA_AVANZADA.md](./CAMBIOS_BUSQUEDA_AVANZADA.md)
**Documentación técnica completa**
- Optimizaciones de v2.0: Campos normalizados
- Jerarquía de filtros de v2.1
- Selección en cascada de v2.2
- Lógica híbrida OR/AND de v2.3
- Ejemplos de código y casos de uso

**Para:** Desarrolladores que necesitan entender la arquitectura completa

---

### 3. [IMPLEMENTACION_V2.3.md](./IMPLEMENTACION_V2.3.md)
**Guía visual de v2.3**
- Diagramas de comportamiento de filtros
- 4 ejemplos visuales de lógica OR/AND
- Tabla comparativa v2.2 vs v2.3
- Guía de uso para usuarios finales
- Casos que pueden dar 0 resultados

**Para:** QA, documentadores, y usuarios técnicos

---

## 🐛 Hotfixes y Correcciones

### 4. [FIX_FILTROS_PADRE.md](./FIX_FILTROS_PADRE.md)
**Fix crítico v2.3.1**
- Análisis detallado del bug (categorías padre → 0 resultados)
- Causa raíz con ejemplos de código
- Solución implementada paso a paso
- Comparación antes/después
- Lecciones aprendidas

**Para:** Desarrolladores investigando el bug o fixes similares

---

### 5. [RESUMEN_FIX_V2.3.1.md](./RESUMEN_FIX_V2.3.1.md)
**Diagrama visual del fix**
- Flujo completo del problema (antes)
- Flujo completo de la solución (después)
- Código clave comparado
- Tabla de diferencias
- Lógica detrás del fix

**Para:** Entender rápidamente el problema y la solución visual

---

## 🧪 Testing

### 6. [PRUEBAS_FILTROS.md](./PRUEBAS_FILTROS.md)
**Plan de pruebas completo**
- 20 casos de prueba detallados
- Tests de cascada, OR, AND, edge cases
- Tests de integración
- Checklist de validación

**Para:** QA y testing funcional

---

### 7. [PRUEBA_RAPIDA_V2.3.1.md](./PRUEBA_RAPIDA_V2.3.1.md)
**Guía de testing rápido del fix**
- 5 tests clave para validar v2.3.1
- Pasos específicos por test
- Resultados esperados vs anteriores
- Checklist de validación
- Troubleshooting si algo falla

**Para:** Testing rápido después del deploy del fix

---

## 📊 Guías por Rol

### Para Desarrolladores

**Empezar aquí:**
1. [CHANGELOG.md](../CHANGELOG.md) - Ver versión actual y cambios
2. [CAMBIOS_BUSQUEDA_AVANZADA.md](./CAMBIOS_BUSQUEDA_AVANZADA.md) - Entender arquitectura
3. [FIX_FILTROS_PADRE.md](./FIX_FILTROS_PADRE.md) - Comprender fixes recientes

**Archivos de código:**
- `js/maps.js` - Lógica principal de filtrado
- `mapas_tematicos.html` - Estructura de filtros
- `mapas_tematicos.css` - Estilos jerárquicos

---

### Para QA / Testing

**Empezar aquí:**
1. [PRUEBA_RAPIDA_V2.3.1.md](./PRUEBA_RAPIDA_V2.3.1.md) - Tests inmediatos
2. [PRUEBAS_FILTROS.md](./PRUEBAS_FILTROS.md) - Suite completa de tests
3. [IMPLEMENTACION_V2.3.md](./IMPLEMENTACION_V2.3.md) - Comportamiento esperado

**Casos críticos:**
- Seleccionar categorías padre debe mostrar resultados
- OR dentro de grupos (ej: 2010 + 2022)
- AND entre grupos (ej: 2010 + XXI)

---

### Para Product Managers / Documentación

**Empezar aquí:**
1. [CHANGELOG.md](../CHANGELOG.md) - Historial completo
2. [IMPLEMENTACION_V2.3.md](./IMPLEMENTACION_V2.3.md) - Funcionalidades actuales
3. [RESUMEN_FIX_V2.3.1.md](./RESUMEN_FIX_V2.3.1.md) - Últimos cambios visuales

**Para comunicar:**
- v2.3: Sistema flexible que permite comparaciones
- v2.3.1: Fix crítico de usabilidad (categorías padre)

---

## 🎯 Acceso Rápido por Pregunta

| Pregunta | Documento |
|----------|-----------|
| ¿Qué versión estamos? | [CHANGELOG.md](../CHANGELOG.md) |
| ¿Cómo funciona la lógica OR/AND? | [IMPLEMENTACION_V2.3.md](./IMPLEMENTACION_V2.3.md) |
| ¿Qué se arregló en v2.3.1? | [FIX_FILTROS_PADRE.md](./FIX_FILTROS_PADRE.md) |
| ¿Cómo pruebo el fix? | [PRUEBA_RAPIDA_V2.3.1.md](./PRUEBA_RAPIDA_V2.3.1.md) |
| ¿Por qué este diseño? | [CAMBIOS_BUSQUEDA_AVANZADA.md](./CAMBIOS_BUSQUEDA_AVANZADA.md) |
| ¿Qué tests debo hacer? | [PRUEBAS_FILTROS.md](./PRUEBAS_FILTROS.md) |

---

## 🔍 Conceptos Clave

### Lógica de Filtrado v2.3+

```
FILTROS TEMPORALES:
├─ Dentro de grupo → OR (comparar múltiples años/períodos/siglos)
└─ Entre grupos → AND (precisión al combinar diferentes escalas)

FILTROS ESPACIALES:
└─ Entre opciones → OR (mostrar múltiples escalas geográficas)

COMBINACIÓN:
└─ Espacial + Temporal → AND (precisión máxima)
```

### Jerarquía de Filtros

```
CATEGORÍA PADRE (UI)
├─ Hijo 1 (valor en datos)
├─ Hijo 2 (valor en datos)
└─ Hijo 3 (valor en datos)

Importante: Solo los hijos existen en maps.json
            Los padres son solo herramientas de UI
```

### Cascada de Selección

```
Click en padre → Marca/desmarca todos los hijos
Click en hijo → Ajusta estado del padre automáticamente
```

---

## 📈 Historial de Versiones (Resumen)

| Versión | Fecha | Cambio Principal |
|---------|-------|------------------|
| **2.3.1** | 19 oct 2025 | 🐛 Fix: Categorías padre funcionan correctamente |
| **2.3** | 19 oct 2025 | ✨ Lógica híbrida OR/AND |
| **2.2** | 18 oct 2025 | ✨ Selección en cascada + coincidencia exacta |
| **2.1** | 18 oct 2025 | ✨ Filtros jerárquicos de 2 niveles |
| **2.0** | 17 oct 2025 | ⚡ Optimización con campos normalizados |
| **1.0** | 15 oct 2025 | 🎉 Versión inicial |

---

## 🚀 Estado Actual

### ✅ Funcionalidades Implementadas

- [x] Búsqueda por palabras clave (AND lógico)
- [x] Filtros de categoría rápida
- [x] Filtros espaciales con OR
- [x] Filtros temporales jerárquicos (27 opciones)
- [x] Selección en cascada (padre-hijo)
- [x] Lógica híbrida OR/AND
- [x] Coincidencia exacta en filtros temporales
- [x] Paginación (cargar más)
- [x] Sistema de miniaturas
- [x] Modal de detalles

### 🐛 Bugs Conocidos

- Ninguno reportado en v2.3.1

### 🔮 Próximos Pasos (Roadmap)

Ver sección completa en [CHANGELOG.md](../CHANGELOG.md)

---

## 📞 Contacto

**Repositorio:** anida-web  
**Branch actual:** buscador  
**Mantenedores:** IGN Argentina

Para reportar bugs o sugerir mejoras, crear un issue en el repositorio.

---

**Última actualización:** 19 de octubre de 2025  
**Versión de documentación:** 1.0
