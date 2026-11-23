import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type Tipo = 'sucesso' | 'erro' | 'info';
interface ToastItem { id: number; tipo: Tipo; titulo: string; descricao?: string }
interface Ctx {
  sucesso: (titulo: string, descricao?: string) => void;
  erro: (titulo: string, descricao?: string) => void;
  info: (titulo: string, descricao?: string) => void;
}
const ToastCtx = createContext<Ctx | null>(null);

let seq = 0;
const icones = {
  sucesso: <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />,
  erro: <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />,
  info: <Info className="h-5 w-5 shrink-0 text-sky-500" />,
};
const barras = { sucesso: 'bg-emerald-500', erro: 'bg-rose-500', info: 'bg-sky-500' };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const remove = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (tipo: Tipo, titulo: string, descricao?: string) => {
      const id = ++seq;
      setItems((l) => [...l, { id, tipo, titulo, descricao }]);
      setTimeout(() => remove(id), 4500);
    },
    [remove],
  );
  const value = useMemo<Ctx>(
    () => ({
      sucesso: (t, d) => push('sucesso', t, d),
      erro: (t, d) => push('erro', t, d),
      info: (t, d) => push('info', t, d),
    }),
    [push],
  );
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} className="pointer-events-auto relative flex animate-slide-in items-start gap-3 overflow-hidden rounded-xl border border-slate-100 bg-white p-4 pl-5 shadow-xl">
            <span className={`absolute inset-y-0 left-0 w-1 ${barras[t.tipo]}`} />
            {icones[t.tipo]}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{t.titulo}</p>
              {t.descricao && <p className="mt-0.5 text-sm text-slate-500">{t.descricao}</p>}
            </div>
            <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-slate-600" aria-label="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const c = useContext(ToastCtx);
  if (!c) throw new Error('useToast fora do ToastProvider');
  return c;
}
