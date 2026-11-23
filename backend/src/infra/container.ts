import { Notificador, Relogio } from '../application/ports';
import { WhatsAppLinkNotificador } from '../adapters/notificacao/WhatsAppLinkNotificador';

// Composição: aqui se escolhem os adaptadores concretos de cada porta.
export const relogio: Relogio = { agora: () => new Date() };
export const notificador: Notificador = new WhatsAppLinkNotificador();

function segredoJwt(): string {
  const segredo = process.env.JWT_SECRET;
  if (segredo) return segredo;
  if (process.env.NODE_ENV === 'production') throw new Error('Defina JWT_SECRET em produção.');
  return 'segredo-local';
}

export const JWT_SECRET = segredoJwt();
