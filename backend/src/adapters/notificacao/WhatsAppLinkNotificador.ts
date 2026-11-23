import { Notificador, ResultadoEnvio } from '../../application/ports';

// Adaptador simulado: monta o link wa.me com a mensagem pronta.
// O lojista abre o link e confirma o envio no próprio WhatsApp.
export class WhatsAppLinkNotificador implements Notificador {
  async enviar(telefone: string, mensagem: string): Promise<ResultadoEnvio> {
    let numero = telefone.replace(/\D/g, '');
    if (!numero.startsWith('55')) numero = '55' + numero;
    const link = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
    console.log(`[notificacao] WhatsApp para ${numero}: ${mensagem}`);
    return { link, mensagem };
  }
}
