# ADR-005: PostgreSQL e Prisma

**Status:** Aceita
**Data:** 16/11/2026
**Responsável:** Equipe

## Contexto
O sistema trata dinheiro, estoque e relações bem definidas entre clientes, produtos, vendas, itens, pagamentos e notificações. Operações como registrar uma venda (gravar venda e itens, baixar estoque) e cancelá-la (devolver estoque) precisam ser atômicas. Também são necessárias consultas agregadas (saldo por cliente, vendas em aberto, painel por mês).

## Decisão
Usar **PostgreSQL** como banco de dados relacional e **Prisma** como ORM e ferramenta de migrações:

- O modelo de dados é: Usuario, Cliente, Produto, Venda, ItemVenda, Pagamento e Notificacao (ver diagrama ER em [`docs/c4/diagramas.md`](../c4/diagramas.md)).
- O schema fica em `schema.prisma`, e as migrações e a carga inicial (usuário de demonstração, clientes, produtos e vendas de exemplo) são aplicadas na subida da API.
- Valores monetários usam tipo decimal, e nunca ponto flutuante.
- O **saldo não é armazenado**: é derivado das vendas e dos pagamentos pelo domínio, o que evita inconsistências. O status da venda é gravado para permitir filtros simples e é recalculado a cada pagamento.
- O Prisma fica restrito aos adaptadores de persistência, que implementam as portas de repositório da camada de aplicação. Operações compostas usam transações (`$transaction`).
- O preço unitário é copiado para o `ItemVenda` no momento da venda.

## Alternativas consideradas
- **SQLite:** mais simples de executar, mas menos representativo de um ambiente real e com limitações de tipos e concorrência.
- **MongoDB:** os dados são fortemente relacionais e exigem transações entre coleções, o que favorece o modelo relacional.
- **SQL puro com `pg` ou Knex:** daria mais controle sobre as consultas, mas exigiria mais código de mapeamento e de migrações; o Prisma entrega tipos TypeScript gerados a partir do schema.

## Consequências
**Positivas**
- Integridade referencial e transações garantem a consistência de venda, itens e estoque.
- Tipos gerados pelo Prisma reduzem erros entre o banco e o código.
- Migrações versionadas tornam o ambiente reproduzível.

**Negativas**
- O Prisma gera código e exige uma etapa de `prisma generate` no build.
- Calcular o saldo a cada consulta tem custo de agregação, aceitável para o volume esperado (RNF06). Se necessário, o saldo pode ser materializado no futuro.
- Existe o risco de vazar tipos do Prisma para as camadas internas; por isso os repositórios devolvem entidades de domínio.
