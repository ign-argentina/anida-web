# Guía del Usuario - Buscador de Mapas ANIDA

**Fecha**: 21 de octubre de 2025  
**Atlas Nacional Interactivo De Argentina (ANIDA)**

---

## Índice

1. [Introducción](#introducción)
2. [Cómo Usar el Buscador](#cómo-usar-el-buscador)
3. [Búsqueda por Palabras Clave](#búsqueda-por-palabras-clave)
4. [Filtros de Categoría](#filtros-de-categoría)
5. [Filtros Avanzados](#filtros-avanzados)
6. [Sistema de Relevancia](#sistema-de-relevancia)
7. [Autocompletado](#autocompletado)
8. [Mensajes y Notificaciones](#mensajes-y-notificaciones)

---

## Introducción

El buscador de mapas de ANIDA te permite encontrar, visualizar y descargar mapas temáticos del atlas geográfico digital de Argentina. Con más de 200 mapas disponibles, el buscador utiliza tecnología avanzada para ayudarte a encontrar exactamente lo que necesitas.

### Características Principales

✅ **Búsqueda inteligente** con corrección de errores ortográficos  
✅ **Autocompletado** de palabras mientras escribes  
✅ **Filtros por categoría** temática  
✅ **Filtros avanzados** por escala espacial y temporal  
✅ **Indicadores de relevancia** para ordenar resultados  
✅ **Contadores dinámicos** que muestran resultados disponibles  

---

## Cómo Usar el Buscador

### Interfaz Principal

El buscador se compone de:

1. **Barra de búsqueda** - Campo de texto principal
2. **Botón Buscar** - Ejecuta la búsqueda manualmente
3. **Botón Limpiar (×)** - Borra el texto ingresado
4. **Filtros rápidos** - Categorías temáticas
5. **Filtros avanzados** - Panel lateral con opciones detalladas
6. **Área de resultados** - Grid de mapas encontrados
7. **Contador de resultados** - Número total de mapas encontrados

### Flujo Básico de Uso

1. **Escribe** una palabra clave en la barra de búsqueda
2. **Espera** 300 milisegundos (automático) o presiona **Enter**
3. **Visualiza** los resultados que aparecen
4. **Refina** tu búsqueda con filtros si es necesario
5. **Haz clic** en un mapa para ver detalles completos

---

## Búsqueda por Palabras Clave

### Requisitos de Búsqueda

- **Longitud mínima**: 3 caracteres
- **Caracteres permitidos**: Letras, números, espacios, guiones, paréntesis, comas, puntos
- **Longitud máxima**: 150 caracteres

### Cómo Funciona

#### Búsqueda Automática

Al escribir, la búsqueda se activa automáticamente después de 300 milisegundos sin escribir. Esto significa que:

- Si escribes "población" rápidamente, la búsqueda espera a que termines
- Si pausas, la búsqueda se ejecuta automáticamente
- No necesitas presionar el botón "Buscar" cada vez

#### Búsqueda Manual

También puedes ejecutar búsqueda manualmente:

- Presiona **Enter** para búsqueda inmediata
- Haz clic en el botón **Buscar**
- Selecciona una sugerencia del autocompletado

### Tipos de Coincidencia

#### 1. Coincidencia Exacta (Más Rápida)

Busca palabras que contienen exactamente tu término de búsqueda.

**Ejemplo**:

- Buscas: `población`
- Encuentra: "Población urbana", "Densidad de población", "Crecimiento poblacional"

#### 2. Coincidencia Aproximada (Fuzzy Match)

Si escribes mal una palabra, el sistema la corrige automáticamente.

**Ejemplo**:

- Buscas: `poblacion` (sin tilde)

- Encuentra: "Población urbana" (con tilde)
- Aparece advertencia: ⚠️ "Verifique la ortografía de su búsqueda"

#### 3. Búsqueda Múltiple

Puedes buscar varias palabras separadas por espacios. TODAS las palabras deben aparecer en el mapa.

**Ejemplo**:

- Buscas: `agricultura soja`
- Encuentra: Mapas que contengan AMBAS palabras
- No encuentra: Mapas que solo tengan "agricultura" o solo "soja"

### Longitud de Búsqueda

#### Búsquedas Cortas (3-4 caracteres)

- **Ejemplos**: "eco", "mar", "rio"
- **Comportamiento**: Búsqueda completa en todos los mapas
- **Velocidad**: Normal
- **Precisión**: Alta para coincidencias parciales

#### Búsquedas Largas (5+ caracteres)

- **Ejemplos**: "agricultura", "transporte", "economía"
- **Comportamiento**: Búsqueda optimizada con índice
- **Velocidad**: Muy rápida
- **Precisión**: Muy alta

### Mensajes de Error

#### "La búsqueda debe tener al menos 3 caracteres"

- **Causa**: Escribiste menos de 3 caracteres
- **Solución**: Escribe al menos 3 letras

#### "La búsqueda es demasiado larga"

- **Causa**: Escribiste más de 150 caracteres
- **Solución**: Acorta tu búsqueda

#### "El texto contiene solo caracteres no válidos"

- **Causa**: Usaste solo símbolos especiales
- **Solución**: Usa letras y números

---

## Filtros de Categoría

### Categorías Disponibles

Los filtros de categoría te permiten limitar tu búsqueda a un área temática específica:

### Uso de Filtros de Categoría

1. **Selecciona** una categoría haciendo clic en el botón correspondiente
2. **Observa** cómo se actualiza el contador de resultados
3. **Combina** con búsqueda por palabras clave para mayor precisión
4. **Vuelve** a "Todos" para ver todos los mapas nuevamente

### Contadores Dinámicos

Cada categoría muestra entre paréntesis el número de resultados disponibles:

- **Todos (180)** - 180 mapas en total
- **Argentina físico-natural (45)** - 45 mapas en esta categoría
- **Argentina económica (0)** - Sin resultados (opción deshabilitada)

**Nota**: Los contadores se actualizan automáticamente según tu búsqueda actual.

---

## Filtros Avanzados

Los filtros avanzados te permiten refinar tu búsqueda según criterios espaciales y temporales específicos.

### Cómo Acceder

Los filtros avanzados están ubicados en el panel lateral izquierdo. Se actualizan automáticamente según tu búsqueda.

### Escala Espacial

Filtra mapas según el nivel de detalle territorial:

### Escala Temporal

Filtra mapas según el período temporal que representan:

### Uso de Filtros Avanzados

#### Selección Individual

1. **Marca** un checkbox del filtro deseado
2. **Observa** cómo se actualizan los resultados
3. **Desmarca** para quitar el filtro

#### Selección Múltiple (Mismo Grupo)

Dentro de un mismo grupo (ej: varios períodos):

- **Lógica OR**: Se muestran mapas que cumplan AL MENOS UNA condición
- **Ejemplo**: Seleccionas "2010" y "2022" → Muestra mapas de 2010 O 2022

#### Combinación de Grupos

Al combinar filtros de diferentes grupos:

- **Lógica AND**: Se muestran mapas que cumplan TODAS las condiciones
- **Ejemplo**: Seleccionas "Provincial" Y "2022" → Solo mapas provinciales del censo 2022

#### Categorías Padre

Algunas opciones son categorías padre (en negrita):

- **Años Censales** - Selecciona todos los años censales
- **Períodos** - Selecciona todos los períodos
- **Siglos** - Selecciona todos los siglos

Al marcar una categoría padre, se seleccionan automáticamente todos sus hijos.

### Contadores en Filtros Avanzados

Cada opción muestra entre paréntesis cuántos resultados tiene:

- **Provincial (25)** - 25 mapas disponibles
- **Departamental (0)** - Sin resultados (opción deshabilitada con tooltip explicativo)

**Características**:

- ✅ Se actualizan en tiempo real según tu búsqueda
- ✅ Opciones sin resultados se deshabilitan automáticamente
- ✅ Tooltip explica por qué una opción está deshabilitada

### Limpiar Filtros

**Botón "Limpiar todos los filtros"**:

- Desmarca todos los filtros avanzados
- Vuelve categoría a "Todos"
- Mantiene el texto de búsqueda
- Útil para empezar una búsqueda nueva

---

## Sistema de Relevancia

### ¿Qué es la Relevancia?

La relevancia indica qué tan bien coincide un mapa con tu búsqueda. Los mapas con mayor relevancia aparecen primero.

### Indicador Visual

Cada mapa muestra un **badge de relevancia** en la esquina superior derecha:

#### 🟢 **100% - Perfecta** (Verde oscuro)

- Coincidencia exacta del 100%
- Todas las palabras buscadas están en el título
- **Ejemplo**: Buscas "población urbana" → Encuentra "Población Urbana de Argentina"

#### 🟢 **80-99% - Muy Alta** (Verde lima)

- Coincidencia casi perfecta
- Palabras en el título o keywords principales
- **Ejemplo**: Buscas "agricultura" → Encuentra "Producción Agrícola"

#### 🟡 **50-79% - Media** (Amarillo)

- Coincidencia parcial
- Palabras en keywords secundarios
- **Ejemplo**: Buscas "economía" → Encuentra mapas sobre "producción", "comercio"

#### 🔴 **< 50% - Baja** (Rojo)

- Coincidencia débil
- Búsqueda aproximada (fuzzy match)
- **Ejemplo**: Buscas "poblacion" (error) → Encuentra "población"

### Cálculo de Relevancia

La relevancia se calcula según:

1. **Ubicación de las palabras**:
   - En el título: Mayor peso (5x)
   - En keywords: Menor peso (2x)

2. **Tipo de coincidencia**:
   - Exacta: 100% de peso
   - Aproximada

3. **Cantidad de coincidencias**:
   - Todas las palabras: Mayor relevancia
   - Algunas palabras: Menor relevancia

### Ordenamiento

Los resultados se ordenan automáticamente:

1. Mayor relevancia primero (100% → 80% → 50% → < 50%)
2. Dentro del mismo nivel, orden alfabético

---

## Autocompletado

### ¿Qué es el Autocompletado?

Mientras escribes, el sistema sugiere palabras completas basadas en los mapas disponibles.

### Cómo Funciona el Autocompletado

1. **Escribe** al menos 2 caracteres
2. **Espera** 200 milisegundos
3. **Aparece** un dropdown con sugerencias
4. **Navega** con flechas ↑↓ o mouse
5. **Selecciona** con Enter o clic

### Características

#### Sugerencias Inteligentes

- Basadas en títulos y keywords de mapas reales
- Ordenadas por frecuencia de aparición
- Máximo 10 sugerencias simultáneas
- Actualizadas en tiempo real

#### Navegación por Teclado

- **Flecha abajo (↓)**: Siguiente sugerencia
- **Flecha arriba (↑)**: Sugerencia anterior
- **Enter**: Seleccionar sugerencia resaltada
- **Escape (Esc)**: Cerrar dropdown

#### Selección con Mouse

- **Hover**: Resalta la sugerencia
- **Clic**: Selecciona y ejecuta búsqueda

### Autocompletado Múltiple

Si escribes varias palabras, el autocompletado sugiere palabras para completar la ÚLTIMA:

**Ejemplo**:

- Escribes: "población urb"
- Sugerencias: "urbana", "urbanización", "urbano"
- Seleccionas: "urbana"
- Resultado: "población urbana"

### Cierre Automático

El dropdown se cierra cuando:

- Seleccionas una sugerencia
- Presionas Escape
- Haces clic fuera del dropdown
- El campo de búsqueda pierde el foco
- Borras todo el texto

---

## Mensajes y Notificaciones

### Tipos de Mensajes

#### 🔴 **Error** (Rojo)

Indica un problema que impide la búsqueda:

"La búsqueda debe tener al menos 3 caracteres"

- Aparece cuando escribes 1-2 caracteres
- Desaparece al escribir el 3er carácter

"El texto contiene solo caracteres no válidos"

- Usaste solo símbolos especiales
- Solución: Usa letras y números

"La búsqueda es demasiado larga"

- Excediste 150 caracteres
- El texto se trunca automáticamente

#### ⚠️ **Advertencia** (Amarillo)

Indica una situación que requiere atención:

"Verifique la ortografía de su búsqueda. Se encontraron resultados aproximados."

- Aparece cuando hay errores ortográficos
- Los resultados son válidos pero aproximados
- Se auto-oculta después de 5 segundos

### Ubicación de Mensajes

#### Tooltip Superior

- Aparece sobre el campo de búsqueda
- Usado para errores y advertencias
- Posicionamiento absoluto para evitar solapamiento

#### Texto de Ayuda

- Debajo del botón "Buscar"
- Visible permanentemente
- Color gris claro

#### Tooltips en Filtros

- Sobre opciones deshabilitadas
- Explican por qué no hay resultados
- Aparecen al hacer hover

---

## Consejos y Buenas Prácticas

### Para Búsquedas Efectivas

#### 1. Sé Específico

❌ **Mal**: "mapa"  
✅ **Bien**: "población urbana"

#### 2. Usa Palabras Clave Relevantes

❌ **Mal**: "mostrar mapas de personas"  
✅ **Bien**: "demografía población"

#### 3. Prueba Variaciones

Si no encuentras resultados, prueba:

- Sinónimos: "población" → "habitantes" → "demográfico"
- Singular/plural: "río" → "ríos"
- Palabras relacionadas: "agricultura" → "cultivo" → "producción agrícola"

#### 4. Combina Filtros

Para mayor precisión:

- Búsqueda: "economía"
- Categoría: "Argentina económica"
- Escala: "Provincial"
- Resultado: Mapas económicos provinciales

### Para Navegar los Resultados

#### 1. Usa el Ordenamiento por Relevancia

Los primeros resultados son los más relevantes. No es necesario revisar todos.

#### 2. Lee el Indicador de Relevancia

- 100% → Exactamente lo que buscas
- 80-99% → Muy relacionado
- 50-79% → Relacionado parcialmente
- < 50% → Puede no ser lo que buscas

#### 3. Carga Más Resultados

Si no encuentras lo que buscas en los primeros 20:

- Haz clic en "Cargar más"
- O refina tu búsqueda con filtros

### Para Usar Filtros Avanzados

#### 1. Empieza con Búsqueda Amplia

- Primero busca por palabra clave
- Luego agrega filtros para refinar

#### 2. Usa Múltiples Filtros del Mismo Tipo

Para búsquedas temporales amplias:

- Marca "2010" Y "2022" para comparar censos
- Marca varios períodos para análisis histórico

#### 3. Observa los Contadores

Los números entre paréntesis te indican si vale la pena aplicar un filtro.

### Atajos de Teclado

- **Enter**: Ejecutar búsqueda inmediatamente
- **Escape**: Cerrar autocompletado
- **↑↓**: Navegar sugerencias
- **Tab**: Siguiente campo

---
