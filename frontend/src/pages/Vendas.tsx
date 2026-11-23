import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Ban, ChevronDown, ChevronRight, HandCoins, Plus, Receipt } from 'lucide-react';
import { api, erroMsg, qs } from '../lib/api';
import { useApi } from '../lib/useApi';
import { StatusVenda, Venda } from '../lib/types';
import { data as fData, moeda } from '../lib/format';
import { Card, EmptyState, PageHeader } from '../components/ui';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/Badge';
import { Column, Table } from '../components/Table';
import { ConfirmModal } from '../components/Modal';
import { PagamentoModal } from '../components/PagamentoModal';
import { NovaVendaModal } from '../components/NovaVendaModal';
import { useToast } from '../components/Toast';

const filtros: { valor: StatusVenda | ''; label: string }[] = [
  { valor: '', label: 'Todas' },
  { valor: 'ABERTA', label: 'Abertas' },
  { valor: 'PARCIAL', label: 'Parciais' },
  { valor: 'QUITADA', label: 'Quitadas' },
];

export default function Vendas() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState<StatusVenda | ''>('');
  const { data, loading, error, reload } = useApi<Venda[]>(`/vendas${qs({ status })}`);
  const [expandida, setExpandida] = useState<string | null>(null);
  const [nova, setNova] = useState(false);
  const [pagar, setPagar] = useState<Venda | null>(null);
  const [cancelar, setCancelar] = useState<Venda | null>(null);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    if (params.get('nova')) {
      setNova(true);
      params.delete('nova');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  async function confirmarCancelamento() {
    if (!cancelar) return;
    setCancelando(true);
    try {
      await api.del(`/vendas/${cancelar.id}`);
      toast.sucesso('Venda cancelada', 'O estoque dos produtos foi devolvido.');
      setCancelar(null);
      reload();
    } catch (e) {
      toast.erro('Não foi possível cancelar', erroMsg(e));
    } finally {
      setCancelando(false);
    }
  }

  const toggle = (v: Venda) => setExpandida((e) => (e === String(v.id) ? null : String(v.id)));

  const columns: Column<Venda>[] = [
    {
      key: 'exp',
      header: '',
      className: 'w-8 !pr-0',
      render: (v) => (expandida === String(v.id) ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />),
    },
    {
      key: 'venda',
      header: 'Venda',
      render: (v) => (
        <div>
          <p className="font-medium text-slate-900">#{v.id}</p>
          <p className="text-xs text-slate-500">{fData(v.data)}</p>
        </div>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (v) => (
        <Link to={`/clientes/${v.clienteId}`} onClick={(e) => e.stopPropagation()} className="font-medium text-slate-800 hover:text-emerald-700">
          {v.cliente?.nome}
        </Link>
      ),
    },
    {
      key: 'venc',
      header: 'Vencimento',
      render: (v) => (
        <div>
          <p>{fData(v.vencimento)}</p>
          {v.diasAtraso > 0 && v.status !== 'QUITADA' && <p className="text-xs font-medium text-rose-600">{v.diasAtraso} dias de atraso</p>}
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v.status} atrasada={v.diasAtraso > 0} /> },
    { key: 'total', header: 'Total', align: 'right', render: (v) => moeda(v.total) },
    {
      key: 'saldo',
      header: 'Saldo',
      align: 'right',
      render: (v) => <span className={`font-semibold ${v.saldo > 0 ? 'text-slate-900' : 'text-emerald-600'}`}>{moeda(v.saldo)}</span>,
    },
    {
      key: 'acoes',
      header: '',
      align: 'right',
      render: (v) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {v.status !== 'QUITADA' && (
            <Button size="sm" variant="secondary" icon={<HandCoins className="h-4 w-4" />} onClick={() => setPagar(v)}>
              Receber
            </Button>
          )}
          {v.valorPago === 0 && (
            <Button size="sm" variant="ghost" className="hover:!bg-rose-50 hover:!text-rose-600" icon={<Ban className="h-4 w-4" />} onClick={() => setCancelar(v)} title="Cancelar venda" aria-label="Cancelar venda" />
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Vendas fiado" subtitle="Tudo o que foi vendido para pagar depois." actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setNova(true)}>Nova venda fiado</Button>} />

      <div className="mb-4 inline-flex flex-wrap gap-1 rounded-full border border-borda bg-white p-1">
        {filtros.map((f) => (
          <button
            key={f.valor || 'todas'}
            onClick={() => setStatus(f.valor)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${status === f.valor ? 'bg-floresta text-creme' : 'text-oliva hover:text-floresta'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? (
        <Card>
          <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="Erro ao carregar vendas" description={error} action={<Button onClick={reload}>Tentar de novo</Button>} />
        </Card>
      ) : (
        <Table
          columns={columns}
          rows={data ?? []}
          rowKey={(v) => String(v.id)}
          loading={loading}
          onRowClick={toggle}
          isExpanded={(v) => expandida === String(v.id)}
          renderExpanded={(v) => (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Produto</th>
                    <th className="px-4 py-2 text-center font-semibold">Qtd.</th>
                    <th className="px-4 py-2 text-right font-semibold">Preço unit.</th>
                    <th className="px-4 py-2 text-right font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(v.itens ?? []).map((i) => (
                    <tr key={String(i.id)}>
                      <td className="px-4 py-2 text-slate-800">{i.produto?.nome}</td>
                      <td className="px-4 py-2 text-center">{i.quantidade}</td>
                      <td className="px-4 py-2 text-right">{moeda(i.precoUnitario)}</td>
                      <td className="px-4 py-2 text-right font-medium">{moeda(i.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 text-sm">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-slate-500">
                      Total {moeda(v.total)} · Pago <span className="text-emerald-600">{moeda(v.valorPago)}</span> · Saldo
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-slate-900">{moeda(v.saldo)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          empty={
            <EmptyState
              icon={<Receipt className="h-6 w-6" />}
              title={status ? 'Nenhuma venda com este status' : 'Nenhuma venda fiado ainda'}
              description={status ? 'Experimente outro filtro.' : 'Registre a primeira venda fiado do seu comércio.'}
              action={!status && <Button icon={<Plus className="h-4 w-4" />} onClick={() => setNova(true)}>Nova venda fiado</Button>}
            />
          }
        />
      )}

      <NovaVendaModal open={nova} onClose={() => setNova(false)} onSaved={reload} />
      <PagamentoModal venda={pagar} onClose={() => setPagar(null)} onSaved={reload} />
      <ConfirmModal
        open={!!cancelar}
        onClose={() => setCancelar(null)}
        onConfirm={confirmarCancelamento}
        loading={cancelando}
        title="Cancelar venda"
        confirmLabel="Cancelar venda"
        message={
          <>
            Cancelar a venda <strong className="text-slate-900">#{cancelar?.id}</strong> de {cancelar?.cliente?.nome} no valor de{' '}
            <strong className="text-slate-900">{moeda(cancelar?.total)}</strong>? Os produtos voltam para o estoque.
          </>
        }
      />
    </div>
  );
}
