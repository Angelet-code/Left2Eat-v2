import { Search } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

type SearchInputProps = InputHTMLAttributes<HTMLInputElement>;

export function SearchInput({ className = '', ...props }: SearchInputProps): JSX.Element {
  return (
    <label className={`search-input ${className}`}>
      <Search aria-hidden="true" size={24} strokeWidth={2.4} />
      <input type="search" {...props} />
    </label>
  );
}
