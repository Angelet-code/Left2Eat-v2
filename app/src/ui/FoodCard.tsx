import type { Food } from '../domain/food';
import { getPrimaryMacro } from '../domain/food';
import { FoodSprite } from './FoodSprite';

type FoodCardProps = {
  food: Food;
  selected?: boolean;
  favorite?: boolean;
  onClick: () => void;
};

export function FoodCard({ food, selected = false, favorite = false, onClick }: FoodCardProps): JSX.Element {
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
      <FoodSprite spriteKey={food.spriteKey} category={food.category} label="" size="lg" />
      <strong>{food.name}</strong>
      <span>{getPrimaryMacro(food)}</span>
    </button>
  );
}
