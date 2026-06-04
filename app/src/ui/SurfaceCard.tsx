import type { HTMLAttributes, PropsWithChildren } from 'react';

type SurfaceCardProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function SurfaceCard({ children, className = '', ...props }: SurfaceCardProps): JSX.Element {
  return (
    <div className={`surface-card ${className}`} {...props}>
      {children}
    </div>
  );
}
