# Cobrei

**Cobrar fiado sem constrangimento.** Sistema de vendas fiado para pequenos comércios (mercadinhos, padarias, mercearias). Substitui o caderninho de papel: registra clientes, vendas a prazo com vencimento e limite de crédito, pagamentos parciais ou totais e, principalmente, **mostra quem está devendo há mais tempo** e gera a cobrança pronta no WhatsApp.

## Funcionalidades
| ID | Funcionalidade | Escopo |
|---|---|---|
| RF01 | Login do lojista (JWT) | Implementação |
| RF02 | CRUD de clientes com limite de crédito | Implementação |
| RF03 | Produtos e estoque | Removido do escopo |
| RF04 | Venda fiado com valor, descrição, vencimento e checagem de limite | Implementação |
| RF05 | Pagamento parcial ou total por venda | Implementação |
| RF06 | Ranking de devedores pelo atraso mais antigo (Em dia / Atenção / Crítico) | Implementação |
| RF07 | Cobrança por WhatsApp com mensagem pronta e histórico | Implementação (link wa.me, envio simulado) |
| RF08 | Painel com indicadores e gráficos | Implementação |
| RF09 | Cobrança automática agendada | Somente documentação |
| RF10 | Multiusuário e multiloja | Somente documentação |

Detalhes em [`docs/requisitos`](docs/requisitos/Documento_de_Requisitos_Cobrei.md) e contrato da API em [`docs/API.md`](docs/API.md).

## Como rodar (Docker)
Requisito: Docker Desktop ligado.

```bash
docker compose up --build
```

| Serviço | Endereço |
|---|---|
| Aplicação web | http://localhost:8080 |
| API | http://localhost:3333/api (saúde em `/api/health`) |
| PostgreSQL | localhost:5433 (usuário/senha/banco: `fiado`) |

Login de demonstração: **admin@fiado.com / 123456**. Na primeira subida a API aplica a migration e popula dados de exemplo (8 clientes, vendas com atrasos variados).

Para zerar o banco: `docker compose down -v`.

### Desenvolvimento sem Docker (opcional)
```bash
docker compose up -d db
cd backend && npm install && npx prisma migrate deploy && npm run build && npm run seed && npm run dev
cd frontend && npm install && npm run dev
```

## Estilo arquitetural
Backend em **Arquitetura Hexagonal leve** (Ports and Adapters):

```
backend/src
├── domain/                 regras puras: saldo, status da venda, dias de atraso, nível, limite, mensagem
├── application/
│   ├── ports/              Notificador, Relogio
│   └── usecases/           clientes, vendas, pagamentos, devedores, cobrança, painel
├── adapters/
│   ├── http/               Express (rotas, validação Zod, JWT, erros)
│   ├── persistence/        Prisma / PostgreSQL
│   └── notificacao/        WhatsAppLinkNotificador (gera link wa.me)
└── infra/                  composição dos adaptadores
```

Decisões registradas em [`docs/decisoes`](docs/decisoes) (ADR-001 a ADR-007).

## Arquitetura (C4)
- Structurizr DSL: [`docs/c4/workspace.dsl`](docs/c4/workspace.dsl) (contexto, containers e componentes). Cole em [playground.structurizr.com](https://playground.structurizr.com) ou rode `docker run -it --rm -p 8081:8080 -v "$(pwd)/docs/c4":/usr/local/structurizr structurizr/structurizr local`.
- Mermaid (renderiza no GitHub): [`docs/c4/diagramas.md`](docs/c4/diagramas.md) com contexto, containers, componentes, modelo ER e sequência da cobrança.

## Stack
React + Vite + TypeScript + Tailwind (frontend), Node.js + Express + TypeScript + Prisma (backend), PostgreSQL 16, Docker Compose.
