// Adaptador de persistência (Prisma/PostgreSQL). Converte Decimal em number.
import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/prisma';

export const n = (d: Prisma.Decimal | number | null | undefined) => (d == null ? 0 : Number(d));

export const vendaInclude = {
  cliente: { select: { id: true, nome: true } },
  pagamentos: { select: { valor: true } },
} satisfies Prisma.VendaInclude;

export type VendaCompleta = Prisma.VendaGetPayload<{ include: typeof vendaInclude }>;

export const vendaRepo = {
  listar: (f: { clienteId?: number }) =>
    prisma.venda.findMany({ where: { clienteId: f.clienteId }, include: vendaInclude, orderBy: { data: 'desc' } }),
  buscar: (id: number) => prisma.venda.findUnique({ where: { id }, include: vendaInclude }),
  todas: () => prisma.venda.findMany({ include: vendaInclude }),
};

export const clienteRepo = {
  listar: (busca?: string) =>
    prisma.cliente.findMany({
      where: busca
        ? { OR: [{ nome: { contains: busca, mode: 'insensitive' } }, { telefone: { contains: busca } }] }
        : undefined,
      orderBy: { nome: 'asc' },
    }),
  buscar: (id: number) => prisma.cliente.findUnique({ where: { id } }),
  criar: (data: Prisma.ClienteCreateInput) => prisma.cliente.create({ data }),
  atualizar: (id: number, data: Prisma.ClienteUpdateInput) => prisma.cliente.update({ where: { id }, data }),
};

export { prisma };
