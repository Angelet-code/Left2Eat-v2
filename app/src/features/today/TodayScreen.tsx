import { BookOpenCheck, ChevronLeft, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { baseFoods } from '../../data/baseFoods';
import type { Food } from '../../domain/food';
import { getPrimaryMacro, searchFoods } from '../../domain/food';
import { createDayDraft, type TrainingIntensity, type TrainingType } from '../../domain/days';
import { getActiveDateKey } from '../../domain/dates';
import { formatKcal, formatMacro, formatNumber } from '../../domain/format';
import {
  calculateDayTotals,
  calculateFoodMacros,
  calculateMealTotals,
  formatMealName,
  roundTotals,
  type Meal,
  type MealItemInput,
  type QuantityMode,
} from '../../domain/meals';
import { calculateDailyNutrition } from '../../domain/nutrition';
import {
  filterFoodsByMacro,
  recommendFoodsForMeal,
  type MacroFilter,
} from '../../domain/recommendations';
import { useAppState } from '../../state/AppStateProvider';
import { FoodCard } from '../../ui/FoodCard';
import { FoodSprite } from '../../ui/FoodSprite';
import { MacroBar } from '../../ui/MacroBar';
import { PixelButton } from '../../ui/PixelButton';
import { SearchInput } from '../../ui/SearchInput';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { SurfaceCard } from '../../ui/SurfaceCard';

const trainingOptions: Array<{ value: TrainingType; label: string }> = [
  { value: 'none', label: 'Sin entreno' },
  { value: 'strength', label: 'Fuerza' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'strength-cardio', label: 'Mixto' },
];

const intensityOptions: Array<{ value: TrainingIntensity; label: string }> = [
  { value: 'easy', label: 'Suave' },
  { value: 'normal', label: 'Normal' },
  { value: 'hard', label: 'Duro' },
];

const quantityOptions: Array<{ value: QuantityMode; label: string }> = [
  { value: 'grams', label: 'g' },
  { value: 'eyeball', label: 'a ojo' },
];

const macroFilterOptions: Array<{ value: MacroFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'protein', label: 'Proteina' },
  { value: 'carb', label: 'Carbo' },
  { value: 'fiber', label: 'Fibra' },
  { value: 'fat', label: 'Grasa' },
];

function KcalSummary({ nutrition }: { nutrition: ReturnType<typeof calculateDailyNutrition> }) {
  const progress = Math.min(
    100,
    Math.max(0, (nutrition.kcal.consumed / Math.max(1, nutrition.kcal.target)) * 100),
  );

  return (
    <SurfaceCard className="kcal-card">
      <div className="kcal-card__cols">
        <div>
          <span>Objetivo</span>
          <strong>{formatNumber(nutrition.kcal.target)}</strong>
          <small>kcal</small>
        </div>
        <div>
          <span>Consumidas</span>
          <strong>{formatNumber(nutrition.kcal.consumed)}</strong>
          <small>kcal</small>
        </div>
        <div>
          <span>Te quedan</span>
          <strong className="is-green">{formatNumber(Math.max(0, nutrition.kcal.remaining))}</strong>
          <small>kcal</small>
        </div>
      </div>
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <p>{formatNumber(progress)}% del objetivo</p>
    </SurfaceCard>
  );
}

function MealCard({ dateKey, meal }: { dateKey: string; meal: Meal }): JSX.Element {
  const { dispatch, state } = useAppState();
  const totals = roundTotals(calculateMealTotals(meal.items));

  return (
    <SurfaceCard className="meal-card">
      <div className="meal-card__summary">
        <div className="sprite-cluster">
          {meal.items.slice(0, 3).map((item) => (
            <FoodSprite
              key={item.id}
              spriteKey={item.snapshot.spriteKey}
              category={item.snapshot.category}
              size="sm"
            />
          ))}
        </div>
        <div>
          <strong>{formatMealName(meal)}</strong>
          <p>{meal.items.map((item) => item.snapshot.name).join(', ')}</p>
          <span>
            P: {formatMacro(totals.proteinG)} C: {formatMacro(totals.carbsG)} G:{' '}
            {formatMacro(totals.fatG)} F: {formatMacro(totals.fiberG)}
          </span>
        </div>
        <strong>{formatKcal(totals.kcal)}</strong>
      </div>

      <div className="meal-card__items">
        {meal.items.map((item) => (
          <div className="meal-item-row" key={item.id}>
            <FoodSprite
              spriteKey={item.snapshot.spriteKey}
              category={item.snapshot.category}
              label={item.snapshot.name}
              size="sm"
            />
            <span>{item.snapshot.name}</span>
            <input
              aria-label={`Cantidad de ${item.snapshot.name}`}
              type="number"
              min="1"
              step="5"
              value={Math.round(item.quantityGrams)}
              onChange={(event) =>
                dispatch({
                  type: 'updateMealItemQuantity',
                  dateKey,
                  mealId: meal.id,
                  itemId: item.id,
                  quantityGrams: Number(event.currentTarget.value),
                  quantityMode: 'grams',
                })
              }
            />
            <button
              type="button"
              aria-label={`Quitar ${item.snapshot.name}`}
              onClick={() =>
                dispatch({
                  type: 'removeMealItem',
                  dateKey,
                  mealId: meal.id,
                  itemId: item.id,
                })
              }
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="text-danger meal-card__delete"
        onClick={() => {
          if (meal.items.length === 0 || window.confirm('Eliminar esta comida?')) {
            dispatch({ type: 'deleteMeal', dateKey, mealId: meal.id, confirmed: true });
          }
        }}
      >
        <Trash2 aria-hidden="true" size={17} />
        Eliminar comida
      </button>
      <span className="sr-only">{state.settings.quantityMode}</span>
    </SurfaceCard>
  );
}

function AddMealFlow({
  dateKey,
  nutrition,
  onClose,
}: {
  dateKey: string;
  nutrition: ReturnType<typeof calculateDailyNutrition>;
  onClose: () => void;
}): JSX.Element {
  const { state, dispatch } = useAppState();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [step, setStep] = useState<'select' | 'quantity'>('select');
  const [query, setQuery] = useState('');
  const [macroFilter, setMacroFilter] = useState<MacroFilter>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quantityMode, setQuantityMode] = useState<QuantityMode>(state.settings.quantityMode);
  const [quantities, setQuantities] = useState<Record<string, { grams: number; eyeball: number }>>(
    {},
  );
  const foodById = useMemo(() => new Map(baseFoods.map((food) => [food.id, food])), []);
  const favoriteIds = useMemo(() => new Set(state.favoriteFoodIds), [state.favoriteFoodIds]);
  const librarySourceFoods = useMemo(() => {
    const favorites: Food[] = [];
    const regular: Food[] = [];

    for (const food of baseFoods) {
      if (favoriteIds.has(food.id)) {
        favorites.push(food);
      } else {
        regular.push(food);
      }
    }

    return [...favorites, ...regular];
  }, [favoriteIds]);
  const libraryFoods = useMemo(() => {
    const source = query.trim()
      ? searchFoods(baseFoods, query, state.favoriteFoodIds)
      : librarySourceFoods;
    return filterFoodsByMacro(source, macroFilter);
  }, [librarySourceFoods, macroFilter, query, state.favoriteFoodIds]);
  const recommendedFoods = useMemo(
    () =>
      recommendFoodsForMeal(
        baseFoods,
        {
          selectedFoodIds: selectedIds,
          favoriteFoodIds: state.favoriteFoodIds,
          nutrition,
        },
        6,
      ),
    [nutrition, selectedIds, state.favoriteFoodIds],
  );
  const showRecommendations = query.trim() === '' && macroFilter === 'all';
  const selectedFoods = selectedIds
    .map((id) => foodById.get(id))
    .filter((food): food is Food => Boolean(food));
  const currentFood = selectedFoods[currentIndex];
  const currentQuantity = currentFood
    ? quantities[currentFood.id] ?? { grams: currentFood.servingGrams, eyeball: 1 }
    : { grams: 100, eyeball: 1 };
  const preview = currentFood ? calculateFoodMacros(currentFood, currentQuantity.grams) : null;

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (step === 'quantity') {
          setStep('select');
        } else {
          onClose();
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, step]);

  function toggleFood(foodId: string) {
    setSelectedIds((ids) =>
      ids.includes(foodId) ? ids.filter((id) => id !== foodId) : [...ids, foodId],
    );
  }

  function setCurrentQuantity(nextMode: QuantityMode, value: number) {
    if (!currentFood || !Number.isFinite(value) || value <= 0) return;
    const grams = nextMode === 'grams' ? value : value * currentFood.servingGrams;
    const eyeball = nextMode === 'eyeball' ? value : grams / currentFood.servingGrams;
    setQuantities((current) => ({
      ...current,
      [currentFood.id]: { grams, eyeball },
    }));
  }

  function registerMeal() {
    const items: MealItemInput[] = selectedFoods.map((food) => {
      const quantity = quantities[food.id] ?? { grams: food.servingGrams, eyeball: 1 };
      return {
        foodId: food.id,
        quantityGrams: quantity.grams,
        quantityMode,
        eyeballAmount: quantity.eyeball,
      };
    });
    dispatch({ type: 'addMeal', dateKey, items });
    dispatch({ type: 'setQuantityMode', mode: quantityMode });
    onClose();
  }

  return (
    <div className="add-flow" role="dialog" aria-modal="true" aria-labelledby="add-flow-title">
      <button
        ref={closeButtonRef}
        type="button"
        className="icon-button add-flow__back"
        aria-label="Cerrar"
        onClick={() => {
          if (step === 'quantity') {
            setStep('select');
          } else {
            onClose();
          }
        }}
      >
        <ChevronLeft aria-hidden="true" size={34} />
      </button>

      {step === 'select' ? (
        <>
          <div className="step-label">
            <span>1</span>
            elige alimentos
          </div>
          <h1 id="add-flow-title">Escoge el primer alimento</h1>
          <SearchInput
            value={query}
            placeholder="Buscar alimento o alias"
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          <SegmentedControl<MacroFilter>
            label="Filtrar alimentos"
            value={macroFilter}
            options={macroFilterOptions}
            onChange={setMacroFilter}
            className="food-filter"
          />
          {showRecommendations && recommendedFoods.length > 0 && (
            <section className="recommendations-section">
              <div className="section-title">
                <h2>Recomendados</h2>
                <span>{recommendedFoods.length}</span>
              </div>
              <div className="food-grid food-grid--compact">
                {recommendedFoods.map((food) => (
                  <FoodCard
                    key={food.id}
                    food={food}
                    favorite={favoriteIds.has(food.id)}
                    onClick={() => toggleFood(food.id)}
                  />
                ))}
              </div>
            </section>
          )}
          <section className="food-library-section">
            <div className="section-title">
              <h2>{query.trim() || macroFilter !== 'all' ? 'Resultados' : 'Todos los alimentos'}</h2>
              <span>{libraryFoods.length}</span>
            </div>
            {libraryFoods.length === 0 ? (
              <SurfaceCard className="empty-state">
                <strong>No hay resultados</strong>
                <p>Prueba con otro nombre, alias o filtro.</p>
              </SurfaceCard>
            ) : (
              <div className="food-grid food-grid--compact">
                {libraryFoods.map((food) => (
                  <FoodCard
                    key={food.id}
                    food={food}
                    selected={selectedIds.includes(food.id)}
                    favorite={favoriteIds.has(food.id)}
                    onClick={() => toggleFood(food.id)}
                  />
                ))}
              </div>
            )}
          </section>
          <div className="selected-tray" aria-live="polite">
            <strong>{selectedIds.length} alimentos</strong>
            <span>Comida en curso</span>
            <PixelButton disabled={selectedIds.length === 0} onClick={() => setStep('quantity')}>
              Continuar
            </PixelButton>
          </div>
        </>
      ) : (
        <>
          <div className="step-label">
            <span>2</span>
            cantidades
          </div>
          <h1 id="add-flow-title">Cantidad de {currentFood?.name.toLowerCase()}</h1>
          {currentFood && (
            <SurfaceCard className="quantity-food">
              <FoodSprite
                spriteKey={currentFood.spriteKey}
                category={currentFood.category}
                label={currentFood.name}
                size="lg"
              />
              <div>
                <strong>{currentFood.name}</strong>
                <span>{getPrimaryMacro(currentFood)}</span>
              </div>
            </SurfaceCard>
          )}
          <p className="quantity-count">
            {currentIndex + 1} de {selectedFoods.length} alimentos
          </p>
          <div className="thumb-strip">
            {selectedFoods.map((food, index) => (
              <button
                type="button"
                className={index === currentIndex ? 'is-active' : ''}
                key={food.id}
                aria-label={`Editar cantidad de ${food.name}`}
                onClick={() => setCurrentIndex(index)}
              >
                <FoodSprite spriteKey={food.spriteKey} category={food.category} size="sm" />
              </button>
            ))}
          </div>
          <SegmentedControl
            label="Modo de cantidad"
            value={quantityMode}
            options={quantityOptions}
            onChange={(mode) => {
              setQuantityMode(mode);
              if (currentFood) {
                setCurrentQuantity(mode, mode === 'grams' ? currentQuantity.grams : currentQuantity.eyeball);
              }
            }}
            className="quantity-mode"
          />
          <div className="quantity-picker">
            <button
              type="button"
              onClick={() =>
                setCurrentQuantity(
                  quantityMode,
                  Math.max(1, (quantityMode === 'grams' ? currentQuantity.grams : currentQuantity.eyeball) - (quantityMode === 'grams' ? 10 : 0.5)),
                )
              }
            >
              -
            </button>
            <label>
              <span className="sr-only">Cantidad</span>
              <input
                aria-label="Cantidad"
                type="number"
                min="1"
                step={quantityMode === 'grams' ? 10 : 0.5}
                value={
                  quantityMode === 'grams'
                    ? Math.round(currentQuantity.grams)
                    : Number(currentQuantity.eyeball.toFixed(1))
                }
                onChange={(event) => setCurrentQuantity(quantityMode, Number(event.currentTarget.value))}
              />
              <strong>{quantityMode === 'grams' ? 'g' : currentFood?.eyeballUnit}</strong>
            </label>
            <button
              type="button"
              onClick={() =>
                setCurrentQuantity(
                  quantityMode,
                  (quantityMode === 'grams' ? currentQuantity.grams : currentQuantity.eyeball) + (quantityMode === 'grams' ? 10 : 0.5),
                )
              }
            >
              +
            </button>
          </div>
          <p className="quantity-preview">
            {preview && currentFood
              ? `${formatKcal(preview.kcal)} · ${getPrimaryMacro(currentFood)} · ${Math.round(currentQuantity.grams)} g`
              : ''}
          </p>
          <PixelButton
            onClick={() => {
              if (currentIndex < selectedFoods.length - 1) {
                setCurrentIndex((index) => index + 1);
              } else {
                registerMeal();
              }
            }}
          >
            {currentIndex < selectedFoods.length - 1 ? 'Siguiente' : 'Registrar comida'}
          </PixelButton>
        </>
      )}
    </div>
  );
}

export function TodayScreen(): JSX.Element {
  const { state, dispatch } = useAppState();
  const dateKey = getActiveDateKey();
  const [addingMeal, setAddingMeal] = useState(false);
  const [showRegisteredPopup, setShowRegisteredPopup] = useState(false);
  const day = state.dayDrafts[dateKey] ?? createDayDraft(dateKey);
  const totals = roundTotals(calculateDayTotals(day.meals));
  const nutrition = calculateDailyNutrition(state.profile, day.context, totals);
  const priority = nutrition.priorities.find((item) => item.includes('Cubrir')) ?? nutrition.priorities[0];
  const hasMeals = day.meals.length > 0;
  const isOptimalRange = [
    nutrition.kcal,
    nutrition.proteinG,
    nutrition.carbsG,
    nutrition.fatG,
    nutrition.fiberG,
  ].every((nutrient) => nutrient.status === 'ok');

  useEffect(() => {
    if (!showRegisteredPopup) return undefined;
    const timeout = window.setTimeout(() => setShowRegisteredPopup(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [showRegisteredPopup]);

  function registerCurrentDay() {
    if (!hasMeals) return;
    dispatch({ type: 'registerDay', dateKey });
    setShowRegisteredPopup(true);
  }

  return (
    <main className="screen today-screen" aria-label="Hoy">
      {showRegisteredPopup && (
        <div className="day-registered-popup" role="status" aria-live="polite">
          Día registrado
        </div>
      )}

      <KcalSummary nutrition={nutrition} />

      <SurfaceCard className="macro-card">
        <div className="macro-row">
          <FoodSprite spriteKey="pechuga-de-pollo" category="protein" size="sm" />
          <MacroBar label="Proteina" nutrient={nutrition.proteinG} tone="orange" />
        </div>
        <div className="macro-row">
          <FoodSprite spriteKey="arroz-cocido" category="carb" size="sm" />
          <MacroBar label="Carbohidratos" nutrient={nutrition.carbsG} />
        </div>
        <div className="macro-row">
          <FoodSprite spriteKey="aguacate" category="fat" size="sm" />
          <MacroBar label="Grasas" nutrient={nutrition.fatG} tone="red" />
        </div>
        <div className="macro-row">
          <FoodSprite spriteKey="brocoli" category="vegetable" size="sm" />
          <MacroBar label="Fibra" nutrient={nutrition.fiberG} tone="orange" />
        </div>
        <p className="macro-priority">
          Prioridad: <strong>{priority.replace('Cubrir ', '').toLowerCase()}</strong>
        </p>
      </SurfaceCard>

      <PixelButton
        className={`register-day-button ${isOptimalRange ? 'is-gold' : ''}`}
        disabled={!hasMeals}
        onClick={registerCurrentDay}
      >
        <BookOpenCheck aria-hidden="true" size={22} />
        Registrar día
      </PixelButton>

      <SurfaceCard className="context-card">
        <strong>Contexto del dia</strong>
        <SegmentedControl
          label="Entreno"
          value={day.context.trainingType}
          options={trainingOptions}
          onChange={(trainingType) =>
            dispatch({ type: 'setDayContext', dateKey, context: { trainingType } })
          }
        />
        <SegmentedControl
          label="Intensidad"
          value={day.context.trainingIntensity}
          options={intensityOptions}
          onChange={(trainingIntensity) =>
            dispatch({ type: 'setDayContext', dateKey, context: { trainingIntensity } })
          }
        />
        <label className="steps-input">
          <span>Pasos</span>
          <input
            type="number"
            min="0"
            max="70000"
            step="500"
            value={day.context.actualSteps ?? ''}
            placeholder={`${state.profile.habitualStepsPerDay}`}
            onChange={(event) =>
              dispatch({
                type: 'setDayContext',
                dateKey,
                context: {
                  actualSteps: event.currentTarget.value
                    ? Number(event.currentTarget.value)
                    : undefined,
                },
              })
            }
          />
        </label>
      </SurfaceCard>

      {(nutrition.errors.length > 0 || nutrition.flags.length > 0) && (
        <SurfaceCard className="calculation-note">
          {nutrition.errors.length > 0
            ? 'Revisa el contexto o perfil: hay datos fuera de rango.'
            : 'Calculo orientativo ajustado por datos poco habituales.'}
        </SurfaceCard>
      )}

      <section className="meal-section">
        <div className="section-title">
          <h2>Comidas de hoy</h2>
          <span>{formatKcal(totals.kcal)}</span>
        </div>
        {day.meals.length === 0 ? (
          <SurfaceCard className="empty-state">
            <Plus aria-hidden="true" size={32} />
            <strong>Añade tu primera comida</strong>
            <p>Left2Eat calculara lo que queda por cubrir hoy.</p>
          </SurfaceCard>
        ) : (
          day.meals.map((meal) => <MealCard key={meal.id} dateKey={dateKey} meal={meal} />)
        )}
      </section>

      <PixelButton className="main-cta" onClick={() => setAddingMeal(true)}>
        <Plus aria-hidden="true" size={24} />
        Añadir comida
      </PixelButton>

      {addingMeal && (
        <AddMealFlow
          dateKey={dateKey}
          nutrition={nutrition}
          onClose={() => setAddingMeal(false)}
        />
      )}
    </main>
  );
}
