import { FormEvent, useEffect, useState } from 'react';
import { Banknote, CreditCard, QrCode } from 'lucide-react';
import { api, erroMsg } from '../lib/api';
import { FormaPagamento, Venda } from '../lib/types';
import { moeda } from '../lib/format';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { useToast } from './Toast';

const formas: { valor: FormaPagamento; label: string; icon: typeof Banknote }[] = [
  { valor: 'DINHEIRO', label: 'Dinheiro', icon: Banknote },
  { valor: 'PIX', label: 'Pix', icon: QrCode },
  { valor: 'CARTAO', label: 'Cartão', icon: CreditCard },
];

export function PagamentoModal({ venda, onClose, onSaved }: { venda: Venda | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [valor, setValor] = useState('');
  const [forma, setForma] = useState<FormaPagamento>('PIX');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (venda) {
      setValor(venda.saldo.toFixed(2));
      setForma('PIX');
      setErro('');
    }
  }, [venda]);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!venda) return;
    const v = Number(valor.replace(',', '.'));
    if (!v || v <= 0) return setErro('Informe um valor maior que zero');
    if (v > venda.saldo + 0.001) return setErro(`O valor não pode passar do saldo (${moeda(venda.saldo)})`);
    setSalvando(true);
    try {
      await api.post('/pagamentos', { vendaId: venda.id, valor: v, forma });
      toast.sucesso('Pagamento registrado', `${moeda(v)} de ${venda.cliente?.nome ?? 'cliente'}`);
      onSaved();
      onClose();
    } catch (err) {
      toast.erro('Não foi possível registrar', erroMsg(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      open={!!venda}
      onClose={onClose}
      title="Registrar pagamento"
      description={venda ? `Venda #${venda.id} · ${venda.cliente?.nome ?? ''}` : ''}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-pagamento" loading={salvando}>Registrar</Button>
        </>
      }
    >
      {venda && (
        <form id="form-pagamento" onSubmit={salvar} className="space-y-5">
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-creme p-4 text-center text-xs">
            <div>
              <p className="text-slate-500">Total</p>
              <p className="mt-0.5 font-semibold text-slate-900">{moeda(venda.total)}</p>
            </div>
            <div>
              <p className="text-slate-500">Pago</p>
              <p className="mt-0.5 font-semibold text-emerald-600">{moeda(venda.valorPago)}</p>
            </div>
            <div>
              <p className="text-slate-500">Saldo</p>
              <p className="mt-0.5 font-semibold text-rose-600">{moeda(venda.saldo)}</p>
            </div>
          </div>
          <Input label="Valor recebido (R$)" type="number" step="0.01" min="0.01" value={valor} onChange={(e) => setValor(e.target.value)} error={erro} autoFocus />
          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Forma de pagamento</span>
            <div className="grid grid-cols-3 gap-2">
              {formas.map(({ valor: v, label, icon: Icon }) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setForma(v)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                    forma === v ? 'border-floresta bg-floresta text-creme' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
