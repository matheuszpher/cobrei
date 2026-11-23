// Regras de negócio puras do fiado (sem framework, sem banco).
export type Nivel = 'EM_DIA' | 'ATENCAO' | 'CRITICO';
export type StatusVenda = 'ABERTA' | 'PARCIAL' | 'QUITADA';

const DIA_MS = 24 * 60 * 60 * 1000;
export const arred = (v: number) => Math.round(v * 100) / 100;

export function statusDaVenda(total: number, pago: number): StatusVenda {
  if (pago <= 0) return 'ABERTA';
  if (arred(total - pago) <= 0) return 'QUITADA';
  return 'PARCIAL';
}

export function diasDeAtraso(vencimento: Date, hoje: Date): number {
  const d = Math.floor((inicioDoDia(hoje).getTime() - inicioDoDia(vencimento).getTime()) / DIA_MS);
  return d > 0 ? d : 0;
}

export function nivelDeAtraso(dias: number): Nivel {
  if (dias <= 0) return 'EM_DIA';
  if (dias <= 30) return 'ATENCAO';
  return 'CRITICO';
}

export function faixaDeAtraso(dias: number): string {
  if (dias <= 0) return 'Em dia';
  if (dias <= 30) return '1-30 dias';
  if (dias <= 60) return '31-60 dias';
  return '60+ dias';
}

export function cabeNoLimite(saldoAtual: number, novaCompra: number, limite: number): boolean {
  return arred(saldoAtual + novaCompra) <= arred(limite);
}

export function mensagemDeCobranca(nome: string, saldo: number, dias: number, loja: string): string {
  const valor = saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const primeiro = nome.split(' ')[0];
  const atraso = dias > 0 ? `, com a parcela mais antiga vencida há ${dias} dia${dias > 1 ? 's' : ''}` : '';
  return `Olá, ${primeiro}! Tudo bem? Aqui é do ${loja}. Passando para lembrar que seu saldo no fiado está em ${valor}${atraso}. Quando puder, passe aqui ou pague por PIX. Obrigado!`;
}

function inicioDoDia(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export class ErroDeNegocio extends Error {
  constructor(public status: number, mensagem: string) {
    super(mensagem);
  }
}
