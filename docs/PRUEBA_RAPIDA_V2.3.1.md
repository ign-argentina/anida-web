# ✅ PRUEBA RÁPIDA - Fix v2.3.1

## Objetivo
Verificar que seleccionar categorías padre ahora devuelve resultados correctos.

---

## 🧪 Test 1: Seleccionar "Años censales"

### Pasos
1. Abrir `mapas_tematicos.html` en el navegador
2. Expandir el acordeón "Búsqueda avanzada"
3. En "Escala Temporal", hacer clic en el checkbox **"Años censales"**

### Resultado Esperado ✅
- Se marcan automáticamente: `2001`, `2010`, `2022`, `Años anteriores`
- Se muestran **TODOS** los mapas que contengan cualquiera de esos años
- **NO** aparece "0 resultados"

### Resultado Anterior ❌ (v2.3)
- Se marcaban los hijos correctamente
- Se mostraban **0 resultados** (buscaba "años censales" literal)

---

## 🧪 Test 2: Seleccionar "Períodos"

### Pasos
1. Hacer clic en el checkbox **"Períodos"**

### Resultado Esperado ✅
- Se marcan automáticamente los 9 períodos (1900-1950 hasta 2020-2030)
- Se muestran todos los mapas de cualquier período
- Múltiples resultados visibles

---

## 🧪 Test 3: Seleccionar "Siglos"

### Pasos
1. Hacer clic en el checkbox **"Siglos"**

### Resultado Esperado ✅
- Se marcan automáticamente: XV, XVI, XVII, XVIII, XIX, XX, XXI
- Se muestran todos los mapas de cualquier siglo
- Gran cantidad de resultados

---

## 🧪 Test 4: Combinación (Años censales + Siglo XXI)

### Pasos
1. **Desmarcar todos** los filtros
2. Hacer clic en **"Años censales"** (marca 2001, 2010, 2022, años anteriores)
3. Hacer clic TAMBIÉN en el checkbox individual **"XXI"**

### Resultado Esperado ✅
- **Lógica aplicada:** (2001 OR 2010 OR 2022 OR años anteriores) AND XXI
- Se muestran **solo** los mapas que:
  - Tengan uno de esos años Y
  - Sean del siglo XXI
- Ejemplo de mapas que deberían aparecer:
  - Mapa con `time_search: ["2010", "xxi"]` → ✅ SÍ
  - Mapa con `time_search: ["2022", "xxi"]` → ✅ SÍ
- Ejemplo de mapas que NO deberían aparecer:
  - Mapa con `time_search: ["2010", "xx"]` → ❌ NO (falta XXI)
  - Mapa con `time_search: ["1990", "xxi"]` → ❌ NO (falta año del grupo)

---

## 🧪 Test 5: Validación de Consola

### Pasos
1. Abrir DevTools (F12)
2. Ir a la pestaña "Console"
3. Realizar cualquier búsqueda con categorías padre

### Resultado Esperado ✅
- **NO** debería aparecer ningún warning de tipo:
  - ❌ `"Filtro temporal no clasificado: anos censales"`
  - ❌ `"Filtro temporal no clasificado: periodos"`
  - ❌ `"Filtro temporal no clasificado: siglos"`

### Explicación
Si aparecen estos warnings, significa que el código está intentando clasificar las etiquetas padre como si fueran valores de datos, lo cual ya no debería ocurrir en v2.3.1.

---

## 📊 Checklist de Validación

Marca con `[x]` cuando valides cada test:

- [ ] **Test 1:** Años censales muestra resultados (no 0)
- [ ] **Test 2:** Períodos muestra resultados
- [ ] **Test 3:** Siglos muestra resultados
- [ ] **Test 4:** Combinación AND/OR funciona correctamente
- [ ] **Test 5:** No hay warnings en consola
- [ ] **Bonus:** Deseleccionar un hijo individual deselecciona el padre (comportamiento cascada)

---

## 🐛 Si Algo Falla

### Problema: Todavía muestra 0 resultados

**Verificar:**
1. ¿El archivo `maps.js` tiene los cambios de v2.3.1?
2. ¿El navegador cacheó la versión antigua? → Presiona `Ctrl + F5` para hard refresh
3. ¿La consola muestra algún error de JavaScript?

### Problema: Los hijos no se marcan automáticamente

**Causa:** La cascada no está funcionando  
**Verificar:** La función `setupCascadingTemporalFilters()` se ejecuta correctamente  
**Nota:** Este problema es independiente del fix v2.3.1

### Problema: Warnings en consola

**Causa:** Las categorías padre todavía se están procesando como filtros  
**Verificar:** El código de la línea ~452 de `maps.js` tiene el `return;` correcto

---

## 🎉 Confirmación de Éxito

Si todos los tests pasan, el fix v2.3.1 está funcionando correctamente y puedes:

1. ✅ Hacer commit de los cambios
2. ✅ Mergear el branch `buscador` a `main`
3. ✅ Desplegar a producción
4. ✅ Marcar el issue/bug como resuelto

---

**Archivo de código:** `js/maps.js`  
**Líneas modificadas:** 442-480  
**Versión:** 2.3.1  
**Fecha:** 19 de octubre de 2025
