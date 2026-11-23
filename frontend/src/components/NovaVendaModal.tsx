import { FormEvent, useEffect, useState } from 'react';
import { api, erroMsg } from '../lib/api';
import { Cliente, ID } from '../lib/types';
import { hojeMais, moeda } from '../lib/format';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input, Select } from './Input';
import { useToast } from './Toast';
import { ProgressBar } from './ui';

export function NovaVendaModal({ open, onClose, onSaved, clienteInicial }: { open: boolean; onClose: () => void; onSaved: () => void; clienteInicial?: ID }) {
  const toast = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [vencimento, setVencimento] = useState(hojeMais(30));
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setClienteId(clienteInicial !== undefined ? String(clienteInicial) : '');
    setVencimento(hojeMais(30));
    setValor('');
    setDescricao('');
    setCarregando(true);
    api.get<Cliente[]>('/clientes')
      .then(setClientes)
      .catch((e) => toast.erro('Erro ao carregar clientes', erroMsg(e)))
      .finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, clienteInicial]);

  const cliente = clientes.find((c) => String(c.id) === clienteId);
  const total = Math.round((Number(valor) || 0) * 100) / 100;
  const disponivel = cliente ? cliente.limiteCredito - cliente.saldoDevedor : 0;
  const passaLimite = !!cliente && total > disponivel + 0.001;

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!clienteId) return toast.erro('Escolha o cliente');
    if (total <= 0) return toast.erro('Informe o valor');
    setSalvando(true);
    try {
      await api.post('/vendas', {
        clienteId: cliente ? cliente.id : clienteId,
        vencimento: new Date(`${vencimento}T12:00:00`).toISOString(),
        valor: total,
        descricao: descricao.trim() || null,
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
      title="Nova venda fiado"
      description="Anote quem comprou, quanto ficou devendo e quando vai pagar."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-venda" loading={salvando} disabled={total <= 0 || !clienteId}>
            Registrar {total > 0 && `· ${moeda(total)}`}
          </Button>
        </>
      }
    >
      <form id="form-venda" onSubmit={salvar} className="space-y-4">
        <Select label="Cliente" value={clienteId} onChange={(e) => setClienteId(e.target.value)} disabled={carregando}>
          <option value="">{carregando ? 'Carregando...' : 'Selecione o cliente'}</option>
          {clientes.map((c) => (
            <option key={String(c.id)} value={String(c.id)}>
              {c.nome}
            </option>
          ))}
        </Select>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Valor (R$)" type="number" inputMode="decimal" min="0.01" max="99999999.99" step="0.01" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} required />
          <Input label="Vencimento" type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} required />
        </div>

        <Input label="Descrição (opcional)" maxLength={200} placeholder="Ex.: pão, leite e café" value={descricao} onChange={(e) => setDescricao(e.target.value)} />

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
      </form>
    </Modal>
  );
}
