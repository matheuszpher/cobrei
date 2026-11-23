// Adaptador de entrada HTTP (Express): valida a entrada e chama os casos de uso.
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../infra/prisma';
import { JWT_SECRET } from '../../infra/container';
import { comLoja } from '../../infra/lojaAtual';
import { ErroDeNegocio } from '../../domain/fiado';
import * as uc from '../../application/usecases/fiado';

export const rotas = Router();
const id = (req: Request) => Number(req.params.id);

const clienteSchema = z.object({
  nome: z.string().min(2, 'Nome muito curto'),
  telefone: z.string().min(8, 'Telefone inválido'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')).nullable(),
  endereco: z.string().optional().nullable(),
  limiteCredito: z.coerce.number().min(0),
  observacao: z.string().optional().nullable(),
});
const vendaSchema = z.object({
  clienteId: z.coerce.number().int(),
  vencimento: z.coerce.date(),
  valor: z.coerce.number().min(0.01, 'Valor deve ser de pelo menos R$ 0,01').max(99999999.99, 'Valor muito alto'),
  descricao: z.string().trim().max(200, 'Descrição muito longa').optional().nullable(),
});
const pagamentoSchema = z.object({
  vendaId: z.coerce.number().int(),
  valor: z.coerce.number().positive('Valor deve ser positivo'),
  forma: z.enum(['DINHEIRO', 'PIX', 'CARTAO']).default('DINHEIRO'),
});

rotas.get('/health', (_req, res) => { res.json({ status: 'ok' }); });

const cadastroSchema = z.object({
  nomeLoja: z.string().trim().min(2, 'Nome da loja muito curto').max(80, 'Nome da loja muito longo'),
  nome: z.string().trim().min(2, 'Nome muito curto').max(80, 'Nome muito longo'),
  email: z.string().trim().toLowerCase().email('E-mail inválido').max(254, 'E-mail muito longo'),
  senha: z.string().min(8, 'A senha precisa ter no mínimo 8 caracteres').max(72, 'A senha pode ter no máximo 72 caracteres'),
});

const sessao = (u: { id: number; nome: string; nomeLoja: string; email: string }) => ({
  token: jwt.sign({ sub: String(u.id), nome: u.nome }, JWT_SECRET, { expiresIn: '8h' }),
  usuario: { id: u.id, nome: u.nome, nomeLoja: u.nomeLoja, email: u.email },
});

rotas.post('/auth/cadastro', async (req, res) => {
  const { senha, ...dados } = cadastroSchema.parse(req.body);
  try {
    const u = await prisma.usuario.create({ data: { ...dados, senhaHash: await bcrypt.hash(senha, 10) } });
    res.status(201).json(sessao(u));
  } catch (erro) {
    if ((erro as { code?: string }).code === 'P2002') throw new ErroDeNegocio(409, 'Já existe uma conta com este e-mail');
    throw erro;
  }
});

rotas.post('/auth/login', async (req, res) => {
  const { email, senha } = z.object({ email: z.string().trim().toLowerCase(), senha: z.string() }).parse(req.body);
  const u = await prisma.usuario.findUnique({ where: { email } });
  if (!u || !(await bcrypt.compare(senha, u.senhaHash))) throw new ErroDeNegocio(401, 'E-mail ou senha inválidos');
  res.json(sessao(u));
});

// Daqui para baixo, só com token.
rotas.use((req: Request, _res: Response, next: NextFunction) => {
  const [, token] = (req.headers.authorization ?? '').split(' ');
  let usuarioId: number;
  try {
    usuarioId = Number((jwt.verify(token ?? '', JWT_SECRET) as jwt.JwtPayload).sub);
    if (!Number.isInteger(usuarioId)) throw new Error('Token sem usuário');
  } catch {
    next(new ErroDeNegocio(401, 'Sessão expirada, faça login novamente'));
    return;
  }
  comLoja(usuarioId, next);
});

rotas.get('/clientes', async (req, res) => { res.json(await uc.listarClientes(req.query.busca as string | undefined)); });
rotas.get('/clientes/:id', async (req, res) => { res.json(await uc.detalharCliente(id(req))); });
rotas.post('/clientes', async (req, res) => { res.status(201).json(await uc.criarCliente(clienteSchema.parse(req.body))); });
rotas.put('/clientes/:id', async (req, res) => { res.json(await uc.atualizarCliente(id(req), clienteSchema.partial().parse(req.body))); });
rotas.delete('/clientes/:id', async (req, res) => { await uc.excluirCliente(id(req)); res.status(204).end(); });

rotas.get('/vendas', async (req, res) => {
  res.json(await uc.listarVendas({
    status: req.query.status as string | undefined,
    clienteId: req.query.clienteId ? Number(req.query.clienteId) : undefined,
  }));
});
rotas.get('/vendas/:id', async (req, res) => { res.json(await uc.detalharVenda(id(req))); });
rotas.post('/vendas', async (req, res) => { res.status(201).json(await uc.registrarVenda(vendaSchema.parse(req.body))); });
rotas.delete('/vendas/:id', async (req, res) => { await uc.cancelarVenda(id(req)); res.status(204).end(); });

rotas.get('/pagamentos', async (req, res) => {
  res.json(await uc.listarPagamentos(req.query.clienteId ? Number(req.query.clienteId) : undefined));
});
rotas.post('/pagamentos', async (req, res) => { res.status(201).json(await uc.registrarPagamento(pagamentoSchema.parse(req.body))); });
rotas.delete('/pagamentos/:id', async (req, res) => { await uc.excluirPagamento(id(req)); res.status(204).end(); });

rotas.get('/devedores', async (_req, res) => { res.json(await uc.listarDevedores()); });
rotas.post('/cobrancas/:id', async (req, res) => { res.status(201).json(await uc.cobrarCliente(id(req))); });
rotas.get('/cobrancas', async (_req, res) => { res.json(await uc.listarCobrancas()); });
rotas.get('/dashboard', async (_req, res) => { res.json(await uc.painel()); });

export function tratarErros(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ErroDeNegocio) return res.status(err.status).json({ erro: err.message });
  if (err instanceof z.ZodError) return res.status(400).json({ erro: err.issues.map((i) => i.message).join('; ') });
  console.error(err);
  res.status(500).json({ erro: 'Erro interno' });
}
