import { FormEvent, useEffect, useState } from 'react';
import { AlertTriangle, PackagePlus, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api, erroMsg, qs } from '../lib/api';
import { useApi } from '../lib/useApi';
import { Produto } from '../lib/types';
import { moeda } from '../lib/format';
import { Card, EmptyState, PageHeader } from '../components/ui';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Column, Table } from '../components/Table';
import { ConfirmModal, Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { useToast } from '../components/Toast';

function ProdutoModal({ open, produto, onClose, onSaved }: { open: boolean; produto: Produto | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [estoque, setEstoque] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErros({});
    setNome(produto?.nome ?? '');
    setPreco(produto ? String(produto.preco) : '');
    setEstoque(produto ? String(produto.estoque) : '0');
  }, [open, produto]);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const p = Number(preco.replace(',', '.'));
    const est = Number(estoque);
    const errs: Record<string, string> = {};
    if (!nome.trim()) errs.nome = 'Informe o nome';
    if (isNaN(p) || p <= 0) errs.preco = 'Preço deve ser maior que zero';
    if (!Number.isInteger(est) || est < 0) errs.estoque = 'Estoque inválido';
    setErros(errs);
    if (Object.keys(errs).length) return;
    setSalvando(true);
    try {
      const body = { nome: nome.trim(), preco: p, estoque: est };
      if (produto) await api.put(`/produtos/${produto.id}`, body);
      else await api.post('/produtos', body);
      toast.sucesso(produto ? 'Produto atualizado' : 'Produto cadastrado', body.nome);
      onSaved();
      onClose();
    } catch (err) {
      toast.erro('Não foi possível salvar', erroMsg(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={produto ? 'Editar produto' : 'Novo produto'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-produto" loading={salvando}>Salvar</Button>
        </>
      }
    >
      <form id="form-produto" onSubmit={salvar} className="space-y-4">
        <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} error={erros.nome} placeholder="Pão francês (kg)" autoFocus />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Preço (R$)" type="number" step="0.01" min="0" value={preco} onChange={(e) => setPreco(e.target.value)} error={erros.preco} />
          <Input label="Estoque" type="number" step="1" min="0" value={estoque} onChange={(e) => setEstoque(e.target.value)} error={erros.estoque} />
        </div>
      </form>
    </Modal>
  );
}

export default function Produtos() {
  const toast = useToast();
  const [busca, setBusca] = useState('');
  const [termo, setTermo] = useState('');
  const { data, loading, error, reload } = useApi<Produto[]>(`/produtos${qs({ busca: termo })}`);
  const [form, setForm] = useState<{ open: boolean; produto: Produto | null }>({ open: false, produto: null });
  const [excluir, setExcluir] = useState<Produto | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTermo(busca.trim()), 300);
    return () => clearTimeout(t);
  }, [busca]);

  async function confirmarExclusao() {
    if (!excluir) return;
    setExcluindo(true);
    try {
      await api.del(`/produtos/${excluir.id}`);
      toast.sucesso('Produto excluído', excluir.nome);
      setExcluir(null);
      reload();
    } catch (e) {
      toast.erro('Não foi possível excluir', erroMsg(e));
    } finally {
      setExcluindo(false);
    }
  }

  const columns: Column<Produto>[] = [
    { key: 'nome', header: 'Produto', render: (p) => <span className="font-medium text-slate-900">{p.nome}</span> },
    { key: 'preco', header: 'Preço', align: 'right', render: (p) => <span className="font-semibold">{moeda(p.preco)}</span> },
    {
      key: 'estoque',
      header: 'Estoque',
      align: 'center',
      render: (p) => <Badge tone={p.estoque <= 0 ? 'red' : p.estoque < 10 ? 'amber' : 'green'}>{p.estoque <= 0 ? 'Sem estoque' : `${p.estoque} un.`}</Badge>,
    },
    {
      key: 'acoes',
      header: '',
      align: 'right',
      render: (p) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" icon={<Pencil className="h-4 w-4" />} onClick={() => setForm({ open: true, produto: p })} aria-label="Editar" />
          <Button size="sm" variant="ghost" className="hover:!bg-rose-50 hover:!text-rose-600" icon={<Trash2 className="h-4 w-4" />} onClick={() => setExcluir(p)} aria-label="Excluir" />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Produtos"
        subtitle="O que você vende no fiado."
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setForm({ open: true, produto: null })}>Novo produto</Button>}
      />
      <div className="mb-4 max-w-sm">
        <Input placeholder="Buscar produto..." value={busca} onChange={(e) => setBusca(e.target.value)} icon={<Search className="h-4 w-4" />} />
      </div>
      {error ? (
        <Card>
          <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="Erro ao carregar produtos" description={error} action={<Button onClick={reload}>Tentar de novo</Button>} />
        </Card>
      ) : (
        <Table
          columns={columns}
          rows={data ?? []}
          rowKey={(p) => String(p.id)}
          loading={loading}
          empty={
            <EmptyState
              icon={<PackagePlus className="h-6 w-6" />}
              title={termo ? 'Nenhum produto encontrado' : 'Nenhum produto ainda'}
              description={termo ? `Nada para "${termo}".` : 'Cadastre os produtos para montar as vendas fiado.'}
              action={!termo && <Button icon={<Plus className="h-4 w-4" />} onClick={() => setForm({ open: true, produto: null })}>Cadastrar produto</Button>}
            />
          }
        />
      )}
      <ProdutoModal open={form.open} produto={form.produto} onClose={() => setForm({ open: false, produto: null })} onSaved={reload} />
      <ConfirmModal
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onConfirm={confirmarExclusao}
        loading={excluindo}
        title="Excluir produto"
        confirmLabel="Excluir"
        message={
          <>
            Tem certeza que deseja excluir <strong className="text-slate-900">{excluir?.nome}</strong>? Esta ação não pode ser desfeita.
          </>
        }
      />
    </div>
  );
}
