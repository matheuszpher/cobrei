import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, MessageCircle, PartyPopper } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { useCobrar } from '../lib/useCobrar';
import { Devedor, Nivel } from '../lib/types';
import { data as fData, moeda, relativo, telefone } from '../lib/format';
import { Avatar, Card, EmptyState, PageHeader } from '../components/ui';
import { Button } from '../components/Button';
import { NivelBadge } from '../components/Badge';
import { Column, Table } from '../components/Table';

const filtros: { valor: Nivel | 'TODOS'; label: string }[] = [
  { valor: 'TODOS', label: 'Todos' },
  { valor: 'CRITICO', label: 'Crítico' },
  { valor: 'ATENCAO', label: 'Atenção' },
  { valor: 'EM_DIA', label: 'Em dia' },
];

export default function Devedores() {
  const { data, loading, error, reload } = useApi<Devedor[]>('/devedores');
  const { cobrar, cobrando } = useCobrar(reload);
  const [nivel, setNivel] = useState<Nivel | 'TODOS'>('TODOS');

  const lista = useMemo(() => {
    const l = data ?? [];
    return nivel === 'TODOS' ? l : l.filter((d) => d.nivel === nivel);
  }, [data, nivel]);

  const contagem = (n: Nivel | 'TODOS') => (n === 'TODOS' ? data?.length ?? 0 : (data ?? []).filter((d) => d.nivel === n).length);
  const totalLista = lista.reduce((a, d) => a + d.saldo, 0);

  const columns: Column<Devedor>[] = [
    {
      key: 'cliente',
      header: 'Cliente',
      render: (d) => (
        <div className="flex items-center gap-3">
          <Avatar nome={d.cliente.nome} />
          <div>
            <Link to={`/clientes/${d.cliente.id}`} className="font-medium text-slate-900 hover:text-emerald-700">
              {d.cliente.nome}
            </Link>
            <p className="text-xs text-slate-500">{telefone(d.cliente.telefone)}</p>
          </div>
        </div>
      ),
    },
    { key: 'nivel', header: 'Nível', render: (d) => <NivelBadge nivel={d.nivel} /> },
    {
      key: 'atraso',
      header: 'Atraso',
      render: (d) =>
        d.diasAtraso > 0 ? (
          <div>
            <span className={`whitespace-nowrap font-semibold ${d.nivel === 'CRITICO' ? 'text-rose-600' : 'text-amber-600'}`}>{d.diasAtraso} dias</span>
            <p className="whitespace-nowrap text-xs text-slate-500">desde {fData(d.vencimentoMaisAntigo)}</p>
          </div>
        ) : (
          <span className="text-slate-400">Em dia</span>
        ),
    },
    {
      key: 'saldo',
      header: 'Saldo',
      align: 'right',
      render: (d) => (
        <div className="whitespace-nowrap">
          <span className="font-semibold text-slate-900">{moeda(d.saldo)}</span>
          <p className="text-xs text-slate-500">
            {d.vendasEmAberto} {d.vendasEmAberto === 1 ? 'venda aberta' : 'vendas abertas'}
          </p>
        </div>
      ),
    },
    { key: 'ultima', header: 'Últ. cobrança', render: (d) => <span className="whitespace-nowrap text-slate-500">{relativo(d.ultimaCobranca)}</span> },
    {
      key: 'acao',
      header: '',
      align: 'right',
      render: (d) => (
        <Button size="sm" variant="whatsapp" icon={<MessageCircle className="h-4 w-4" />} loading={cobrando === d.cliente.id} onClick={() => cobrar(d.cliente.id, d.cliente.nome)}>
          Cobrar no WhatsApp
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Devedores" subtitle="Quem deve, ordenado pelo atraso mais antigo. Cobre com um clique." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap gap-1 rounded-full border border-borda bg-white p-1">
          {filtros.map((f) => (
            <button
              key={f.valor}
              onClick={() => setNivel(f.valor)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${nivel === f.valor ? 'bg-floresta text-creme' : 'text-oliva hover:text-floresta'}`}
            >
              {f.label}
              <span className="ml-1.5 rounded-full bg-limao/30 px-1.5 text-xs text-current">{contagem(f.valor)}</span>
            </button>
          ))}
        </div>
        {!loading && lista.length > 0 && (
          <p className="text-sm text-slate-500">
            Total na lista: <strong className="text-slate-900">{moeda(totalLista)}</strong>
          </p>
        )}
      </div>

      {error ? (
        <Card>
          <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="Erro ao carregar devedores" description={error} action={<Button onClick={reload}>Tentar de novo</Button>} />
        </Card>
      ) : (
        <Table
          columns={columns}
          rows={lista}
          rowKey={(d) => String(d.cliente.id)}
          loading={loading}
          empty={
            <EmptyState
              icon={<PartyPopper className="h-6 w-6" />}
              title={nivel === 'TODOS' ? 'Ninguém devendo' : 'Nenhum cliente neste nível'}
              description={nivel === 'TODOS' ? 'Quando houver vendas fiado em aberto, elas aparecem aqui.' : 'Experimente outro filtro.'}
            />
          }
        />
      )}
    </div>
  );
}
