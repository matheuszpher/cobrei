import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'whatsapp';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-floresta text-creme hover:bg-floresta-800 focus-visible:ring-floresta',
  secondary: 'bg-white text-floresta border border-borda hover:border-floresta/40 hover:bg-creme-claro focus-visible:ring-floresta/40',
  danger: 'bg-critico-fg text-white hover:bg-[#82291c] focus-visible:ring-critico-fg',
  ghost: 'text-oliva hover:bg-creme hover:text-floresta focus-visible:ring-floresta/30',
  whatsapp: 'bg-floresta text-creme hover:bg-floresta-800 focus-visible:ring-floresta',
};
// Círculo à esquerda com o ícone (estilo Evergrid) para variantes cheias.
const circulo: Record<Variant, string> = {
  primary: 'bg-creme text-floresta',
  whatsapp: 'bg-limao text-floresta',
  danger: 'bg-white/90 text-critico-fg',
  secondary: '',
  ghost: '',
};
const sizes: Record<Size, string> = {
  sm: 'h-8 text-xs gap-2',
  md: 'h-10 text-sm gap-2.5',
  lg: 'h-12 text-[15px] gap-3',
};
const circSize: Record<Size, string> = { sm: 'h-6 w-6', md: 'h-7 w-7', lg: 'h-9 w-9' };

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading, icon, className = '', children, disabled, ...rest }: Props) {
  const ic = loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon;
  const cheio = !!circulo[variant];
  const soIcone = !children;
  const comCirculo = cheio && !!ic && !soIcone;
  const pad = soIcone ? (size === 'sm' ? 'w-8' : 'w-10') : comCirculo ? 'pl-1 pr-4' : size === 'sm' ? 'px-3.5' : 'px-5';
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-full font-medium tracking-tight transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-creme disabled:cursor-not-allowed disabled:opacity-50 active:scale-[.98] whitespace-nowrap ${variants[variant]} ${sizes[size]} ${pad} ${className}`}
    >
      {comCirculo ? <span className={`flex items-center justify-center rounded-full ${circSize[size]} ${circulo[variant]}`}>{ic}</span> : ic}
      {children}
    </button>
  );
}
