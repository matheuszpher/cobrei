import { AsyncLocalStorage } from 'node:async_hooks';

// Guarda o dono dos dados durante cada requisição autenticada.
const contexto = new AsyncLocalStorage<number>();

export const comLoja = <T>(usuarioId: number, trabalho: () => T): T => contexto.run(usuarioId, trabalho);

export function lojaAtual(): number {
  const usuarioId = contexto.getStore();
  if (usuarioId === undefined) throw new Error('Operação sem loja autenticada');
  return usuarioId;
}
