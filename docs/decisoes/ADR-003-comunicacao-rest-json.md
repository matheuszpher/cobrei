# ADR-003: Comunicação REST/JSON entre frontend e API

**Status:** Aceita
**Data:** 16/11/2026
**Responsável:** Equipe

## Contexto
O frontend (React) e o backend (Node.js) são aplicações separadas, executadas em contêineres distintos (web em `http://localhost:8080` e api em `http://localhost:3333`). É preciso definir o estilo de comunicação e um contrato estável para que as duas partes possam ser desenvolvidas em paralelo.

Os recursos do domínio são bem definidos: clientes, produtos, vendas, pagamentos, devedores, cobranças e painel.

## Decisão
Expor uma API **REST com JSON**, com base em `http://localhost:3333/api`, documentada em [`docs/API.md`](../API.md), que é o contrato entre frontend e backend:

- Recursos no plural e verbos HTTP (`GET`, `POST`, `PUT`, `DELETE`) para as operações de CRUD: `/clientes`, `/produtos`, `/vendas`, `/pagamentos`.
- Recursos de leitura derivados do domínio: `GET /devedores` e `GET /dashboard`.
- Ação de negócio modelada como criação de recurso: `POST /cobrancas/:clienteId` cria uma cobrança (notificação) e `GET /cobrancas` lista o histórico.
- Valores em reais como número, datas em ISO 8601.
- Erros no formato `{ "erro": "mensagem" }`, com status 400 (dados inválidos), 401 (não autenticado), 404 (não encontrado) e 409 (violação de regra de negócio, como limite de crédito, cliente com saldo ou venda com pagamento).
- O mapeamento dos erros de domínio para status HTTP é feito em um único ponto do adaptador HTTP.

## Alternativas consideradas
- **GraphQL:** reduziria requisições em telas como o painel, mas exigiria schema, resolvers e mais infraestrutura, sem ganho relevante para um sistema com poucos recursos.
- **RPC (tRPC ou gRPC):** o tRPC acoplaria frontend e backend em tipos compartilhados; o gRPC é inadequado para navegadores sem proxy.
- **Comunicação em tempo real (WebSocket):** não há requisito de atualização em tempo real.

## Consequências
**Positivas**
- O contrato único em `API.md` permite desenvolver frontend e backend em paralelo.
- REST/JSON é simples de testar (navegador, curl, Insomnia) e de demonstrar.
- Os status HTTP deixam explícitas as violações de regras de negócio.

**Negativas**
- Algumas telas (cliente com vendas e pagamentos, painel) agregam dados no servidor em respostas maiores, pois não há seleção de campos como no GraphQL.
- Não há versionamento da API nesta versão.
