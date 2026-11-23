import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { api, erroMsg } from '../lib/api';
import { Cliente, ID, Produto } from '../lib/types';
import { hojeMais, moeda } from '../lib/format';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input, Select } from './Input';
import { useToast } from './Toast';
import { ProgressBar } from './ui';

interface Item { produtoId: ID; quantidade: number }

export function NovaVendaModal({ open, onClose, onSaved, clienteInicial }: { open: boolean; onClose: () => void; onSaved: () => void; clienteInicial?: ID }) {
  const toast = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [vencimento, setVencimento] = useState(hojeMais(30));
  const [itens, setItens] = useState<Item[]>([]);
  const [produtoSel, setProdutoSel] = useState('');
  const [qtd, setQtd] = useState('1');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setClienteId(clienteInicial !== undefined ? String(clienteInicial) : '');
    setVencimento(hojeMais(30));
    setItens([]);
    setProdutoSel('');
    setQtd('1');
    setCarregando(true);
    Promise.all([api.get<Cliente[]>('/clientes'), api.get<Produto[]>('/produtos')])
      .then(([c, p]) => {
        setClientes(c);
        setProdutos(p);
      })
      .catch((e) => toast.erro('Erro ao carregar dados', erroMsg(e)))
      .finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, clienteInicial]);

  const prodMap = useMemo(() => new Map(produtos.map((p) => [String(p.id), p])), [produtos]);
  const cliente = clientes.find((c) => String(c.id) === clienteId);
  const total = itens.reduce((a, i) => a + (prodMap.get(String(i.produtoId))?.preco ?? 0) * i.quantidade, 0);
  const disponivel = cliente ? cliente.limiteCredito - cliente.saldoDevedor : 0;
  const passaLimite = !!cliente && total > disponivel + 0.001;

  function adicionar() {
    const q = Math.max(1, Math.floor(Number(qtd) || 1));
    if (!produtoSel) return;
    setItens((l) => {
      const ex = l.find((i) => String(i.produtoId) === produtoSel);
      if (ex) return l.map((i) => (String(i.produtoId) === produtoSel ? { ...i, quantidade: i.quantidade + q } : i));
      const p = prodMap.get(produtoSel);
      return p ? [...l, { produtoId: p.id, quantidade: q }] : l;
    });
    setProdutoSel('');
    setQtd('1');
  }

  const alterar = (id: ID, delta: number) =>
    setItens((l) => l.map((i) => (i.produtoId === id ? { ...i, quantidade: Math.max(1, i.quantidade + delta) } : i)));
  const remover = (id: ID) => setItens((l) => l.filter((i) => i.produtoId !== id));

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!clienteId) return toast.erro('Escolha o cliente');
    if (!itens.length) return toast.erro('Adicione pelo menos um item');
    setSalvando(true);
    try {
      await api.post('/vendas', {
        clienteId: cliente ? cliente.id : clienteId,
        vencimento: new Date(`${vencimento}T12:00:00`).toISOString(),
        itens: itens.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
      });
      toast.sucesso('Venda fiado registrada', `${moeda(total)} para ${cliente?.nome ?? 'cliente'}`);
      onSaved();
      onClose();
    } catch (err) {
      toast.erro('Não foi possível registrar a venda', erroMsg(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Nova venda fiado"
      description="Escolha o cliente, adicione os produtos e defina o vencimento."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-venda" loading={salvando} disabled={!itens.length || !clienteId}>
            Registrar {itens.length > 0 && `· ${moeda(total)}`}
          </Button>
        </>
      }
    >
      <form id="form-venda" onSubmit={salvar} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Select label="Cliente" value={clienteId} onChange={(e) => setClienteId(e.target.value)} disabled={carregando}>
              <option value="">{carregando ? 'Carregando...' : 'Selecione o cliente'}</option>
              {clientes.map((c) => (
                <option key={String(c.id)} value={String(c.id)}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </div>
          <Input label="Vencimento" type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} required />
        </div>

        {cliente && (
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="mb-2 flex justify-between text-xs text-slate-500">
              <span>
                Limite usado: <strong className="text-slate-700">{moeda(cliente.saldoDevedor + total)}</strong> de {moeda(cliente.limiteCredito)}
              </span>
              <span>Disponível: {moeda(Math.max(0, disponivel))}</span>
            </div>
            <ProgressBar value={cliente.saldoDevedor + total} max={cliente.limiteCredito} />
            {passaLimite && <p className="mt-2 text-xs font-medium text-rose-600">Esta venda passa do limite de crédito do cliente.</p>}
          </div>
        )}

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Adicionar produto</span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={produtoSel}
              onChange={(e) => setProdutoSel(e.target.value)}
              className="w-full flex-1 rounded-xl border border-borda bg-white px-3.5 py-2.5 text-sm focus:border-floresta focus:outline-none focus:ring-4 focus:ring-limao/25"
            >
              <option value="">Selecione um produto</option>
              {produtos.map((p) => (
                <option key={String(p.id)} value={String(p.id)} disabled={p.estoque <= 0}>
                  {p.nome} · {moeda(p.preco)} {p.estoque <= 0 ? '(sem estoque)' : `(${p.estoque} em estoque)`}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={qtd}
              onChange={(e) => setQtd(e.target.value)}
              className="w-full rounded-xl border border-borda px-3.5 py-2.5 text-sm focus:border-floresta focus:outline-none focus:ring-4 focus:ring-limao/25 sm:w-24"
              aria-label="Quantidade"
            />
            <Button type="button" variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={adicionar} disabled={!produtoSel}>
              Adicionar
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-borda">
          {itens.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-slate-400">
              <ShoppingCart className="h-8 w-8 text-slate-300" />
              Nenhum item ainda
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {itens.map((i) => {
                const p = prodMap.get(String(i.produtoId));
                return (
                  <li key={String(i.produtoId)} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-800">{p?.nome}</p>
                      <p className="text-xs text-slate-500">{moeda(p?.preco ?? 0)} cada</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => alterar(i.produtoId, -1)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100" aria-label="Diminuir">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">{i.quantidade}</span>
                      <button type="button" onClick={() => alterar(i.produtoId, 1)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100" aria-label="Aumentar">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="w-24 text-right font-semibold text-slate-900">{moeda((p?.preco ?? 0) * i.quantidade)}</span>
                    <button type="button" onClick={() => remover(i.produtoId)} className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remover">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
            <span className="text-sm font-medium text-slate-600">Total</span>
            <span className="font-serif text-2xl font-light text-floresta">{moeda(total)}</span>
          </div>
        </div>
      </form>
    </Modal>
  );
}
