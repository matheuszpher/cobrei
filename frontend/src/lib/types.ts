export type ID = number | string;

export interface Cliente {
  id: ID; nome: string; telefone: string; email: string | null; endereco: string | null;
  limiteCredito: number; observacao: string | null; criadoEm: string; saldoDevedor: number;
}
export type StatusVenda = 'ABERTA' | 'PARCIAL' | 'QUITADA';
export interface Venda {
  id: ID; clienteId: ID; cliente: { id: ID; nome: string }; data: string; vencimento: string;
  total: number; valorPago: number; saldo: number; status: StatusVenda; diasAtraso: number; descricao: string | null;
}
export type FormaPagamento = 'DINHEIRO' | 'PIX' | 'CARTAO';
export interface Pagamento { id: ID; vendaId: ID; clienteId: ID; cliente: { nome: string }; valor: number; forma: FormaPagamento; data: string }
export type Nivel = 'EM_DIA' | 'ATENCAO' | 'CRITICO';
export interface Devedor {
  cliente: { id: ID; nome: string; telefone: string }; saldo: number; diasAtraso: number;
  vencimentoMaisAntigo: string | null; vendasEmAberto: number; nivel: Nivel; ultimaCobranca: string | null;
}
export interface ClienteDetalhe extends Cliente { vendas: Venda[]; pagamentos: Pagamento[] }
export interface Notificacao { id: ID; clienteId: ID; cliente: { nome: string }; canal: string; mensagem: string; criadaEm: string }
export interface CobrancaResposta { notificacao: Notificacao; mensagem: string; link: string }
export interface Dashboard {
  totalEmAberto: number; totalVencido: number; clientesDevendo: number; recebidoNoMes: number; vendidoNoMes: number;
  faixasAtraso: { faixa: string; valor: number }[];
  ultimos6Meses: { mes: string; vendido: number; recebido: number }[];
  topDevedores: Devedor[];
}
