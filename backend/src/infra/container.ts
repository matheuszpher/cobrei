import { Notificador, Relogio } from '../application/ports';
import { WhatsAppLinkNotificador } from '../adapters/notificacao/WhatsAppLinkNotificador';

// Composição: aqui se escolhem os adaptadores concretos de cada porta.
export const relogio: Relogio = { agora: () => new Date() };
export const notificador: Notificador = new WhatsAppLinkNotificador();
export const NOME_LOJA = process.env.NOME_LOJA ?? 'Mercadinho Bom Preço';
export const JWT_SECRET = process.env.JWT_SECRET ?? 'segredo-local';
