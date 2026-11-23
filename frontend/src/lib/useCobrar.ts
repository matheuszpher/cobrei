import { useState } from 'react';
import { api, erroMsg } from './api';
import { CobrancaResposta, ID } from './types';
import { useToast } from '../components/Toast';

export function useCobrar(onDone?: () => void) {
  const toast = useToast();
  const [cobrando, setCobrando] = useState<ID | null>(null);

  async function cobrar(clienteId: ID, nome?: string) {
    // Abre a aba já no clique (evita bloqueio de pop-up) e redireciona depois.
    const aba = window.open('about:blank', '_blank');
    setCobrando(clienteId);
    try {
      const r = await api.post<CobrancaResposta>(`/cobrancas/${clienteId}`, { canal: 'WHATSAPP' });
      if (aba) aba.location.href = r.link;
      else window.open(r.link, '_blank', 'noopener');
      toast.sucesso('Cobrança enviada', nome ? `Mensagem para ${nome} aberta no WhatsApp.` : 'Mensagem aberta no WhatsApp.');
      onDone?.();
    } catch (e) {
      aba?.close();
      toast.erro('Não foi possível cobrar', erroMsg(e));
    } finally {
      setCobrando(null);
    }
  }

  return { cobrar, cobrando };
}
