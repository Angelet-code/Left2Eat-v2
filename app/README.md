# Left2Eat v2

Web/PWA mobile first para registrar comidas y responder que queda por comer en el dia.

## Scripts

- `npm run dev`: servidor Vite local.
- `npm test`: tests unitarios y smoke UI.
- `npm run build`: TypeScript + build de produccion.

## Arquitectura

- `src/domain`: modelos y calculos puros.
- `src/data`: alimentos base estaticos y sprites.
- `src/storage`: schema versionado, migraciones y localStorage.
- `src/state`: reducer/context de la app.
- `src/features`: pantallas Hoy, Alimentos, Historial y Perfil.
- `src/ui`: componentes visuales reutilizables.

La app no parsea `alimentos-macros.md` en runtime. La semilla vive en `src/data/baseFoods.ts`.
