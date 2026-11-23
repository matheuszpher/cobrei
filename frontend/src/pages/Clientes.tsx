import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Pencil, Plus, Search, Trash2, UserPlus } from 'lucide-react';
import { api, erroMsg, qs } from '../lib/api';
import { useApi } from '../lib/useApi';
import { Cliente } from '../lib/types';
import { moeda, telefone } from '../lib/format';
import { Avatar, Card, EmptyState, PageHeader, ProgressBar } from '../components/ui';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Column, Table } from '../components/Table';
import { ConfirmModal } from '../components/Modal';
import { ClienteFormModal } from '../components/ClienteFormModal';
import { useToast } from '../components/Toast';

export default function Clientes() {
  const navigate = useNavigate();
  const toast = useToast();
  const [busca, setBusca] = useState('');
  const [termo, setTermo] = useState('');
  const { data, loading, error, reload } = useApi<Cliente[]>(`/clientes${qs({ busca: termo })}`);
  const [form, setForm] = useState<{ open: boolean; cliente: Cliente | null }>({ open: false, cliente: null });
  const [excluir, setExcluir] = useState<Cliente | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTermo(busca.trim()), 300);
    return () => clearTimeout(t);
  }, [busca]);

  async function confirmarExclusao() {
    if (!excluir) return;
    setExcluindo(true);
    try {
      await api.del(`/clientes/${excluir.id}`);
      toast.sucesso('Cliente excluído', excluir.nome);
      setExcluir(null);
      reload();
    } catch (e) {
      toast.erro('Não foi possível excluir', erroMsg(e));
    } finally {
      setExcluindo(false);
    }
  }

  const columns: Column<Cliente>[] = [
    {
      key: 'nome',
      header: 'Cliente',
      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar nome={c.nome} />
          <div>
            <p className="font-medium text-slate-900">{c.nome}</p>
            <p className="text-xs text-slate-500">{c.email || telefone(c.telefone)}</p>
          </div>
        </div>
      ),
    },
    { key: 'tel', header: 'Telefone', render: (c) => telefone(c.telefone) },
    {
      key: 'limite',
      header: 'Limite usado',
      render: (c) => (
        <div className="w-40">
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>{moeda(c.saldoDevedor)}</span>
            <span>{moeda(c.limiteCredito)}</span>
          </div>
          <ProgressBar value={c.saldoDevedor} max={c.limiteCredito} />
        </div>
      ),
    },
    {
      key: 'saldo',
      header: 'Saldo devedor',
      align: 'right',
      render: (c) => <span className={`font-semibold ${c.saldoDevedor > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{moeda(c.saldoDevedor)}</span>,
    },
    {
      key: 'acoes',
      header: '',
      align: 'right',
      render: (c) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" icon={<Pencil className="h-4 w-4" />} onClick={() => setForm({ open: true, cliente: c })} aria-label="Editar" />
          <Button size="sm" variant="ghost" className="hover:!bg-rose-50 hover:!text-rose-600" icon={<Trash2 className="h-4 w-4" />} onClick={() => setExcluir(c)} aria-label="Excluir" />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Quem compra fiado com você."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setForm({ open: true, cliente: null })}>
            Novo cliente
          </Button>
        }
      />
      <div className="mb-4 max-w-sm">
        <Input placeholder="Buscar por nome ou telefone..." value={busca} onChange={(e) => setBusca(e.target.value)} icon={<Search className="h-4 w-4" />} />
      </div>

      {error ? (
        <Card>
          <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="Erro ao carregar clientes" description={error} action={<Button onClick={reload}>Tentar de novo</Button>} />
        </Card>
      ) : (
        <Table
          columns={columns}
          rows={data ?? []}
          rowKey={(c) => String(c.id)}
          loading={loading}
          onRowClick={(c) => navigate(`/clientes/${c.id}`)}
          empty={
            <EmptyState
              icon={<UserPlus className="h-6 w-6" />}
              title={termo ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}
              description={termo ? `Nada para "${termo}".` : 'Cadastre seu primeiro cliente para começar a vender fiado.'}
              action={!termo && <Button icon={<Plus className="h-4 w-4" />} onClick={() => setForm({ open: true, cliente: null })}>Cadastrar cliente</Button>}
            />
          }
        />
      )}

      <ClienteFormModal open={form.open} cliente={form.cliente} onClose={() => setForm({ open: false, cliente: null })} onSaved={reload} />
      <ConfirmModal
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onConfirm={confirmarExclusao}
        loading={excluindo}
        title="Excluir cliente"
        confirmLabel="Excluir"
        message={
          <>
            Tem certeza que deseja excluir <strong className="text-slate-900">{excluir?.nome}</strong>? Esta ação não pode ser desfeita.
            {excluir && excluir.saldoDevedor > 0 && <span className="mt-2 block text-rose-600">Este cliente ainda deve {moeda(excluir.saldoDevedor)} e não poderá ser excluído.</span>}
          </>
        }
      />
    </div>
  );
}
