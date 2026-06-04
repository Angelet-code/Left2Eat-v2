import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type PixelButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>;

export function PixelButton({ children, className = '', ...props }: PixelButtonProps): JSX.Element {
  return (
    <button className={`pixel-button ${className}`} type="button" {...props}>
      {children}
    </button>
  );
}
