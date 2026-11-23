// Dados de demonstração. Idempotente: só roda se não houver usuário.
import bcrypt from 'bcryptjs';
import { prisma } from './infra/prisma';

const diasAtras = (d: number) => new Date(Date.now() - d * 86400000);

function senhaAdmin(): string {
  const senha = process.env.ADMIN_SENHA;
  if (senha) return senha;
  if (process.env.NODE_ENV === 'production') throw new Error('Defina ADMIN_SENHA em produção.');
  return '123456';
}

async function main() {
  if (await prisma.usuario.count()) {
    console.log('[seed] banco já populado, nada a fazer');
    return;
  }
  await prisma.usuario.create({
    data: { nome: 'Dona Maria', email: 'admin@fiado.com', senhaHash: await bcrypt.hash(senhaAdmin(), 10) },
  });

  const clientes = await Promise.all(
    [
      ['Joana Ferreira', '(88) 99612-3401', 600], ['Seu Raimundo Alves', '(88) 99877-1122', 400],
      ['Carla Menezes', '(88) 99734-5566', 800], ['Antônio Pereira', '(88) 99455-7788', 300],
      ['Francisca Lima', '(88) 99321-9900', 500], ['Pedro Henrique Sousa', '(88) 99188-2233', 700],
      ['Lucinha da Padaria', '(88) 99266-4455', 1000], ['Marcos Vinícius', '(88) 99910-6677', 350],
    ].map(([nome, telefone, limiteCredito]) =>
      prisma.cliente.create({ data: { nome: nome as string, telefone: telefone as string, limiteCredito: limiteCredito as number } })),
  );

  // [cliente, dias atrás da compra, prazo em dias, valor, descrição, pago (fração)]
  const vendas: [number, number, number, number, string, number][] = [
    [0, 95, 30, 100.17, 'Arroz, feijão e café', 0], [0, 40, 30, 47.84, 'Leite e pão', 0],
    [1, 70, 30, 130.78, 'Botijão de gás e óleo', 0.3], [2, 20, 30, 75.78, 'Café, açúcar e refrigerante', 0],
    [2, 150, 30, 43.8, 'Arroz e sabão em pó', 1], [3, 50, 15, 38.94, 'Feijão e leite', 0],
    [4, 10, 30, 62.74, 'Pão e leite', 0], [5, 120, 30, 115, 'Botijão de gás', 0.5], [5, 25, 30, 43.65, 'Açúcar e óleo', 0],
    [6, 60, 30, 245.22, 'Compra do mês', 1], [6, 35, 30, 101.7, 'Refrigerante e pão', 0.4],
    [7, 5, 30, 28.4, 'Café e refrigerante', 0], [3, 160, 30, 27.9, 'Arroz 5kg', 1], [1, 130, 30, 54.9, 'Leite (10 unidades)', 1],
  ];
  for (const [ci, atras, prazo, total, descricao, pago] of vendas) {
    const venda = await prisma.venda.create({
      data: { clienteId: clientes[ci].id, data: diasAtras(atras), vencimento: diasAtras(atras - prazo), total, descricao },
    });
    if (pago > 0) {
      await prisma.pagamento.create({
        data: {
          vendaId: venda.id, clienteId: clientes[ci].id, valor: Math.round(total * pago * 100) / 100,
          forma: pago === 1 ? 'PIX' : 'DINHEIRO', data: diasAtras(Math.max(atras - 20, 1)),
        },
      });
    }
  }
  await prisma.notificacao.create({
    data: { clienteId: clientes[1].id, mensagem: 'Olá, Seu! Passando para lembrar do seu saldo no fiado.', criadaEm: diasAtras(12) },
  });
  console.log('[seed] dados de demonstração criados');
}

main().finally(() => prisma.$disconnect());
