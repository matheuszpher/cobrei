import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, HandCoins, Mail, MapPin, MessageCircle, Pencil, Phone, Plus, Receipt, StickyNote, Wallet } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { useCobrar } from '../lib/useCobrar';
import { ClienteDetalhe as TCliente, Venda } from '../lib/types';
import { data as fData, dataHora, moeda, telefone } from '../lib/format';
import { Avatar, Card, EmptyState, ProgressBar, Spinner } from '../components/ui';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/Badge';
import { ClienteFormModal } from '../components/ClienteFormModal';
import { PagamentoModal } from '../components/PagamentoModal';
import { NovaVendaModal } from '../components/NovaVendaModal';

const formaLabel: Record<string, string> = { DINHEIRO: 'Dinheiro', PIX: 'Pix', CARTAO: 'Cartão' };

export default function ClienteDetalhe() {
  const { id } = useParams();
  const { data: c, loading, error, reload } = useApi<TCliente>(`/clientes/${id}`);
  const { cobrar, cobrando } = useCobrar(reload);
  const [editar, setEditar] = useState(false);
  const [pagar, setPagar] = useState<Venda | null>(null);
  const [nova, setNova] = useState(false);

  if (loading && !c) return <Spinner label="Carregando cliente..." />;
  if (error || !c)
    return (
      <Card>
        <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="Cliente não encontrado" description={error ?? ''} action={<Link to="/clientes"><Button variant="secondary">Voltar para clientes</Button></Link>} />
      </Card>
    );

  const vendas = c.vendas ?? [];
  const pagamentos = c.pagamentos ?? [];
  const pct = c.limiteCredito > 0 ? Math.round((c.saldoDevedor / c.limiteCredito) * 100) : 0;

  return (
    <div>
      <Link to="/clientes" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Clientes
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar nome={c.nome} className="!h-14 !w-14 text-lg" />
          <div>
            <h1 className="font-serif text-4xl font-light tracking-tight text-floresta sm:text-5xl">{c.nome}</h1>
            <p className="text-sm text-slate-500">Cliente desde {fData(c.criadoEm)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditar(true)}>Editar</Button>
          <Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => setNova(true)}>Nova venda</Button>
          {c.saldoDevedor > 0 && (
            <Button variant="whatsapp" icon={<MessageCircle className="h-4 w-4" />} loading={cobrando === c.id} onClick={() => cobrar(c.id, c.nome)}>
              Cobrar no WhatsApp
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Saldo devedor</p>
            <Wallet className="h-5 w-5 text-slate-400" />
          </div>
          <p className={`mt-3 font-serif text-5xl font-light tracking-tight ${c.saldoDevedor > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{moeda(c.saldoDevedor)}</p>
          <p className="mt-1 text-xs text-slate-400">{vendas.filter((v) => v.status !== 'QUITADA').length} venda(s) em aberto</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Limite usado</p>
            <span className="text-sm font-semibold text-slate-700">{pct}%</span>
          </div>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {moeda(c.saldoDevedor)} <span className="text-sm font-normal text-slate-400">de {moeda(c.limiteCredito)}</span>
          </p>
          <div className="mt-3">
            <ProgressBar value={c.saldoDevedor} max={c.limiteCredito} />
          </div>
          <p className="mt-2 text-xs text-slate-400">Disponível: {moeda(Math.max(0, c.limiteCredito - c.saldoDevedor))}</p>
        </Card>
        <Card className="space-y-2.5 p-5 text-sm">
          <p className="flex items-center gap-2 text-slate-600"><Phone className="h-4 w-4 text-slate-400" /> {telefone(c.telefone)}</p>
          <p className="flex items-center gap-2 text-slate-600"><Mail className="h-4 w-4 text-slate-400" /> {c.email || '—'}</p>
          <p className="flex items-center gap-2 text-slate-600"><MapPin className="h-4 w-4 text-slate-400" /> {c.endereco || '—'}</p>
          {c.observacao && <p className="flex items-start gap-2 text-slate-600"><StickyNote className="mt-0.5 h-4 w-4 text-slate-400" /> {c.observacao}</p>}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Vendas fiado</h2>
          </div>
          {vendas.length === 0 ? (
            <EmptyState icon={<Receipt className="h-6 w-6" />} title="Nenhuma venda" description="As compras fiado deste cliente aparecem aqui." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {vendas.map((v) => (
                <li key={String(v.id)} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      Venda #{v.id} · {fData(v.data)}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      Vence {fData(v.vencimento)}
                      {v.descricao ? ` · ${v.descricao}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={v.status} atrasada={v.diasAtraso > 0} />
                  <div className="w-28 text-right">
                    <p className="text-sm font-semibold text-slate-900">{moeda(v.saldo)}</p>
                    <p className="text-xs text-slate-400">de {moeda(v.total)}</p>
                  </div>
                  {v.status !== 'QUITADA' && (
                    <Button size="sm" variant="secondary" icon={<HandCoins className="h-4 w-4" />} onClick={() => setPagar({ ...v, cliente: v.cliente ?? { id: c.id, nome: c.nome } })}>
                      Receber
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Pagamentos</h2>
          </div>
          {pagamentos.length === 0 ? (
            <EmptyState icon={<HandCoins className="h-6 w-6" />} title="Nenhum pagamento" description="Os pagamentos recebidos aparecem aqui." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {pagamentos.map((p) => (
                <li key={String(p.id)} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{formaLabel[p.forma] ?? p.forma}</p>
                    <p className="text-xs text-slate-500">
                      {dataHora(p.data)} · Venda #{p.vendaId}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">+ {moeda(p.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <ClienteFormModal open={editar} cliente={c} onClose={() => setEditar(false)} onSaved={reload} />
      <PagamentoModal venda={pagar} onClose={() => setPagar(null)} onSaved={reload} />
      <NovaVendaModal open={nova} onClose={() => setNova(false)} onSaved={reload} clienteInicial={c.id} />
    </div>
  );
}
