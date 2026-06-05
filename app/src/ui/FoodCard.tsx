import type { Food } from '../domain/food';
import { getDisplayFoodName, getPrimaryMacro } from '../domain/food';
import { FoodSprite } from './FoodSprite';

type FoodCardProps = {
  food: Food;
  selected?: boolean;
  favorite?: boolean;
  onClick: () => void;
};

export function FoodCard({ food, selected = false, favorite = false, onClick }: FoodCardProps): JSX.Element {
  const displayName = getDisplayFoodName(food);

  return (
    <button
      type="button"
      className={`food-card ${selected ? 'is-selected' : ''}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className="food-card__favorite" aria-hidden="true">
        {favorite ? '★' : ''}
      </span>
      <FoodSprite spriteKey={food.spriteKey} category={food.category} label={displayName} size="lg" />
      <strong>{displayName}</strong>
      <span>{getPrimaryMacro(food)}</span>
    </button>
  );
}
