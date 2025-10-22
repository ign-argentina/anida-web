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

## Sugerencias de Búsqueda

### ¿Qué son las Sugerencias de Búsqueda?

Cuando una búsqueda **no encuentra resultados**, el sistema automáticamente muestra sugerencias inteligentes de términos alternativos que podrían ayudarte a encontrar lo que buscas.

### Cómo Funcionan

1. **Realizas una búsqueda** que no tiene resultados
2. **El sistema analiza** tu término de búsqueda
3. **Genera sugerencias** basadas en:
   - **Correcciones de errores ortográficos** (typos)
   - **Términos similares** en el índice de mapas
   - **Búsquedas populares** (términos más frecuentes)
4. **Muestra hasta 5 sugerencias** con un solo click

### Tipos de Sugerencias

#### 1. Corrección de Errores Ortográficos

Si escribiste mal una palabra, el sistema sugiere la corrección:

**Ejemplo**:
- Buscas: `poblasion` (error de ortografía)
- Sugerencias: **poblacion**, poblaciones, población
- **Resultado**: Click en "poblacion" → encuentra 45 mapas ✅

#### 2. Términos Similares

Sugiere palabras parecidas que existen en los mapas:

**Ejemplo**:
- Buscas: `econmia` (falta una 'o')
- Sugerencias: **economia**, economica, economias
- **Resultado**: Corrección automática de tu búsqueda

#### 3. Búsquedas Populares

Si tu término no tiene similares, muestra los términos más buscados:

**Ejemplo**:
- Buscas: `xyz123` (término inexistente)
- Sugerencias: poblacion, economia, transporte, clima, energia
- **Resultado**: Explora temas populares disponibles

### Cómo Usar las Sugerencias

#### Paso 1: Realizar Búsqueda sin Resultados

```text
Escribe "poblasion" → Presiona Enter
```

#### Paso 2: Ver Mensaje de Sugerencias

Aparece un mensaje centrado:

```
🔍

No se encontraron resultados para "poblasion"

¿Quizás buscabas?

[poblacion] [poblaciones] [economia] [transporte] [clima]
```

#### Paso 3: Click en una Sugerencia

- **Haz click** en cualquier término sugerido
- **Se ejecuta** automáticamente la búsqueda
- **Muestra resultados** para ese término

### Características

✅ **Automático**: No necesitas hacer nada especial  
✅ **Inteligente**: Detecta errores y sugiere correcciones  
✅ **Rápido**: Un solo click para ejecutar búsqueda alternativa  
✅ **Personalizado**: Basado en el contenido real de los mapas  
✅ **Limitado**: Máximo 5 sugerencias para no abrumar  

### Ejemplos Prácticos

#### Ejemplo 1: Error de Teclado

```
Búsqueda: "transporte"  (escribiste mal la 'o')
↓
Sistema detecta: No hay resultados
↓
Sugerencias: [transporte] [transportes] [infraestructura]
↓
Click en "transporte" → 25 resultados encontrados ✅
```

#### Ejemplo 2: Término en Otro Idioma

```
Búsqueda: "economy"  (en inglés)
↓
Sistema detecta: No hay resultados
↓
Sugerencias: [economia] [economica] [poblacion] [energia]
↓
Click en "economia" → 38 resultados encontrados ✅
```

#### Ejemplo 3: Búsqueda Muy Específica

```
Búsqueda: "hidroelectricidad"
↓
Sistema detecta: No hay resultados
↓
Sugerencias: [hidroelectrica] [energia] [electrica] [renovable]
↓
Click en "hidroelectrica" → 12 resultados encontrados ✅
```

### Diferencias con Otras Funcionalidades

| Característica | Sugerencias sin Resultados | Autocompletado | Historial |
|----------------|---------------------------|----------------|-----------|
| **Cuándo aparece** | Solo con 0 resultados | Mientras escribes | Después de buscar |
| **Propósito** | Corregir/guiar búsqueda | Completar palabras | Reutilizar búsquedas previas |
| **Interacción** | Click en sugerencia | Click o Enter | Click en búsqueda previa |
| **Fuente** | Análisis inteligente + índice | Índice de mapas | Tus búsquedas guardadas |

### Consejos para Aprovechar las Sugerencias

#### 1. Lee las Sugerencias Antes de Modificar

Antes de reescribir tu búsqueda, revisa las sugerencias. Puede que haya una solución inmediata.

#### 2. Prueba Sugerencias Similares

Si la primera sugerencia no es exactamente lo que buscas, prueba las otras. Pueden llevarte a mapas relacionados.

#### 3. Aprende Términos Correctos

Las sugerencias te ayudan a conocer cómo están denominados los mapas en el sistema.

#### 4. Usa con Filtros

Después de hacer click en una sugerencia, puedes refinar con filtros de categoría o avanzados.

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
- **NUEVO**: O simplemente usa las sugerencias automáticas del sistema ✨

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

## Historial de Búsquedas

### ¿Qué es el Historial?

El **historial de búsquedas** guarda automáticamente tus últimas 5 búsquedas realizadas. Esto te permite:

✅ **Reutilizar búsquedas anteriores** sin escribir nuevamente  
✅ **Ahorrar tiempo** al acceder rápidamente a términos usados  
✅ **Mantener contexto** de tus búsquedas durante la sesión  

### Cómo Usar el Historial

#### 1. **Realizar Búsquedas**

El historial se construye automáticamente cuando buscas:

```text
1. Escribe "población argentina" → presiona Enter o selecciona sugerencia
2. Escribe "clima patagonia" → presiona Enter o selecciona sugerencia
3. Escribe "ríos principales" → presiona Enter o selecciona sugerencia
```

Cada búsqueda válida (3+ caracteres) se guarda automáticamente, incluyendo las búsquedas realizadas mediante selección de sugerencias del autocompletado.

#### 2. **Ver el Historial**

Después de realizar al menos una búsqueda:

1. Aparecerá un **botón con ícono de reloj** (🕐) junto al campo de búsqueda
2. Haz **click en el botón de reloj**
3. Se despliega una lista con tus búsquedas recientes

#### 3. **Reutilizar una Búsqueda**

Para ejecutar nuevamente una búsqueda del historial:

1. Abre el dropdown del historial (botón de reloj)
2. Haz **click en la búsqueda** que quieres repetir
3. El término se carga automáticamente y se ejecuta la búsqueda

#### 4. **Limpiar el Historial**

Si quieres borrar todas las búsquedas guardadas:

1. Abre el dropdown del historial
2. Haz click en el **ícono de basura** (🗑️) en la esquina superior derecha
3. Todo el historial se eliminará inmediatamente (sin confirmación)

### Características del Historial

#### ✅ Persistencia

- Las búsquedas se guardan en tu navegador (localStorage)
- El historial persiste incluso después de cerrar la página
- Solo tú puedes ver tu historial (no se comparte)

#### ✅ Límite Inteligente

- Se guardan **máximo 5 búsquedas**
- Si haces una 6ta búsqueda, se elimina la más antigua
- Sistema FIFO (First In, First Out)

#### ✅ Sin Duplicados

- Si buscas un término que ya existe en el historial
- Se elimina de su posición actual
- Se agrega al inicio de la lista
- Mantiene las búsquedas más recientes arriba

#### ✅ Validación Automática

- Solo se guardan búsquedas de **3+ caracteres**
- Se eliminan espacios al inicio/final
- No se guardan búsquedas vacías o inválidas
- Se guardan tanto búsquedas manuales como selecciones del autocompletado

### Ejemplos de Uso

#### Ejemplo 1: Comparar Búsquedas

```text
Situación: Quieres comparar datos de población entre diferentes provincias

1. Busca "población Buenos Aires" → 12 resultados
2. Busca "población Córdoba" → 8 resultados
3. Busca "población Santa Fe" → 6 resultados

Ahora puedes volver rápidamente a cualquiera usando el historial.
```

#### Ejemplo 2: Refinar Búsqueda

```text
Situación: Quieres mejorar gradualmente una búsqueda

1. Busca "agua" → 45 resultados (demasiados)
2. Busca "agua subterránea" → 12 resultados (mejor)
3. Busca "acuífero" → 8 resultados (preciso)

Si quieres volver a "agua subterránea", usa el historial.
```

#### Ejemplo 3: Trabajo por Sesiones

```text
Situación: Trabajas en un informe sobre energía

Sesión 1:
- "energía renovable"
- "hidroeléctrica"
- "parques eólicos"

Sesión 2 (días después):
- Abres el buscador
- El historial conserva tus búsquedas
- Continúas desde donde dejaste
```

### Diferencias con el Autocompletado

| Característica | Historial | Autocompletado |
|----------------|-----------|----------------|
| **Fuente** | Tus búsquedas previas | Base de datos de mapas |
| **Límite** | 5 búsquedas | Hasta 10 sugerencias |
| **Activación** | Click en botón reloj | Escribir 3+ caracteres |
| **Persistencia** | Se guarda en navegador | Se calcula en tiempo real |
| **Contenido** | Términos completos | Palabras clave sugeridas |

### Preguntas Frecuentes

**¿Cuánto tiempo se guarda el historial?**  
Indefinidamente, hasta que limpies los datos del navegador o uses el botón de limpiar historial.

**¿Puedo ver el historial de otro dispositivo?**  
No, el historial es local a cada navegador/dispositivo.

**¿Qué pasa si busco lo mismo dos veces?**  
La búsqueda se mueve al tope de la lista (sin duplicados).

**¿Cómo se limpia el historial?**  
Haz click en el ícono de basura dentro del dropdown del historial. El borrado es inmediato sin confirmación.

**¿Se guardan las sugerencias del autocompletado?**  
Sí, cuando seleccionas una sugerencia del autocompletado (por click o Enter), esta se guarda automáticamente en el historial antes de ejecutar la búsqueda.

**¿Ocupa mucho espacio en mi navegador?**  
No, ~200 bytes por búsqueda (máximo 1KB total).

---
