import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-borda bg-white ${className}`}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-4xl font-light leading-none tracking-tight text-floresta sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 text-sm text-oliva">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-creme text-floresta ring-1 ring-borda">{icon}</div>
      <h3 className="font-serif text-2xl font-light text-floresta">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-oliva">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Spinner({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-oliva">
      <Loader2 className="h-7 w-7 animate-spin text-floresta" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-creme-escuro/70 ${className}`} />;
}

const palette = [
  'bg-[#E6F2D9] text-[#2F5E2A]',
  'bg-[#F1E4CF] text-[#7A5A2E]',
  'bg-[#E9E2D3] text-[#5C5543]',
  'bg-[#F4DDD3] text-[#8A3E2B]',
  'bg-[#DDE7DF] text-[#1F3D2B]',
  'bg-[#EFE7C8] text-[#6F5F1C]',
];
export function Avatar({ nome, className = '' }: { nome: string; className?: string }) {
  const idx = Array.from(nome || '?').reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  const ini = (nome || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-serif text-sm ${palette[idx]} ${className}`}>{ini}</div>;
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : value > 0 ? 100 : 0;
  const color = pct >= 90 ? 'bg-critico-fg' : pct >= 70 ? 'bg-[#E9C46A]' : 'bg-limao-500';
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-creme-escuro">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Moeda com check: círculo, anel interno fino (borda de moeda) e visto no centro. */
export function CoinCheck({ className = '', inverted = false }: { className?: string; inverted?: boolean }) {
  const fundo = inverted ? '#F3F1EA' : '#1F3D2B';
  const traco = inverted ? '#1F3D2B' : '#F3F1EA';
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill={fundo} />
      <circle cx="16" cy="16" r="11.5" fill="none" stroke={traco} strokeWidth="1" opacity="0.7" />
      <path d="M11 16.4l3.4 3.4L21.2 13" fill="none" stroke={traco} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ light = false, size = 'md' }: { light?: boolean; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-11 w-11' : 'h-8 w-8';
  const txt = size === 'lg' ? 'text-4xl' : 'text-[26px]';
  return (
    <div className="flex items-center gap-2.5">
      <CoinCheck className={box} inverted={light} />
      <span className={`${txt} font-serif font-normal leading-none tracking-tight ${light ? 'text-creme' : 'text-floresta'}`}>Cobrei</span>
    </div>
  );
}

/** Valor em reais com o "R$" pequeno em verde-limão (estilo KPI Evergrid). */
export function Valor({ v, className = '', simbolo = 'text-limao-500' }: { v: string; className?: string; simbolo?: string }) {
  const m = v.match(/^(-?)R\$\s?(.*)$/);
  if (!m) return <span className={className}>{v}</span>;
  return (
    <span className={className}>
      {m[1]}
      <span className={`mr-1 align-[0.35em] text-[0.45em] font-normal ${simbolo}`}>R$</span>
      {m[2]}
    </span>
  );
}
