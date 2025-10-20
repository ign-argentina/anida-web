# Guía de Pruebas - Sistema de Filtros v2.2

## Pruebas de Selección en Cascada

### Test 1: Seleccionar categoría padre
**Acción:** Click en checkbox "Siglos"

**Resultado esperado:**
- ✅ Checkbox "Siglos" se marca
- ✅ Todos los hijos (XV, XVI, XVII, XVIII, XIX, XX, XXI) se marcan automáticamente
- ✅ Los filtros activos muestran: "Siglos", "XV", "XVI", "XVII", etc.

### Test 2: Deseleccionar categoría padre
**Setup:** Tener "Siglos" y todos sus hijos seleccionados

**Acción:** Click en checkbox "Siglos" para deseleccionar

**Resultado esperado:**
- ✅ Checkbox "Siglos" se desmarca
- ✅ Todos los hijos (XV, XVI, XVII, XVIII, XIX, XX, XXI) se desmarcan automáticamente
- ✅ Los filtros activos se limpian completamente

### Test 3: Deseleccionar un hijo
**Setup:** Tener "Periodos" y todos sus hijos seleccionados

**Acción:** Click en checkbox "2000-2010" para deseleccionar

**Resultado esperado:**
- ✅ Checkbox "2000-2010" se desmarca
- ✅ Checkbox "Periodos" (padre) se desmarca automáticamente
- ✅ Los demás hijos permanecen seleccionados
- ✅ Los filtros activos reflejan el cambio

### Test 4: Seleccionar todos los hijos manualmente
**Setup:** Todos los checkboxes desmarcados

**Acción:** Seleccionar manualmente: 2001, 2010, 2022, Años anteriores (uno por uno)

**Resultado esperado:**
- ✅ Cuando se marca el último hijo, "Años censales" (padre) se marca automáticamente
- ✅ Los filtros activos muestran tanto el padre como los hijos

### Test 5: Selección parcial de hijos
**Setup:** Todos los checkboxes desmarcados

**Acción:** Seleccionar solo "XV" y "XVI"

**Resultado esperado:**
- ✅ Solo "XV" y "XVI" están marcados
- ✅ "Siglos" (padre) NO se marca automáticamente
- ✅ Los filtros activos muestran solo: "XV", "XVI"

---

## Pruebas de Coincidencia Exacta

### Test 6: Filtro "2010" - Coincidencia exacta
**Acción:** Seleccionar solo el filtro "2010"

**Resultado esperado:**
- ✅ Muestra mapas con `"2010"` en `time_search`
- ❌ NO muestra mapas con `"2010-2020"` (aunque contenga "2010")
- ❌ NO muestra mapas con `"2001"` o `"2022"`

**Ejemplo de mapas que deben aparecer:**
```json
{
  "time_search": ["anos censales", "2010", "siglos", "xxi"]
}
```

**Ejemplo de mapas que NO deben aparecer:**
```json
{
  "time_search": ["periodos", "2010-2020", "siglos", "xxi"]
}
```

### Test 7: Filtro "XXI" - Coincidencia exacta
**Acción:** Seleccionar solo el filtro "XXI"

**Resultado esperado:**
- ✅ Muestra mapas con `"xxi"` en `time_search`
- ❌ NO muestra mapas con solo `"xx"` o `"xix"`

---

## Pruebas de Lógica AND (Filtros Excluyentes)

### Test 8: Filtros incompatibles
**Acción:** Seleccionar "XXI" + "1900-1950"

**Resultado esperado:**
- ❌ **0 resultados** (no hay mapas con ambos valores)
- ✅ El contador muestra "0 resultados"
- ✅ Los filtros activos muestran ambos: "XXI" y "1900-1950"
- ✅ Mensaje claro de que no hay coincidencias

**Explicación:** Un mapa debe tener AMBOS valores para aparecer. Como es poco probable que un mapa tenga un siglo moderno (XXI) y un período antiguo (1900-1950), no habrá resultados.

### Test 9: Filtros compatibles
**Acción:** Seleccionar "Periodos" + "2020-2030"

**Resultado esperado:**
- ✅ Muestra mapas que tienen AMBOS valores en `time_search`:
  ```json
  {
    "time_search": ["periodos", "2020-2030", "siglos", "xxi"]
  }
  ```
- ❌ NO muestra mapas que solo tienen "periodos" sin "2020-2030"
- ❌ NO muestra mapas que solo tienen "2020-2030" sin "periodos"

### Test 10: Múltiples filtros de diferentes categorías
**Acción:** Seleccionar "2010" + "XXI" + "País por provincia"

**Resultado esperado:**
- ✅ Muestra solo mapas que tienen:
  - "2010" en `time_search` Y
  - "xxi" en `time_search` Y
  - "pais por provincia" en `space_search`
- ❌ NO muestra mapas que solo cumplen 1 o 2 de los 3 requisitos

**Ejemplo de mapa válido:**
```json
{
  "time_search": ["anos censales", "2010", "siglos", "xxi"],
  "space_search": ["pais parte continental americana", "pais por provincia"]
}
```

### Test 11: Filtros espaciales múltiples
**Acción:** Seleccionar "País Bicontinental" + "País por provincia"

**Resultado esperado:**
- ✅ Muestra mapas que tienen AMBOS en `space_search`:
  ```json
  {
    "space_search": ["pais bicontinental", "pais por provincia"]
  }
  ```
- ❌ NO muestra mapas con solo uno de los dos valores

---

## Pruebas de Integración

### Test 12: Combinación completa
**Acción:** 
1. Seleccionar categoría rápida: "Argentina socio-demográfica"
2. Seleccionar filtro espacial: "País por provincia"
3. Seleccionar filtro temporal: "2010"
4. Escribir palabra clave: "población"

**Resultado esperado:**
- ✅ Muestra solo mapas que cumplen TODAS las condiciones:
  - `section` = "Argentina socio-demográfica"
  - `space_search` contiene "pais por provincia"
  - `time_search` contiene exactamente "2010"
  - `title_search` o `keywords_search` contienen "poblacion"

### Test 13: Limpiar filtros
**Setup:** Tener múltiples filtros activos

**Acción:** Click en "Limpiar todos"

**Resultado esperado:**
- ✅ Todos los checkboxes se desmarcan
- ✅ Input de búsqueda se limpia
- ✅ Categoría vuelve a "Todos"
- ✅ Los filtros activos desaparecen
- ✅ Se muestran todos los mapas nuevamente

### Test 14: Remover filtros individuales
**Setup:** Tener "XXI" + "2010" + "País Bicontinental"

**Acción:** Click en la "×" del filtro "XXI"

**Resultado esperado:**
- ✅ El checkbox "XXI" se desmarca
- ✅ El tag "XXI" desaparece de filtros activos
- ✅ Los otros filtros ("2010", "País Bicontinental") permanecen
- ✅ Los resultados se actualizan automáticamente

---

## Pruebas de Edge Cases

### Test 15: Seleccionar padre + deseleccionar padre + seleccionar hijo
**Acción:**
1. Click en "Siglos" (se marcan todos)
2. Click en "Siglos" (se desmarcan todos)
3. Click en "XXI"

**Resultado esperado:**
- ✅ Solo "XXI" está marcado
- ✅ "Siglos" NO está marcado
- ✅ Los demás siglos NO están marcados

### Test 16: Búsqueda con filtros excluyentes sin resultados
**Acción:** Configurar filtros que definitivamente no tienen intersección

**Resultado esperado:**
- ✅ Muestra "0 resultados"
- ✅ Grid de mapas vacío
- ✅ Botón "Cargar más" oculto
- ✅ Los filtros activos siguen visibles
- ✅ No hay errores en consola

### Test 17: Cambio de categoría rápida con filtros avanzados activos
**Setup:** Tener filtros avanzados activos

**Acción:** Cambiar categoría rápida de "Todos" a "Argentina económica"

**Resultado esperado:**
- ✅ Los filtros avanzados permanecen activos
- ✅ Se aplican AMBOS filtros (categoría + avanzados)
- ✅ Los resultados reflejan la intersección de ambos

---

## Pruebas de Rendimiento

### Test 18: Muchos filtros simultáneos
**Acción:** Seleccionar 10+ filtros de diferentes categorías

**Resultado esperado:**
- ✅ La aplicación responde sin lag
- ✅ Los resultados se actualizan rápidamente
- ✅ No hay errores en consola
- ✅ El scroll funciona correctamente

### Test 19: Alternar rápidamente entre filtros
**Acción:** Hacer click rápidamente en varios checkboxes (on/off/on/off)

**Resultado esperado:**
- ✅ Todos los cambios se reflejan correctamente
- ✅ No hay estados inconsistentes
- ✅ Los filtros activos se actualizan correctamente

---

## Validación de Datos

### Test 20: Verificar normalización
**Acción:** Seleccionar "Años censales" (con tilde)

**Resultado esperado:**
- ✅ Encuentra mapas con "anos censales" (sin tilde) en JSON
- ✅ La búsqueda es case-insensitive
- ✅ Los acentos se ignoran correctamente

---

## Checklist de Pruebas

- [ ] Test 1-5: Selección en cascada
- [ ] Test 6-7: Coincidencia exacta
- [ ] Test 8-11: Lógica AND (excluyente)
- [ ] Test 12-14: Integración
- [ ] Test 15-17: Edge cases
- [ ] Test 18-19: Rendimiento
- [ ] Test 20: Normalización

## Resultado Final

**Total de pruebas:** 20  
**Aprobadas:** ___  
**Fallidas:** ___  
**Bloqueadas:** ___  

**Fecha de prueba:** ___________  
**Tester:** ___________  
**Notas adicionales:** ___________
