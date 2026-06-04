import { ArrowLeft, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { baseFoods } from '../../data/baseFoods';
import type { Food } from '../../domain/food';
import { getPrimaryMacro, searchFoods } from '../../domain/food';
import { formatKcal, formatMacro } from '../../domain/format';
import { useAppState } from '../../state/AppStateProvider';
import { FoodCard } from '../../ui/FoodCard';
import { FoodSprite } from '../../ui/FoodSprite';
import { PixelButton } from '../../ui/PixelButton';
import { SearchInput } from '../../ui/SearchInput';
import { SurfaceCard } from '../../ui/SurfaceCard';

function FoodDetail({
  food,
  favorite,
  onBack,
  onToggleFavorite,
}: {
  food: Food;
  favorite: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
}): JSX.Element {
  return (
    <main className="screen food-detail">
      <button type="button" className="icon-button" aria-label="Volver" onClick={onBack}>
        <ArrowLeft aria-hidden="true" size={28} />
      </button>
      <section className="food-detail__hero">
        <FoodSprite spriteKey={food.spriteKey} category={food.category} label={food.name} size="lg" />
        <span>{getPrimaryMacro(food)}</span>
        <h1>{food.name}</h1>
        <PixelButton className={favorite ? 'is-soft' : ''} onClick={onToggleFavorite}>
          <Star aria-hidden="true" size={20} fill={favorite ? 'currentColor' : 'none'} />
          {favorite ? 'Favorito' : 'Marcar favorito'}
        </PixelButton>
      </section>
      <SurfaceCard className="nutrition-detail">
        <h2>Por 100 g</h2>
        <dl>
          <div>
            <dt>Calorias</dt>
            <dd>{formatKcal(food.kcal)}</dd>
          </div>
          <div>
            <dt>Proteina</dt>
            <dd>{formatMacro(food.proteinG)}</dd>
          </div>
          <div>
            <dt>Carbohidratos</dt>
            <dd>{formatMacro(food.carbsG)}</dd>
          </div>
          <div>
            <dt>Grasas</dt>
            <dd>{formatMacro(food.fatG)}</dd>
          </div>
          <div>
            <dt>Fibra</dt>
            <dd>{formatMacro(food.fiberG)}</dd>
          </div>
        </dl>
      </SurfaceCard>
      <SurfaceCard className="serving-detail">
        <strong>Racion habitual</strong>
        <span>{food.servingLabel}</span>
        <strong>Unidad a ojo</strong>
        <span>{food.eyeballUnit}</span>
      </SurfaceCard>
    </main>
  );
}

export function FoodsScreen(): JSX.Element {
  const { state, dispatch } = useAppState();
  const [query, setQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const results = useMemo(
    () => searchFoods(baseFoods, query, state.favoriteFoodIds),
    [query, state.favoriteFoodIds],
  );
  const favoriteIds = new Set(state.favoriteFoodIds);
  const favorites = results.filter((food) => favoriteIds.has(food.id));
  const library = query ? results : results.slice(0, 85);

  if (selectedFood) {
    return (
      <FoodDetail
        food={selectedFood}
        favorite={favoriteIds.has(selectedFood.id)}
        onBack={() => setSelectedFood(null)}
        onToggleFavorite={() => dispatch({ type: 'toggleFavorite', foodId: selectedFood.id })}
      />
    );
  }

  return (
    <main className="screen foods-screen">
      <header className="screen-header">
        <h1>Alimentos</h1>
        <p>Biblioteca base y favoritos.</p>
      </header>
      <SearchInput
        value={query}
        placeholder="Buscar alimento o alias"
        onChange={(event) => setQuery(event.currentTarget.value)}
      />

      {favorites.length > 0 && (
        <section>
          <div className="section-title">
            <h2>Favoritos</h2>
            <span>{favorites.length}</span>
          </div>
          <div className="food-grid food-grid--compact">
            {favorites.slice(0, 6).map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                favorite
                onClick={() => setSelectedFood(food)}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="section-title">
          <h2>Biblioteca</h2>
          <span>{library.length}</span>
        </div>
        {library.length === 0 ? (
          <SurfaceCard className="empty-state">
            <strong>No hay resultados</strong>
            <p>Prueba con otro nombre o alias.</p>
          </SurfaceCard>
        ) : (
          <div className="food-grid food-grid--compact">
            {library.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                favorite={favoriteIds.has(food.id)}
                onClick={() => setSelectedFood(food)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
