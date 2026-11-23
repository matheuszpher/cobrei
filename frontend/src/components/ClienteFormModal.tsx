import { FormEvent, useEffect, useState } from 'react';
import { api, erroMsg } from '../lib/api';
import { Cliente } from '../lib/types';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input, Textarea } from './Input';
import { useToast } from './Toast';

interface Props {
  open: boolean;
  cliente: Cliente | null;
  onClose: () => void;
  onSaved: () => void;
}

const vazio = { nome: '', telefone: '', email: '', endereco: '', limiteCredito: '200', observacao: '' };

export function ClienteFormModal({ open, cliente, onClose, onSaved }: Props) {
  const toast = useToast();
  const [f, setF] = useState(vazio);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErros({});
    setF(
      cliente
        ? {
            nome: cliente.nome,
            telefone: cliente.telefone ?? '',
            email: cliente.email ?? '',
            endereco: cliente.endereco ?? '',
            limiteCredito: String(cliente.limiteCredito ?? 0),
            observacao: cliente.observacao ?? '',
          }
        : vazio,
    );
  }, [open, cliente]);

  const set = (k: keyof typeof vazio) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!f.nome.trim()) errs.nome = 'Informe o nome';
    if (f.telefone.replace(/\D/g, '').length < 10) errs.telefone = 'Telefone com DDD (ex.: 11 98765-4321)';
    const limite = Number(f.limiteCredito.replace(',', '.'));
    if (isNaN(limite) || limite < 0) errs.limiteCredito = 'Valor inválido';
    setErros(errs);
    if (Object.keys(errs).length) return;

    const body = {
      nome: f.nome.trim(),
      telefone: f.telefone.trim(),
      email: f.email.trim() || undefined,
      endereco: f.endereco.trim() || undefined,
      limiteCredito: limite,
      observacao: f.observacao.trim() || undefined,
    };
    setSalvando(true);
    try {
      if (cliente) await api.put(`/clientes/${cliente.id}`, body);
      else await api.post('/clientes', body);
      toast.sucesso(cliente ? 'Cliente atualizado' : 'Cliente cadastrado', body.nome);
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
      title={cliente ? 'Editar cliente' : 'Novo cliente'}
      description="Dados para vender fiado e cobrar pelo WhatsApp."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-cliente" loading={salvando}>Salvar</Button>
        </>
      }
    >
      <form id="form-cliente" onSubmit={salvar} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Nome" value={f.nome} onChange={set('nome')} error={erros.nome} placeholder="Maria da Silva" autoFocus />
        </div>
        <Input label="Telefone (WhatsApp)" value={f.telefone} onChange={set('telefone')} error={erros.telefone} placeholder="(11) 98765-4321" />
        <Input label="Limite de crédito (R$)" type="number" step="0.01" min="0" value={f.limiteCredito} onChange={set('limiteCredito')} error={erros.limiteCredito} />
        <Input label="E-mail (opcional)" type="email" value={f.email} onChange={set('email')} />
        <Input label="Endereço (opcional)" value={f.endereco} onChange={set('endereco')} />
        <div className="sm:col-span-2">
          <Textarea label="Observação (opcional)" value={f.observacao} onChange={set('observacao')} placeholder="Ex.: paga sempre no dia 5" />
        </div>
      </form>
    </Modal>
  );
}
