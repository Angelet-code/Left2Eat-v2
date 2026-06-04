# Roadmap de implementacion de Left2Eat

## Resumen

Left2Eat sera una Web/PWA mobile first para registrar comidas y responder de forma clara que queda por comer en el dia.

La app se implementara con React, TypeScript y Vite, CSS propio modular y estado con React reducer + context. El menu inferior fijo sera:

- Hoy
- Alimentos
- Historial
- Perfil

La arquitectura debe mantener cada parte lo mas independiente posible. Las reglas de dominio y calculo nutricional viviran fuera de React, la persistencia quedara aislada, y cada pestana o flujo tendra su propio modulo de UI.

## Principios de arquitectura

- `domain/`: modelos, calculos y funciones puras. No debe importar React, storage ni componentes.
- `data/`: alimentos base normalizados desde `alimentos-macros.md`.
- `storage/`: lectura, escritura, versionado y migracion de `localStorage`.
- `features/`: pantallas y flujos por area de producto.
- `ui/`: componentes visuales reutilizables, layout mobile, botones, tabs, tarjetas, inputs y tokens CSS.

Regla general: una feature puede usar `domain`, `data`, `storage` y `ui`, pero `domain` no debe depender de ninguna capa superior.

## Roadmap por fases

### Fase 1 - Base tecnica

Objetivo: dejar la app arrancando con estructura limpia y navegacion mobile first.

- Crear proyecto Vite con React y TypeScript en la raiz.
- Mantener `features.md`, `alimentos-macros.md` y `design-reference/` como documentacion y referencias.
- Definir tokens CSS globales:
  - fondo marfil
  - texto marron oscuro
  - bordes beige finos
  - superficies crema suaves
  - radios entre 8 y 16 px
  - CTA inferior con estilo pixelado
- Crear shell mobile con menu inferior: Hoy, Alimentos, Historial y Perfil.
- Implementar navegacion por estado: tabs principales y subpantallas internas.
- No introducir router completo en el MVP.
- Anadir manifest PWA basico, iconos, viewport mobile y metadatos instalables.

### Fase 2 - Modelos de dominio y datos base

Objetivo: tener datos y calculos basicos independientes de la UI.

- Convertir `alimentos-macros.md` a `src/data/baseFoods.ts`.
- Normalizar acentos y codificacion UTF-8.
- Convertir numeros con coma decimal a `number`.
- Definir modelo `Food`:
  - `id`
  - `name`
  - `aliases`
  - `kcal`
  - `proteinG`
  - `carbsG`
  - `fatG`
  - `fiberG`
  - `servingLabel`
  - `servingGrams`
  - `eyeballUnit`
  - `spriteKey`
- Crear `spriteMap` local por alimento, con fallback generico.
- Implementar funciones puras para calcular:
  - macros de un alimento por gramos
  - totales de una comida
  - totales de un dia
- No parsear el markdown en runtime. El markdown queda como referencia humana.

### Fase 3 - Perfil y motor nutricional

Objetivo: calcular objetivos diarios sin acoplar el motor a la UI.

- Crear Perfil obligatorio, pero inicialmente prellenado con valores por defecto:
  - sexo: hombre
  - edad: 30
  - altura: 175 cm
  - peso: 75 kg
  - objetivo: mantener
  - actividad: ligera
  - entrenos semanales: 3
  - pasos habituales: 8000
- Implementar `calculateDailyNutrition(profile, dayContext, totals)` como funcion pura.
- La funcion no debe acceder a alimentos, historial, sprites, React ni `localStorage`.
- Usar metodologia versionada: `left2eat-nutrition-v1`.
- Unidades metricas solamente.
- El calculo nutricional es orientativo para uso personal, no medico-clinico.

#### Contrato nutricional

Inputs principales:

- `Profile`: sexo, edad, altura, peso, objetivo, actividad, entrenos semanales y pasos habituales.
- `DayContext`: tipo de entreno, intensidad y pasos reales opcionales.
- `NutritionTotals`: kcal, proteina, carbohidratos, grasas y fibra consumidas.

Outputs principales:

- BMR
- TDEE habitual
- TDEE ajustado del dia
- objetivo kcal
- objetivos y rangos de kcal, proteina, carbohidratos, grasas y fibra
- balances: below, ok o above
- prioridades nutricionales ordenadas
- flags de calculo
- errores de validacion cuando los inputs no sean validos

Formula base:

- Mifflin-St Jeor para BMR.
- Ajustes por pasos reales y entreno real, evitando doble conteo excesivo.
- Objetivos de proteina, grasa, carbohidratos y fibra segun el contrato definido por el subagente nutricionista.

### Fase 4 - Hoy y flujo de anadir comida

Objetivo: registrar comida en el dia actual y ver que queda por comer.

- El MVP visible trabaja solo con Hoy.
- El modelo interno debe soportar dias por fecha.
- Usar corte de madrugada a las 04:00 para decidir el dia activo.
- Crear automaticamente un dia editable si no existe.
- Registrar contexto diario:
  - sin entreno
  - fuerza
  - cardio
  - fuerza + cardio
  - intensidad suave, normal o duro
  - pasos reales
- Implementar flujo de anadir comida:
  1. Seleccion multiple de alimentos.
  2. Cantidades alimento por alimento.
  3. Confirmacion y comida registrada en Hoy.
- Modos de cantidad:
  - gramos
  - a ojo mediante unidades practicas convertidas a gramos
- Cada comida creada desde el flujo se registra directamente en el dia actual.
- No guardar comidas reutilizables todavia.
- Permitir editar cantidades y quitar alimentos de una comida.
- Eliminar comidas vacias sin confirmacion.
- Confirmar antes de eliminar comidas con alimentos.
- Nombre de comida automatico y recalculado siempre.
- Formato de nombre esperado: `Arroz con pollo, tomate y aguacate`.

### Fase 5 - Alimentos

Objetivo: gestionar la biblioteca base sin mezclarla con el registro del dia.

- La pestana Alimentos incluye:
  - biblioteca base
  - favoritos
- MVP:
  - buscar alimentos por nombre o alias
  - ver detalle nutricional
  - marcar y desmarcar favoritos
- No editar alimentos base.
- No ocultar alimentos base.
- No crear alimentos personalizados en el MVP.
- Favoritos deben influir en el orden de sugerencias del flujo de anadir comida.

### Fase 6 - Historial

Objetivo: registrar dias cerrados como snapshots estables.

- Implementar despues del MVP core.
- Registro manual desde Hoy mediante accion tipo `Registrar dia`.
- Impedir registrar dias sin alimentos.
- Al registrar, guardar snapshot completo:
  - fecha
  - perfil/objetivos usados ese dia
  - contexto del dia
  - comidas
  - items
  - cantidades
  - snapshots nutricionales
  - totales
- Los dias historicos son solo lectura.
- Abrir dias desde Historial en modo lectura.
- Mas adelante:
  - repetir dia guardado en Hoy
  - anadir comidas repetidas a un dia editable
  - medias recientes
  - porcentaje medio de proteina
  - recuperar ultimo dia cerrado

### Fase 7 - Comidas guardadas

Objetivo: reutilizar comidas completas sin depender de cambios futuros en la biblioteca.

- Ubicacion: `Alimentos > Guardadas`.
- Implementar despues de Historial o cuando el flujo de Hoy este estable.
- Guardar comidas como snapshots estables.
- Una comida guardada conserva:
  - items
  - cantidades
  - nombre automatico
  - totales nutricionales
  - sprites
- Si se guarda una comida con la misma composicion que una existente, actualizar la existente.
- Insertar comida guardada en el dia actual.
- No mezclar comidas guardadas con snapshots historicos.

### Fase 8 - Diagnostico y recomendaciones

Objetivo: convertir los datos acumulados en sugerencias accionables.

- Implementar mas adelante, no en el MVP.
- Diagnostico debe depender de:
  - Perfil
  - Hoy
  - Alimentos
  - Historial
- El motor nutricional solo devuelve necesidades y prioridades.
- Otro modulo debe convertir necesidades en alimentos concretos.
- Sugerencias futuras:
  - alimentos frecuentes
  - favoritos
  - alimentos base si no hay historial
  - combinaciones compatibles
  - evitar sugerir alimentos ya registrados en el contexto relevante

## Modelos clave

### Food

Alimento base de biblioteca, definido por 100 g.

Debe ser estable, versionado y no editable directamente por el usuario en el MVP.

### MealItem

Item registrado dentro de una comida.

Debe guardar:

- `foodId`
- `quantityGrams`
- `quantityMode`
- snapshot de nombre, macros y sprite en el momento de registro

Esto evita que cambios futuros en biblioteca alteren comidas ya registradas.

### Meal

Comida dentro de un dia.

Debe contener items y derivar:

- nombre automatico
- totales
- sprites visibles

El nombre se recalcula siempre que cambian los items o cantidades.

### DayDraft

Dia editable.

Debe contener:

- `dateKey`
- contexto del dia
- comidas editables

### HistoryDay

Snapshot de dia registrado.

Debe ser solo lectura y no depender de alimentos vivos.

### AppState

Estado persistido de la app.

Debe incluir:

- perfil
- favoritos
- dias editables
- historial
- ajustes UI
- version de schema

## Persistencia

- Usar `localStorage`.
- Guardar un unico estado versionado.
- Implementar migraciones desde la primera version.
- Normalizar datos cargados para tolerar registros antiguos o incompletos.
- No guardar datos derivados si pueden recalcularse con seguridad, salvo snapshots historicos y comidas guardadas.
- Mantener snapshots para proteger historicos y plantillas.

## Testing

### Unit tests

- Importacion y normalizacion de alimentos.
- Numeros con coma decimal.
- Acentos y codificacion UTF-8.
- Calculo de macros por gramos.
- Totales por comida.
- Totales por dia.
- Nombre automatico de comida.
- Calculo nutricional:
  - BMR
  - TDEE
  - pasos
  - entreno
  - rangos
  - prioridades
  - errores de validacion
- Reducer:
  - crear dia
  - anadir comida
  - editar cantidad
  - quitar item
  - favoritos
  - perfil
- Storage:
  - guardar
  - cargar
  - migrar
  - tolerar datos incompletos

### Smoke UI tests

- Primer arranque con perfil prellenado.
- Navegar entre Hoy, Alimentos, Historial y Perfil.
- Buscar alimento.
- Marcar favorito.
- Completar flujo de anadir comida.
- Ver comida registrada en Hoy.
- Editar cantidad.
- Recargar y conservar estado.

## Reglas para agentes

- No mezclar fases salvo que sea imprescindible.
- Antes de editar, leer este roadmap, `features.md` y las referencias visuales de `design-reference/`.
- Mantener el estilo mobile first de las imagenes de referencia.
- No introducir dependencias nuevas sin justificarlo.
- No acoplar calculos de dominio a componentes React.
- No meter parseo del markdown de alimentos en runtime.
- No implementar Diagnostico antes de que Perfil, Hoy, Alimentos e Historial esten maduros.
- Si una tarea toca datos historicos, respetar siempre snapshots estables.
- Si una tarea toca alimentos base, no permitir edicion directa en MVP.

## Fuera de alcance inicial

- Backend.
- Login.
- Sync multidispositivo.
- Edicion de alimentos base.
- Alimentos personalizados.
- Diagnostico accionable.
- Recomendaciones avanzadas.
- Service worker/offline completo.
- App nativa React Native/Expo.
- Unidades imperiales.
