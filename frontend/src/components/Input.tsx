import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

const base =
  'w-full rounded-xl border border-borda bg-white px-3.5 py-2.5 text-sm text-floresta placeholder:text-oliva-claro transition focus:border-floresta focus:outline-none focus:ring-4 focus:ring-limao/25 disabled:bg-creme';

function Field({ label, error, hint, children }: { label?: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-oliva">{label}</span>}
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; hint?: string; icon?: ReactNode }

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, icon, className = '', ...rest }, ref) => (
  <Field label={label} error={error} hint={hint}>
    <div className="relative">
      {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
      <input ref={ref} {...rest} className={`${base} ${icon ? 'pl-10' : ''} ${error ? 'border-rose-400' : ''} ${className}`} />
    </div>
  </Field>
));
Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; error?: string }
export function Select({ label, error, className = '', children, ...rest }: SelectProps) {
  return (
    <Field label={label} error={error}>
      <select {...rest} className={`${base} pr-8 ${className}`}>{children}</select>
    </Field>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string }
export function Textarea({ label, error, className = '', ...rest }: TextareaProps) {
  return (
    <Field label={label} error={error}>
      <textarea {...rest} className={`${base} min-h-[80px] ${className}`} />
    </Field>
  );
}
