# Prueba Rápida - Autocompletado v2.5

## 🎯 Objetivo
Verificar el funcionamiento completo del sistema de autocompletado implementado.

---

## ✅ Checklist de Pruebas

### 1. **Aparición del Dropdown**
- [ ] Escribir 1 carácter → Dropdown NO aparece
- [ ] Escribir 2 caracteres → Dropdown aparece si hay coincidencias
- [ ] Escribir término sin coincidencias → Dropdown NO aparece o se oculta

### 2. **Contenido de Sugerencias**
- [ ] Escribir "po" → Debería mostrar términos que comiencen con "po" (ej: "poblacion", "politico", "porcentaje")
- [ ] Máximo 5 sugerencias visibles
- [ ] Sugerencias ordenadas por longitud primero, luego alfabéticamente
- [ ] Términos más cortos aparecen primero

### 3. **Navegación con Teclado**
- [ ] Presionar **ArrowDown** → Selecciona primera sugerencia (fondo gris, texto bold)
- [ ] Presionar **ArrowDown** varias veces → Navega hacia abajo
- [ ] Presionar **ArrowDown** en última sugerencia → Vuelve a primera (circular)
- [ ] Presionar **ArrowUp** → Navega hacia arriba
- [ ] Presionar **ArrowUp** en primera sugerencia → Va a última (circular)
- [ ] Presionar **Enter** con sugerencia seleccionada → Completa término y dispara búsqueda
- [ ] Presionar **Escape** → Cierra dropdown

### 4. **Interacción con Mouse**
- [ ] Hover sobre sugerencia → Cambia color de fondo
- [ ] Click en sugerencia → Completa término y dispara búsqueda
- [ ] Click fuera del dropdown → Cierra dropdown sin seleccionar

### 5. **Comportamiento del Input**
- [ ] Seleccionar sugerencia → Reemplaza última palabra escrita
- [ ] Agrega espacio al final después de seleccionar
- [ ] Permite seguir escribiendo después de selección
- [ ] Tecla **espacio** funciona normalmente (bug fix previo mantiene funcionamiento)

### 6. **Debouncing**
- [ ] Escribir rápidamente → Sugerencias aparecen después de 200ms de pausa
- [ ] No hay lag o retraso perceptible
- [ ] Búsqueda principal se dispara después de 300ms (separada del autocompletado)

### 7. **Estilos y Diseño**
- [ ] Dropdown posicionado justo debajo del input
- [ ] Ancho igual al input de búsqueda
- [ ] Borde coherente con diseño existente
- [ ] Sombra sutil visible
- [ ] Hover suave y transiciones fluidas
- [ ] Scroll visible si hay más de 5 sugerencias
- [ ] Scrollbar personalizado (ancho 6px, color gris)

### 8. **Responsive (Móvil)**
- [ ] Abrir en pantalla < 768px
- [ ] Dropdown ajusta ancho correctamente
- [ ] Items tienen padding reducido (8px vs 10px)
- [ ] Font size reducido (0.9rem vs 0.95rem)
- [ ] Táctil funciona (click en sugerencias)

### 9. **Casos Edge**
- [ ] Input vacío → Dropdown NO visible
- [ ] Solo espacios → Dropdown NO visible
- [ ] Caracteres especiales → Sanitización funciona, no rompe autocompletado
- [ ] Mayúsculas/minúsculas → Normalización correcta (insensible a case)
- [ ] Última palabra con espacio al final → No muestra sugerencias
- [ ] Múltiples palabras → Solo autocompleta última palabra

### 10. **Integración con Búsqueda**
- [ ] Seleccionar sugerencia → Dispara búsqueda automáticamente
- [ ] Resultados aparecen correctamente
- [ ] Filtros avanzados funcionan junto con autocompletado
- [ ] Modal de mapa no interfiere con dropdown
- [ ] Cerrar modal → Dropdown sigue funcionando

---

## 🔬 Pruebas Específicas

### Prueba A: Autocompletado de Términos Comunes
```
1. Escribir: "po"
   Esperado: ["poblacion", "politico", "porcentaje", "pobreza", "poder"]
   
2. Escribir: "edu"
   Esperado: ["educacion", "educativo", "educativa"]
   
3. Escribir: "arg"
   Esperado: ["argentina", "argentino", "argentinos"]
```

### Prueba B: Navegación Completa
```
1. Escribir: "sa"
2. Presionar ArrowDown (selecciona primera sugerencia)
3. Presionar ArrowDown 2 veces más (navega a tercera)
4. Presionar Enter
5. Verificar: Input contiene término completo + espacio
6. Verificar: Búsqueda se dispara automáticamente
```

### Prueba C: Click Outside
```
1. Escribir: "po"
2. Dropdown aparece con sugerencias
3. Click en cualquier parte fuera del dropdown
4. Verificar: Dropdown se cierra
5. Verificar: Input mantiene texto escrito
```

### Prueba D: Escape Key
```
1. Escribir: "ed"
2. Dropdown aparece
3. Presionar ArrowDown (seleccionar sugerencia)
4. Presionar Escape
5. Verificar: Dropdown se cierra
6. Verificar: Input mantiene "ed" (no se completa)
```

### Prueba E: Debouncing Visual
```
1. Escribir rápidamente: "poblacion"
2. Observar: Dropdown NO aparece hasta pausar
3. Pausar 200ms
4. Verificar: Dropdown aparece con sugerencias de "poblacion"
```

---

## 🐛 Problemas Conocidos a Verificar

### ❌ **Problema Potencial 1**: Dropdown no se posiciona correctamente
**Síntoma**: Dropdown aparece en lugar incorrecto  
**Causa posible**: Contenedor padre no tiene `position: relative`  
**Verificación**: Inspeccionar en DevTools → `.search-container` debe tener `position: relative`

### ❌ **Problema Potencial 2**: Sugerencias incorrectas
**Síntoma**: Términos que no comienzan con lo escrito  
**Causa posible**: Normalización no aplicada correctamente  
**Verificación**: Console log en `getSuggestions()` → Verificar `normalized` y `lastWord`

### ❌ **Problema Potential 3**: Navegación con teclado no funciona
**Síntoma**: Flechas no seleccionan sugerencias  
**Causa posible**: Event listener de keydown no agregado  
**Verificación**: DevTools → Sources → `elements.keywordInput.addEventListener('keydown', ...)`

### ❌ **Problema Potencial 4**: Click no selecciona sugerencia
**Síntoma**: Click en item no hace nada  
**Causa posible**: Event listener no agregado a items  
**Verificación**: Inspeccionar item en DevTools → Event Listeners → `click` debe existir

---

## 📊 Métricas Esperadas

| Métrica | Valor Esperado |
|---------|----------------|
| Tiempo de aparición (debouncing) | ~200ms después de última tecla |
| Tiempo de búsqueda (debouncing) | ~300ms después de última tecla |
| Sugerencias máximas | 5 |
| Caracteres mínimos | 2 |
| Errores JavaScript | 0 |
| Errores CSS | 0 |
| Tiempo de respuesta percibido | Instantáneo (<100ms subjetivo) |

---

## 🎨 Visual Checklist

### Dropdown Visible
- [ ] Fondo blanco (`#ffffff`)
- [ ] Borde gris (`#ddd`)
- [ ] Sin borde superior (integrado con input)
- [ ] Border-radius en esquinas inferiores (4px)
- [ ] Sombra suave (`box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1)`)
- [ ] Z-index alto (1000)

### Items de Sugerencia
- [ ] Padding vertical/horizontal (10px 15px)
- [ ] Borde inferior gris claro (`#f0f0f0`) excepto último
- [ ] Cursor pointer al hover
- [ ] Transición suave (0.2s)
- [ ] Color texto oscuro (`#333`)
- [ ] Font size 0.95rem

### Hover/Selección
- [ ] Fondo gris claro (`#f5f5f5`) al hover
- [ ] Font weight 500 cuando seleccionado
- [ ] Transición fluida sin saltos

### Scrollbar (si > 5 items)
- [ ] Ancho 6px
- [ ] Track gris muy claro (`#f8f9fa`)
- [ ] Thumb gris (`#ccc`)
- [ ] Thumb hover gris oscuro (`#999`)
- [ ] Border radius 3px

---

## 🚀 Pasos de Prueba Manual

### Setup Inicial
1. Abrir `mapas_tematicos.html` en navegador
2. Abrir DevTools (F12)
3. Ir a pestaña Console (verificar errores)
4. Ir a pestaña Network (verificar carga de archivos)

### Ejecución de Pruebas
1. **Prueba Básica** (2 min)
   - Escribir en input de búsqueda
   - Verificar que dropdown aparece
   - Verificar que sugerencias son correctas
   
2. **Prueba de Teclado** (3 min)
   - Navegar con flechas
   - Seleccionar con Enter
   - Cerrar con Escape
   
3. **Prueba de Mouse** (2 min)
   - Hover sobre items
   - Click para seleccionar
   - Click fuera para cerrar
   
4. **Prueba de Integración** (3 min)
   - Seleccionar sugerencia
   - Verificar búsqueda automática
   - Verificar resultados
   
5. **Prueba Responsive** (2 min)
   - Cambiar tamaño de ventana
   - Verificar en móvil (DevTools device mode)
   - Verificar táctil funciona

### Tiempo Total Estimado: **12 minutos**

---

## ✅ Resultado Esperado

Al completar todas las pruebas, el sistema debe:

1. ✅ Mostrar dropdown con sugerencias relevantes
2. ✅ Permitir navegación fluida con teclado y mouse
3. ✅ Completar términos y disparar búsqueda automáticamente
4. ✅ Cerrar dropdown correctamente en todos los casos
5. ✅ Funcionar sin errores JavaScript
6. ✅ Verse coherente con el diseño existente
7. ✅ Ser responsive en todos los tamaños de pantalla
8. ✅ No interferir con otras funcionalidades (búsqueda, filtros, modal)

---

## 📝 Notas Post-Prueba

### Observaciones
```
[Espacio para anotaciones durante pruebas]
```

### Bugs Encontrados
```
[Listar cualquier problema encontrado]
```

### Mejoras Sugeridas
```
[Ideas para futuras iteraciones]
```

---

**Estado**: ⏳ PENDIENTE DE PRUEBA  
**Versión**: v2.5  
**Fecha**: 2024
