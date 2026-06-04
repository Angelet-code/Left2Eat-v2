import { resolveSpriteVariant } from '../data/spriteMap';
import type { FoodCategory } from '../domain/food';

type FoodSpriteProps = {
  spriteKey: string;
  category: FoodCategory;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
};

function SpriteShape({ variant }: { variant: string }): JSX.Element {
  if (variant === 'carb') {
    return (
      <>
        <rect x="7" y="16" width="18" height="8" fill="#7a4b27" />
        <rect x="9" y="12" width="14" height="7" fill="#fff7de" />
        <rect x="11" y="10" width="10" height="4" fill="#fffdf0" />
        <rect x="6" y="20" width="20" height="5" fill="#5a3320" />
      </>
    );
  }
  if (variant === 'fruit') {
    return (
      <>
        <rect x="11" y="9" width="11" height="4" fill="#f8c12a" />
        <rect x="8" y="13" width="15" height="7" fill="#ffdd35" />
        <rect x="10" y="20" width="12" height="4" fill="#e78d1a" />
        <rect x="21" y="8" width="3" height="5" fill="#5f3a1f" />
      </>
    );
  }
  if (variant === 'vegetable') {
    return (
      <>
        <rect x="10" y="13" width="12" height="10" fill="#245c2e" />
        <rect x="7" y="10" width="8" height="8" fill="#4c9a3b" />
        <rect x="15" y="8" width="8" height="8" fill="#6fb542" />
        <rect x="12" y="22" width="8" height="5" fill="#87b86a" />
      </>
    );
  }
  if (variant === 'legume') {
    return (
      <>
        <rect x="7" y="16" width="18" height="8" fill="#d7d0c4" />
        <rect x="9" y="12" width="14" height="8" fill="#8a5328" />
        <rect x="12" y="14" width="3" height="3" fill="#c98745" />
        <rect x="18" y="15" width="3" height="3" fill="#c98745" />
      </>
    );
  }
  if (variant === 'dairy') {
    return (
      <>
        <rect x="10" y="9" width="12" height="18" fill="#e8f3ff" />
        <rect x="11" y="13" width="10" height="12" fill="#ffffff" />
        <rect x="10" y="9" width="12" height="5" fill="#57a9d8" />
        <rect x="20" y="8" width="2" height="7" fill="#5a3320" />
      </>
    );
  }
  if (variant === 'fat') {
    return (
      <>
        <rect x="8" y="11" width="16" height="15" fill="#7fc45e" />
        <rect x="11" y="13" width="10" height="10" fill="#f4f0bd" />
        <rect x="14" y="16" width="5" height="5" fill="#8a4f24" />
      </>
    );
  }
  if (variant === 'cheese') {
    return (
      <>
        <rect x="8" y="12" width="18" height="12" fill="#f0b94f" />
        <rect x="10" y="15" width="4" height="4" fill="#fff3b8" />
        <rect x="18" y="18" width="3" height="3" fill="#fff3b8" />
      </>
    );
  }
  if (variant === 'protein') {
    return (
      <>
        <rect x="8" y="13" width="16" height="11" fill="#d68134" />
        <rect x="11" y="10" width="8" height="5" fill="#f4b45d" />
        <rect x="6" y="18" width="6" height="4" fill="#ffe7c7" />
        <rect x="22" y="14" width="4" height="7" fill="#8c4a23" />
      </>
    );
  }
  return (
    <>
      <rect x="8" y="10" width="16" height="16" fill="#d8b68c" />
      <rect x="11" y="13" width="10" height="10" fill="#fff4df" />
    </>
  );
}

export function FoodSprite({
  spriteKey,
  category,
  label,
  size = 'md',
}: FoodSpriteProps): JSX.Element {
  const variant = resolveSpriteVariant(spriteKey, category);

  return (
    <span className={`food-sprite food-sprite--${size}`} aria-label={label} role={label ? 'img' : undefined}>
      <svg viewBox="0 0 32 32" aria-hidden={label ? undefined : true} focusable="false">
        <rect x="6" y="7" width="20" height="20" fill="#24160e" opacity="0.18" />
        <SpriteShape variant={variant} />
        <rect x="7" y="9" width="2" height="17" fill="#24160e" opacity="0.72" />
        <rect x="24" y="11" width="2" height="14" fill="#24160e" opacity="0.72" />
        <rect x="9" y="25" width="16" height="2" fill="#24160e" opacity="0.72" />
      </svg>
    </span>
  );
}
