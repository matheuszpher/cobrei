# ADR-006: Execução local com Docker Compose

**Status:** Aceita
**Data:** 16/11/2026
**Responsável:** Equipe

## Contexto
O sistema tem três partes que precisam rodar juntas: banco de dados, API e interface web. O trabalho será avaliado e apresentado em máquinas diferentes, e é desejável que qualquer pessoa consiga executá-lo sem instalar PostgreSQL, Node.js ou configurar variáveis manualmente.

## Decisão
Usar **Docker Compose** com três serviços:

| Serviço | Descrição | Porta |
|---|---|---|
| `db` | PostgreSQL com volume nomeado para persistência | 5432 (interna) |
| `api` | Node.js + Express + TypeScript + Prisma; aplica as migrações e a carga inicial ao subir, depois que o banco estiver saudável (`healthcheck` e `depends_on`) | 3333 |
| `web` | Build do React com Vite servido por Nginx, que consome a API | 8080 |

- Todo o ambiente sobe com `docker compose up --build`.
- As configurações (URL do banco, segredo do JWT e URL da API) ficam em variáveis de ambiente do `docker-compose.yml`, com valores padrão para desenvolvimento.
- O endpoint `GET /health` é usado como verificação de saúde da API.
- Acesso: web em http://localhost:8080 e api em http://localhost:3333.

## Alternativas consideradas
- **Instalação manual (Node.js e PostgreSQL locais):** exige que cada pessoa configure o ambiente e gera diferenças entre máquinas.
- **Um único contêiner para API e web:** reduziria serviços, mas misturaria responsabilidades e esconderia a separação entre frontend e backend que aparece no diagrama de containers.
- **Hospedagem em nuvem:** acrescentaria custo e configuração sem relação com os objetivos do trabalho.

## Consequências
**Positivas**
- Ambiente reproduzível e demonstração com um único comando.
- Os três serviços correspondem diretamente aos containers do diagrama C4.
- O banco persiste entre execuções por meio do volume.

**Negativas**
- Exige Docker instalado e o primeiro build é demorado.
- A configuração é voltada a desenvolvimento e demonstração; segredos padrão não devem ser usados em produção.
