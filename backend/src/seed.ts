// Dados de demonstração. Idempotente: só roda se não houver usuário.
import bcrypt from 'bcryptjs';
import { prisma } from './infra/prisma';

const diasAtras = (d: number) => new Date(Date.now() - d * 86400000);

async function main() {
  if (await prisma.usuario.count()) {
    console.log('[seed] banco já populado, nada a fazer');
    return;
  }
  await prisma.usuario.create({
    data: { nome: 'Dona Maria', email: 'admin@fiado.com', senhaHash: await bcrypt.hash('123456', 10) },
  });

  const produtos = await Promise.all(
    [
      ['Arroz 5kg', 27.9, 40], ['Feijão carioca 1kg', 8.49, 60], ['Café 500g', 18.9, 35], ['Açúcar 2kg', 9.99, 50],
      ['Óleo de soja 900ml', 7.89, 45], ['Leite integral 1L', 5.49, 80], ['Pão francês (kg)', 14.9, 100],
      ['Refrigerante 2L', 9.5, 48], ['Sabão em pó 1kg', 15.9, 30], ['Botijão de gás 13kg', 115, 12],
    ].map(([nome, preco, estoque]) =>
      prisma.produto.create({ data: { nome: nome as string, preco: preco as number, estoque: estoque as number } })),
  );

  const clientes = await Promise.all(
    [
      ['Joana Ferreira', '(88) 99612-3401', 600], ['Seu Raimundo Alves', '(88) 99877-1122', 400],
      ['Carla Menezes', '(88) 99734-5566', 800], ['Antônio Pereira', '(88) 99455-7788', 300],
      ['Francisca Lima', '(88) 99321-9900', 500], ['Pedro Henrique Sousa', '(88) 99188-2233', 700],
      ['Lucinha da Padaria', '(88) 99266-4455', 1000], ['Marcos Vinícius', '(88) 99910-6677', 350],
    ].map(([nome, telefone, limiteCredito]) =>
      prisma.cliente.create({ data: { nome: nome as string, telefone: telefone as string, limiteCredito: limiteCredito as number } })),
  );

  // [cliente, dias atrás da compra, prazo em dias, itens [produto, qtd], pago (fração)]
  const vendas: [number, number, number, [number, number][], number][] = [
    [0, 95, 30, [[0, 2], [1, 3], [2, 1]], 0], [0, 40, 30, [[5, 6], [6, 1]], 0],
    [1, 70, 30, [[9, 1], [4, 2]], 0.3], [2, 20, 30, [[2, 2], [3, 1], [7, 2]], 0],
    [2, 150, 30, [[0, 1], [8, 1]], 1], [3, 50, 15, [[1, 2], [5, 4]], 0],
    [4, 10, 30, [[6, 2], [5, 6]], 0], [5, 120, 30, [[9, 1]], 0.5], [5, 25, 30, [[3, 2], [4, 3]], 0],
    [6, 60, 30, [[0, 4], [1, 6], [2, 3], [3, 2]], 1], [6, 35, 30, [[7, 6], [6, 3]], 0.4],
    [7, 5, 30, [[2, 1], [7, 1]], 0], [3, 160, 30, [[0, 1]], 1], [1, 130, 30, [[5, 10]], 1],
  ];
  for (const [ci, atras, prazo, itens, pago] of vendas) {
    const linhas = itens.map(([pi, q]) => ({ produtoId: produtos[pi].id, quantidade: q, precoUnitario: Number(produtos[pi].preco) }));
    const total = Math.round(linhas.reduce((s, l) => s + l.precoUnitario * l.quantidade, 0) * 100) / 100;
    const venda = await prisma.venda.create({
      data: { clienteId: clientes[ci].id, data: diasAtras(atras), vencimento: diasAtras(atras - prazo), total, itens: { create: linhas } },
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
