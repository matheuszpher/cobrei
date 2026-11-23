import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Ban, HandCoins, Plus, Receipt } from 'lucide-react';
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
      toast.sucesso('Venda cancelada', 'O valor saiu do saldo do cliente.');
      setCancelar(null);
      reload();
    } catch (e) {
      toast.erro('Não foi possível cancelar', erroMsg(e));
    } finally {
      setCancelando(false);
    }
  }

  const columns: Column<Venda>[] = [
    {
      key: 'venda',
      header: 'Venda',
      render: (v) => (
        <div>
          <p className="font-medium text-slate-900">#{v.id}</p>
          <p className="text-xs text-slate-500">{fData(v.data)}</p>
          {v.descricao && <p className="mt-0.5 max-w-xs truncate text-xs text-slate-600" title={v.descricao}>{v.descricao}</p>}
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
            <strong className="text-slate-900">{moeda(cancelar?.total)}</strong>? O valor sai do saldo do cliente.
          </>
        }
      />
    </div>
  );
}
