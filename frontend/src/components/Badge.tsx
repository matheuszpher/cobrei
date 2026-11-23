import { ReactNode } from 'react';
import { Nivel, StatusVenda } from '../lib/types';

type Tone = 'green' | 'amber' | 'red' | 'slate' | 'blue';
const tones: Record<Tone, string> = {
  green: 'bg-emdia-bg text-emdia-fg',
  amber: 'bg-atencao-bg text-atencao-fg',
  red: 'bg-critico-bg text-critico-fg',
  slate: 'bg-creme-escuro text-oliva',
  blue: 'bg-[#E4ECE6] text-floresta',
};
const dots: Record<Tone, string> = {
  green: 'bg-limao-500',
  amber: 'bg-[#E9C46A]',
  red: 'bg-[#D2553F]',
  slate: 'bg-oliva-claro',
  blue: 'bg-verde',
};

export function Badge({ tone = 'slate', children, dot = true }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dots[tone]}`} />}
      {children}
    </span>
  );
}

const nivelMap: Record<Nivel, { tone: Tone; label: string }> = {
  EM_DIA: { tone: 'green', label: 'Em dia' },
  ATENCAO: { tone: 'amber', label: 'Atenção' },
  CRITICO: { tone: 'red', label: 'Crítico' },
};
export function NivelBadge({ nivel }: { nivel: Nivel }) {
  const n = nivelMap[nivel] ?? nivelMap.EM_DIA;
  return <Badge tone={n.tone}>{n.label}</Badge>;
}

const statusMap: Record<StatusVenda, { tone: Tone; label: string }> = {
  ABERTA: { tone: 'amber', label: 'Aberta' },
  PARCIAL: { tone: 'blue', label: 'Parcial' },
  QUITADA: { tone: 'green', label: 'Quitada' },
};
export function StatusBadge({ status, atrasada }: { status: StatusVenda; atrasada?: boolean }) {
  if (atrasada && status !== 'QUITADA') return <Badge tone="red">Vencida</Badge>;
  const s = statusMap[status] ?? statusMap.ABERTA;
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
