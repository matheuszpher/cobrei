// Adaptador de persistência (Prisma/PostgreSQL). Converte Decimal em number.
import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/prisma';
import { lojaAtual } from '../../infra/lojaAtual';

export const n = (d: Prisma.Decimal | number | null | undefined) => (d == null ? 0 : Number(d));

export const vendaInclude = {
  cliente: { select: { id: true, nome: true } },
  pagamentos: { select: { valor: true } },
} satisfies Prisma.VendaInclude;

export type VendaCompleta = Prisma.VendaGetPayload<{ include: typeof vendaInclude }>;

// Toda consulta passa por estes filtros: uma loja nunca enxerga os dados de outra.
export const daLoja = () => ({ cliente: { usuarioId: lojaAtual() } });

export const vendaRepo = {
  listar: (f: { clienteId?: number }) =>
    prisma.venda.findMany({ where: { clienteId: f.clienteId, ...daLoja() }, include: vendaInclude, orderBy: { data: 'desc' } }),
  buscar: (id: number) => prisma.venda.findFirst({ where: { id, ...daLoja() }, include: vendaInclude }),
  todas: () => prisma.venda.findMany({ where: daLoja(), include: vendaInclude }),
};

export const clienteRepo = {
  listar: (busca?: string) =>
    prisma.cliente.findMany({
      where: {
        usuarioId: lojaAtual(),
        ...(busca ? { OR: [{ nome: { contains: busca, mode: 'insensitive' as const } }, { telefone: { contains: busca } }] } : {}),
      },
      orderBy: { nome: 'asc' },
    }),
  buscar: (id: number) => prisma.cliente.findFirst({ where: { id, usuarioId: lojaAtual() } }),
  criar: (data: Omit<Prisma.ClienteCreateInput, 'usuario'>) =>
    prisma.cliente.create({ data: { ...data, usuario: { connect: { id: lojaAtual() } } } }),
  atualizar: (id: number, data: Prisma.ClienteUpdateInput) => prisma.cliente.update({ where: { id }, data }),
};

export { prisma };
