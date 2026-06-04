# Features de Left2Eat

Inventario funcional extraido de la app actual. No incluye decisiones de diseno, estructura visual ni disposicion de pantalla.

## Perfil

- Crear y editar un perfil personal.
- Guardar nombre, sexo, edad, altura y peso.
- Configurar objetivo nutricional: perder grasa, mantener o ganar masa.
- Configurar nivel de actividad habitual.
- Configurar entrenamientos semanales habituales.
- Configurar pasos diarios habituales.
- Recalcular los objetivos nutricionales cuando cambia el perfil.

## Diario

- Trabajar sobre un dia seleccionado por fecha.
- Crear automaticamente un dia editable cuando no existe registro para esa fecha.
- Mantener un dia activo con corte de madrugada para no cerrar tarde el dia anterior por error.
- Registrar el contexto del dia: sin entreno, fuerza, cardio o fuerza + cardio.
- Registrar la intensidad del entreno: suave, normal o duro.
- Registrar pasos reales del dia.
- Anadir comidas al dia.
- Renombrar comidas.
- Eliminar comidas vacias sin confirmacion.
- Confirmar antes de eliminar o vaciar comidas con alimentos.
- Anadir alimentos dentro de una comida.
- Editar la cantidad de un alimento ya registrado.
- Quitar alimentos de una comida.
- Buscar rapidamente un alimento por nombre o alias para empezar a anadirlo.
- Alternar entre registro por gramos y registro por medidas caseras.
- Convertir medidas caseras a gramos para el calculo nutricional.
- Mostrar cantidades registradas como gramos o como medida casera estimada segun el modo activo.
- Guardar el modo de cantidad elegido entre sesiones.

## Calculo Nutricional

- Calcular calorias, proteina, carbohidratos, grasas y fibra por alimento.
- Calcular totales por comida.
- Calcular totales diarios.
- Calcular metabolismo basal estimado.
- Calcular mantenimiento calorico estimado.
- Calcular multiplicador de actividad.
- Ajustar objetivos del dia segun perfil, objetivo, entreno, intensidad y pasos.
- Calcular objetivo optimo de calorias.
- Calcular rango aceptable de calorias.
- Calcular objetivos de proteina, carbohidratos, grasas y fibra.
- Calcular rangos aceptables para macros.
- Calcular cuanto falta o cuanto sobra respecto a los rangos diarios.
- Identificar prioridades nutricionales del dia.
- Generar diagnostico diario accionable segun energia, proteina, fibra, grasas y carbohidratos.
- Mostrar equivalencias de alimentos para cubrir proteina pendiente.
- Mostrar equivalencias de alimentos para cubrir carbohidratos pendientes.
- Mostrar equivalencias de alimentos para cubrir grasas pendientes.

## Recomendaciones

- Sugerir alimentos frecuentes a partir del historial.
- Usar favoritos como sugerencias cuando todavia no hay suficiente historial.
- Proponer alimentos base para empezar cuando no hay historial ni favoritos suficientes.
- Recomendar alimentos que combinan con un alimento ya registrado.
- Combinar reglas culinarias, categorias de alimentos, historial y comidas guardadas para ordenar recomendaciones.
- Evitar recomendaciones incompatibles dentro de una misma comida, como mezclar carne y pescado de forma redundante.
- Sugerir alimentos concretos desde el diagnostico diario.
- Anadir sugerencias del diagnostico como alimentos normales dentro del diario.
- Evitar sugerir alimentos que ya estan registrados en el contexto relevante.

## Comidas Guardadas

- Guardar una comida completa como plantilla reutilizable.
- Detectar comidas guardadas ya existentes por su composicion.
- Actualizar una comida guardada si se vuelve a guardar con la misma composicion.
- Insertar una comida guardada en el dia actual.
- Rellenar una comida vacia con una comida guardada.
- Crear una nueva comida si no hay una comida vacia disponible al insertar plantilla.
- Eliminar comidas guardadas con confirmacion.
- Guardar snapshots nutricionales de las comidas guardadas para mantenerlas estables si cambia la biblioteca.

## Biblioteca De Alimentos

- Consultar alimentos activos de la biblioteca.
- Buscar alimentos por nombre o alias.
- Crear alimentos personalizados.
- Editar alimentos existentes.
- Ocultar alimentos de la biblioteca.
- Reactivar un alimento oculto al crearlo de nuevo con el mismo nombre.
- Marcar y desmarcar alimentos como favoritos.
- Guardar macros por 100 g: calorias, proteina, carbohidratos, grasas y fibra.
- Guardar etiqueta de racion.
- Guardar gramos por racion.
- Definir medidas caseras por alimento cuando existen datos de porcion, unidad o tamano.
- Validar que los alimentos tengan nombre.
- Validar que kcal, proteina, carbohidratos y grasas esten completos.
- Impedir valores nutricionales negativos.
- Evitar nombres duplicados entre alimentos activos.

## Historial

- Registrar un dia en el historial.
- Impedir registrar dias sin alimentos.
- Guardar snapshot nutricional del dia al registrarlo.
- Proteger los dias registrados como solo lectura.
- Abrir dias registrados desde el historial.
- Repetir un dia guardado en un dia editable.
- Anadir comidas repetidas a un dia que ya tiene contenido.
- Conservar datos nutricionales disponibles aunque algun alimento original ya no exista activo.
- Calcular media reciente de los ultimos dias registrados.
- Mostrar porcentaje medio de proteina respecto al objetivo.
- Recuperar el ultimo dia cerrado como copia editable.
- Mover un registro al dia anterior cuando el dia anterior esta libre.
- Registrar el contenido actual como dia anterior cuando corresponde.

## Persistencia Y Seguridad

- Guardar estado en `localStorage`.
- Mantener persistidos perfil, alimentos, dias, ajustes, comidas guardadas y recuperacion del ultimo dia cerrado.
- Mantener compatibilidad con alimentos guardados en `meal.items`.
- Normalizar datos cargados para tolerar registros antiguos o incompletos.
- Mantener snapshots de historial para proteger totales historicos.
- Deshacer eliminacion de alimento.
- Deshacer eliminacion de comida.
- Deshacer vaciado de comida.
- Deshacer insercion de una sugerencia del diagnostico.
- Usar confirmaciones propias para acciones destructivas.
- Bloquear ediciones sobre dias ya guardados.
- Conservar datos locales ya existentes al cargar nuevas versiones de alimentos base.
