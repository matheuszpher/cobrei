// Casos de uso do fiado: clientes, vendas, pagamentos, devedores, cobrança e painel.
import { prisma, vendaRepo, clienteRepo, produtoRepo, n, VendaCompleta, vendaInclude } from '../../adapters/persistence/repositorios';
import { arred, cabeNoLimite, diasDeAtraso, ErroDeNegocio, faixaDeAtraso, mensagemDeCobranca, nivelDeAtraso, statusDaVenda } from '../../domain/fiado';
import { relogio, notificador, NOME_LOJA } from '../../infra/container';

export function mapVenda(v: VendaCompleta) {
  const total = n(v.total);
  const valorPago = arred(v.pagamentos.reduce((s, p) => s + n(p.valor), 0));
  const saldo = arred(total - valorPago);
  const status = statusDaVenda(total, valorPago);
  return {
    id: v.id, clienteId: v.clienteId, cliente: v.cliente, data: v.data, vencimento: v.vencimento,
    total, valorPago, saldo, status,
    diasAtraso: status === 'QUITADA' ? 0 : diasDeAtraso(v.vencimento, relogio.agora()),
    itens: v.itens.map((i) => ({
      id: i.id, produtoId: i.produtoId, produto: i.produto, quantidade: i.quantidade,
      precoUnitario: n(i.precoUnitario), subtotal: arred(n(i.precoUnitario) * i.quantidade),
    })),
  };
}

async function saldoDoCliente(clienteId: number) {
  const vendas = (await vendaRepo.listar({ clienteId })).map(mapVenda);
  return arred(vendas.reduce((s, v) => s + v.saldo, 0));
}

// ---------- Clientes ----------
export async function listarClientes(busca?: string) {
  const clientes = await clienteRepo.listar(busca);
  const vendas = (await vendaRepo.todas()).map(mapVenda);
  return clientes.map((c) => ({
    ...c, limiteCredito: n(c.limiteCredito),
    saldoDevedor: arred(vendas.filter((v) => v.clienteId === c.id).reduce((s, v) => s + v.saldo, 0)),
  }));
}

export async function detalharCliente(id: number) {
  const c = await clienteRepo.buscar(id);
  if (!c) throw new ErroDeNegocio(404, 'Cliente não encontrado');
  const vendas = (await vendaRepo.listar({ clienteId: id })).map(mapVenda);
  const pagamentos = await listarPagamentos(id);
  return {
    ...c, limiteCredito: n(c.limiteCredito),
    saldoDevedor: arred(vendas.reduce((s, v) => s + v.saldo, 0)), vendas, pagamentos,
  };
}

export async function criarCliente(d: any) {
  const c = await clienteRepo.criar(d);
  return { ...c, limiteCredito: n(c.limiteCredito), saldoDevedor: 0 };
}

export async function atualizarCliente(id: number, d: any) {
  if (!(await clienteRepo.buscar(id))) throw new ErroDeNegocio(404, 'Cliente não encontrado');
  const c = await clienteRepo.atualizar(id, d);
  return { ...c, limiteCredito: n(c.limiteCredito), saldoDevedor: await saldoDoCliente(id) };
}

export async function excluirCliente(id: number) {
  if (!(await clienteRepo.buscar(id))) throw new ErroDeNegocio(404, 'Cliente não encontrado');
  if ((await saldoDoCliente(id)) > 0) throw new ErroDeNegocio(409, 'Cliente com saldo devedor não pode ser excluído');
  await prisma.$transaction([
    prisma.pagamento.deleteMany({ where: { clienteId: id } }),
    prisma.venda.deleteMany({ where: { clienteId: id } }),
    prisma.cliente.delete({ where: { id } }),
  ]);
}

// ---------- Produtos ----------
const mapProd = (p: any) => ({ ...p, preco: n(p.preco) });
export const listarProdutos = async (busca?: string) => (await produtoRepo.listar(busca)).map(mapProd);
export const criarProduto = async (d: any) => mapProd(await produtoRepo.criar(d));
export async function atualizarProduto(id: number, d: any) {
  if (!(await produtoRepo.buscar(id))) throw new ErroDeNegocio(404, 'Produto não encontrado');
  return mapProd(await produtoRepo.atualizar(id, d));
}
export async function excluirProduto(id: number) {
  if (!(await produtoRepo.buscar(id))) throw new ErroDeNegocio(404, 'Produto não encontrado');
  if (await prisma.itemVenda.count({ where: { produtoId: id } })) {
    throw new ErroDeNegocio(409, 'Produto já usado em vendas não pode ser excluído');
  }
  await produtoRepo.excluir(id);
}

// ---------- Vendas ----------
export async function listarVendas(f: { status?: string; clienteId?: number }) {
  const vendas = (await vendaRepo.listar({ clienteId: f.clienteId })).map(mapVenda);
  return f.status ? vendas.filter((v) => v.status === f.status) : vendas;
}

export async function detalharVenda(id: number) {
  const v = await vendaRepo.buscar(id);
  if (!v) throw new ErroDeNegocio(404, 'Venda não encontrada');
  return mapVenda(v);
}

export async function registrarVenda(dados: { clienteId: number; vencimento: Date; itens: { produtoId: number; quantidade: number }[] }) {
  const cliente = await clienteRepo.buscar(dados.clienteId);
  if (!cliente) throw new ErroDeNegocio(404, 'Cliente não encontrado');
  if (!dados.itens.length) throw new ErroDeNegocio(400, 'A venda precisa de pelo menos um item');

  const itens: { produtoId: number; quantidade: number; precoUnitario: number }[] = [];
  for (const it of dados.itens) {
    const p = await produtoRepo.buscar(it.produtoId);
    if (!p) throw new ErroDeNegocio(404, `Produto ${it.produtoId} não encontrado`);
    if (p.estoque < it.quantidade) throw new ErroDeNegocio(409, `Estoque insuficiente de ${p.nome} (disponível: ${p.estoque})`);
    itens.push({ produtoId: p.id, quantidade: it.quantidade, precoUnitario: n(p.preco) });
  }
  const total = arred(itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0));
  const saldo = await saldoDoCliente(cliente.id);
  const limite = n(cliente.limiteCredito);
  if (!cabeNoLimite(saldo, total, limite)) {
    throw new ErroDeNegocio(409, `Limite de crédito excedido: saldo R$ ${saldo.toFixed(2)} + compra R$ ${total.toFixed(2)} passa do limite de R$ ${limite.toFixed(2)}`);
  }

  const venda = await prisma.$transaction(async (tx) => {
    for (const i of itens) {
      await tx.produto.update({ where: { id: i.produtoId }, data: { estoque: { decrement: i.quantidade } } });
    }
    return tx.venda.create({
      data: { clienteId: cliente.id, vencimento: dados.vencimento, total, itens: { create: itens } },
      include: vendaInclude,
    });
  });
  return mapVenda(venda);
}

export async function cancelarVenda(id: number) {
  const v = await vendaRepo.buscar(id);
  if (!v) throw new ErroDeNegocio(404, 'Venda não encontrada');
  if (v.pagamentos.length) throw new ErroDeNegocio(409, 'Venda com pagamento registrado não pode ser cancelada');
  await prisma.$transaction(async (tx) => {
    for (const i of v.itens) {
      await tx.produto.update({ where: { id: i.produtoId }, data: { estoque: { increment: i.quantidade } } });
    }
    await tx.venda.delete({ where: { id } });
  });
}

// ---------- Pagamentos ----------
const mapPag = (p: any) => ({ id: p.id, vendaId: p.vendaId, clienteId: p.clienteId, cliente: p.cliente, valor: n(p.valor), forma: p.forma, data: p.data });

export async function listarPagamentos(clienteId?: number) {
  const ps = await prisma.pagamento.findMany({
    where: { clienteId }, include: { cliente: { select: { nome: true } } }, orderBy: { data: 'desc' },
  });
  return ps.map(mapPag);
}

export async function registrarPagamento(d: { vendaId: number; valor: number; forma: 'DINHEIRO' | 'PIX' | 'CARTAO' }) {
  const v = await vendaRepo.buscar(d.vendaId);
  if (!v) throw new ErroDeNegocio(404, 'Venda não encontrada');
  const { saldo } = mapVenda(v);
  if (d.valor <= 0) throw new ErroDeNegocio(400, 'Valor deve ser maior que zero');
  if (arred(d.valor) > saldo) throw new ErroDeNegocio(400, `Valor maior que o saldo da venda (R$ ${saldo.toFixed(2)})`);
  const p = await prisma.pagamento.create({
    data: { vendaId: v.id, clienteId: v.clienteId, valor: arred(d.valor), forma: d.forma },
    include: { cliente: { select: { nome: true } } },
  });
  return mapPag(p);
}

export async function excluirPagamento(id: number) {
  if (!(await prisma.pagamento.findUnique({ where: { id } }))) throw new ErroDeNegocio(404, 'Pagamento não encontrado');
  await prisma.pagamento.delete({ where: { id } });
}

// ---------- Devedores e cobrança ----------
export async function listarDevedores() {
  const vendas = (await vendaRepo.todas()).map(mapVenda).filter((v) => v.saldo > 0);
  const clientes = await prisma.cliente.findMany({
    include: { notificacoes: { orderBy: { criadaEm: 'desc' }, take: 1 } },
  });
  const lista = clientes.flatMap((c) => {
    const abertas = vendas.filter((v) => v.clienteId === c.id);
    if (!abertas.length) return [];
    const maisAntiga = abertas.reduce((a, b) => (a.vencimento < b.vencimento ? a : b));
    const dias = diasDeAtraso(maisAntiga.vencimento, relogio.agora());
    return [{
      cliente: { id: c.id, nome: c.nome, telefone: c.telefone },
      saldo: arred(abertas.reduce((s, v) => s + v.saldo, 0)),
      diasAtraso: dias,
      vencimentoMaisAntigo: maisAntiga.vencimento,
      vendasEmAberto: abertas.length,
      nivel: nivelDeAtraso(dias),
      ultimaCobranca: c.notificacoes[0]?.criadaEm ?? null,
    }];
  });
  // Mais antigo primeiro; empate no atraso desempata pelo maior saldo (ADR-007).
  return lista.sort((a, b) => b.diasAtraso - a.diasAtraso || b.saldo - a.saldo || +a.vencimentoMaisAntigo - +b.vencimentoMaisAntigo);
}

export async function cobrarCliente(clienteId: number) {
  const devedor = (await listarDevedores()).find((d) => d.cliente.id === clienteId);
  if (!devedor) throw new ErroDeNegocio(409, 'Cliente não tem saldo devedor');
  const texto = mensagemDeCobranca(devedor.cliente.nome, devedor.saldo, devedor.diasAtraso, NOME_LOJA);
  const envio = await notificador.enviar(devedor.cliente.telefone, texto);
  const notificacao = await prisma.notificacao.create({
    data: { clienteId, canal: 'WHATSAPP', mensagem: envio.mensagem },
    include: { cliente: { select: { nome: true } } },
  });
  return { notificacao, mensagem: envio.mensagem, link: envio.link };
}

export const listarCobrancas = () =>
  prisma.notificacao.findMany({ include: { cliente: { select: { nome: true } } }, orderBy: { criadaEm: 'desc' } });

// ---------- Painel ----------
export async function painel() {
  const hoje = relogio.agora();
  const vendas = (await vendaRepo.todas()).map(mapVenda);
  const pagamentos = await prisma.pagamento.findMany();
  const devedores = await listarDevedores();
  const chaveMes = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  const faixas = ['Em dia', '1-30 dias', '31-60 dias', '60+ dias'].map((faixa) => ({ faixa, valor: 0 }));
  for (const v of vendas.filter((x) => x.saldo > 0)) {
    const f = faixas.find((x) => x.faixa === faixaDeAtraso(v.diasAtraso))!;
    f.valor = arred(f.valor + v.saldo);
  }
  const ultimos6Meses = Array.from({ length: 6 }, (_, i) => {
    const mes = chaveMes(new Date(hoje.getFullYear(), hoje.getMonth() - 5 + i, 1));
    return {
      mes,
      vendido: arred(vendas.filter((v) => chaveMes(v.data) === mes).reduce((s, v) => s + v.total, 0)),
      recebido: arred(pagamentos.filter((p) => chaveMes(p.data) === mes).reduce((s, p) => s + n(p.valor), 0)),
    };
  });
  return {
    totalEmAberto: arred(vendas.reduce((s, v) => s + v.saldo, 0)),
    totalVencido: arred(vendas.filter((v) => v.diasAtraso > 0).reduce((s, v) => s + v.saldo, 0)),
    clientesDevendo: devedores.length,
    recebidoNoMes: ultimos6Meses[5].recebido,
    vendidoNoMes: ultimos6Meses[5].vendido,
    faixasAtraso: faixas,
    ultimos6Meses,
    topDevedores: devedores.slice(0, 5),
  };
}
