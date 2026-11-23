# Cobrei: contrato da API

Base: `http://localhost:3333/api` (JSON). Todas as rotas, exceto `/auth/*` e `/health`, exigem `Authorization: Bearer <token>`.
Valores em reais como número (ex.: `12.5`). Datas em ISO 8601.
Erros: `{ "erro": "mensagem" }` com status 400/401/404/409.

## Auth
- `POST /auth/login` `{ email, senha }` → `{ token, usuario: { id, nome, email } }`
- Usuário de demonstração: `admin@fiado.com` / `123456`

## Clientes
- `GET /clientes?busca=` → `Cliente[]` com `saldoDevedor`
- `GET /clientes/:id` → `Cliente & { saldoDevedor, vendas: Venda[], pagamentos: Pagamento[] }`
- `POST /clientes` `{ nome, telefone, email?, endereco?, limiteCredito, observacao? }`
- `PUT /clientes/:id` (mesmo corpo, parcial) · `DELETE /clientes/:id` (409 se tiver saldo devedor)

`Cliente = { id, nome, telefone, email, endereco, limiteCredito, observacao, criadoEm, saldoDevedor }`

## Produtos
- `GET /produtos?busca=` · `POST /produtos` `{ nome, preco, estoque }` · `PUT /produtos/:id` · `DELETE /produtos/:id`

`Produto = { id, nome, preco, estoque, criadoEm }`

## Vendas (fiado)
- `GET /vendas?status=ABERTA|PARCIAL|QUITADA&clienteId=` → `Venda[]`
- `GET /vendas/:id` → `Venda`
- `POST /vendas` `{ clienteId, vencimento, itens: [{ produtoId, quantidade }] }` → `Venda` (409 se passar o limite de crédito ou faltar estoque)
- `DELETE /vendas/:id` (409 se já tiver pagamento; devolve estoque)

`Venda = { id, clienteId, cliente: { id, nome }, data, vencimento, total, valorPago, saldo, status, diasAtraso, itens: [{ id, produtoId, produto: { nome }, quantidade, precoUnitario, subtotal }] }`

## Pagamentos
- `GET /pagamentos?clienteId=` → `Pagamento[]`
- `POST /pagamentos` `{ vendaId, valor, forma: "DINHEIRO"|"PIX"|"CARTAO" }` → `Pagamento` (400 se valor > saldo da venda)
- `DELETE /pagamentos/:id`

`Pagamento = { id, vendaId, clienteId, cliente: { nome }, valor, forma, data }`

## Devedores e cobrança
- `GET /devedores` → lista ordenada do atraso mais antigo para o mais novo:
  `{ cliente: { id, nome, telefone }, saldo, diasAtraso, vencimentoMaisAntigo, vendasEmAberto, nivel: "EM_DIA"|"ATENCAO"|"CRITICO", ultimaCobranca: string|null }[]`
  Regra: `diasAtraso` = dias desde o vencimento mais antigo em aberto (0 se nada vencido). EM_DIA = 0, ATENCAO = 1 a 30, CRITICO > 30.
- `POST /cobrancas/:clienteId` `{ canal: "WHATSAPP" }` → `{ notificacao, mensagem, link }` (link `https://wa.me/55...?text=...`)
- `GET /cobrancas` → `Notificacao[]` = `{ id, clienteId, cliente: { nome }, canal, mensagem, criadaEm }`

## Painel
- `GET /dashboard` → `{ totalEmAberto, totalVencido, clientesDevendo, recebidoNoMes, vendidoNoMes, faixasAtraso: [{ faixa: "Em dia"|"1-30 dias"|"31-60 dias"|"60+ dias", valor }], ultimos6Meses: [{ mes: "2026-06", vendido, recebido }], topDevedores: Devedor[] (5) }`

## Saúde
- `GET /health` → `{ status: "ok" }`
