# Diagramas do Cobrei

Os mesmos diagramas do modelo [`workspace.dsl`](workspace.dsl) (Structurizr), em Mermaid para renderização direta no GitHub. Esta página inclui ainda o diagrama entidade-relacionamento e o diagrama de sequência da cobrança.

## 1. Contexto (C4 nível 1)

```mermaid
C4Context
    title Contexto do Cobrei

    Person(lojista, "Lojista", "Dono de mercadinho ou padaria. Registra vendas fiado e pagamentos, consulta devedores e cobra clientes.")
    Person_Ext(devedor, "Cliente devedor", "Freguês que compra fiado. Recebe a cobrança pelo WhatsApp.")

    System(fiado, "Cobrei", "Controla clientes, vendas fiado e pagamentos, lista devedores por tempo de atraso e gera a cobrança por WhatsApp.")
    System_Ext(whatsapp, "WhatsApp", "Abre a conversa com a mensagem pronta a partir do link wa.me.")

    Rel(lojista, fiado, "Usa", "HTTPS")
    Rel(fiado, whatsapp, "Gera link wa.me com a mensagem", "Link, envio simulado")
    Rel(lojista, whatsapp, "Abre o link e envia a mensagem")
    Rel(whatsapp, devedor, "Entrega a mensagem de cobrança")
```

## 2. Containers (C4 nível 2)

```mermaid
C4Container
    title Containers do Cobrei

    Person(lojista, "Lojista", "Usa o sistema no navegador")

    System_Boundary(fiado, "Cobrei") {
        Container(web, "Aplicação Web", "React, Vite, TypeScript, Tailwind", "Interface do lojista. http://localhost:8080")
        Container(api, "API Backend", "Node.js, Express, TypeScript, Prisma", "Regras de negócio em Arquitetura Hexagonal. http://localhost:3333/api")
        ContainerDb(db, "Banco de Dados", "PostgreSQL", "Usuários, clientes, vendas, pagamentos e notificações")
    }

    Rel(lojista, web, "Usa", "HTTPS")
    Rel(web, api, "Faz requisições", "JSON/HTTPS (REST) + JWT")
    Rel(api, db, "Lê e grava dados", "SQL via Prisma")
```

## 3. Componentes da API (C4 nível 3)

A API segue a Arquitetura Hexagonal: os adaptadores dependem da aplicação, a aplicação depende do domínio, e o domínio não depende de ninguém.

```mermaid
flowchart TB
    web["Aplicação Web<br/>(React)"]
    db[("PostgreSQL")]
    wa["WhatsApp<br/>(link wa.me)"]

    subgraph api["API Backend (Node.js + Express + Prisma)"]
        direction TB

        subgraph entrada["adapters: entrada"]
            ctrl["Controllers HTTP<br/>(Express)"]
            jwt["Middleware JWT"]
        end

        subgraph app["application"]
            uc["Casos de Uso<br/>Autenticar, RegistrarVenda, CancelarVenda,<br/>RegistrarPagamento, ListarDevedores,<br/>GerarCobranca, ObterDashboard"]
            portas["Portas<br/>ClienteRepository,<br/>VendaRepository, PagamentoRepository,<br/>NotificacaoRepository, UsuarioRepository,<br/>TokenService, Notificador, Relogio"]
        end

        subgraph dom["domain (regras puras)"]
            dominio["Saldo, dias de atraso,<br/>nível EM_DIA / ATENCAO / CRITICO,<br/>validação de limite e de pagamento"]
        end

        subgraph saida["adapters: saída"]
            repo["Repositórios Prisma"]
            notif["WhatsAppLinkNotificador"]
            rel["RelogioSistema"]
        end
    end

    web -->|"REST/JSON + JWT"| ctrl
    ctrl --> jwt
    ctrl --> uc
    uc --> dominio
    uc --> portas
    repo -. implementa .-> portas
    notif -. implementa .-> portas
    rel -. implementa .-> portas
    repo -->|SQL| db
    notif -.->|"gera link"| wa
```

## 4. Diagrama entidade-relacionamento

O saldo devedor não é armazenado: é calculado pelo domínio a partir das vendas e dos pagamentos.

```mermaid
erDiagram
    Usuario {
        int id PK
        string nome
        string email UK
        string senhaHash
    }
    Cliente {
        int id PK
        string nome
        string telefone
        string email
        string endereco
        decimal limiteCredito
        string observacao
        datetime criadoEm
    }
    Venda {
        int id PK
        int clienteId FK
        datetime data
        datetime vencimento
        decimal total
        string descricao
        string status "ABERTA, PARCIAL, QUITADA"
    }
    Pagamento {
        int id PK
        int vendaId FK
        int clienteId FK
        decimal valor
        string forma "DINHEIRO, PIX, CARTAO"
        datetime data
    }
    Notificacao {
        int id PK
        int clienteId FK
        string canal "WHATSAPP"
        string mensagem
        datetime criadaEm
    }

    Cliente ||--o{ Venda : "compra fiado"
    Venda ||--o{ Pagamento : "recebe"
    Cliente ||--o{ Pagamento : "paga"
    Cliente ||--o{ Notificacao : "é cobrado por"
```

`Usuario` (o lojista) não se relaciona com as demais entidades nesta versão, que atende a um único comércio. Com o multiusuário e multiloja (RF10), uma entidade `Loja` seria incluída e relacionada a todas elas.

## 5. Sequência: cobrança por WhatsApp

Fluxo de `POST /api/cobrancas/:clienteId` (UC06). A data de referência vem da porta `Relogio`, e o envio é simulado: o lojista abre o link e envia a mensagem.

```mermaid
sequenceDiagram
    actor L as Lojista
    participant W as Aplicação Web
    participant C as Controller HTTP
    participant U as Caso de uso GerarCobranca
    participant D as Domínio
    participant R as Repositórios (Prisma)
    participant N as Notificador (WhatsAppLinkNotificador)
    participant Z as WhatsApp

    L->>W: Clica em "Cobrar" no ranking de devedores
    W->>C: POST /api/cobrancas/:clienteId {canal: "WHATSAPP"} + JWT
    C->>C: Valida o token e a entrada
    C->>U: executar(clienteId, canal)
    U->>R: buscar cliente e vendas em aberto
    R-->>U: cliente e vendas
    U->>D: calcular saldo, vencimento mais antigo e dias de atraso (data do Relogio)
    D-->>U: saldo e diasAtraso
    alt cliente sem saldo em aberto
        U-->>C: erro de regra de negócio
        C-->>W: 409 {erro}
    else cliente com saldo
        U->>N: montar(cliente, saldo, vencimento)
        N-->>U: mensagem e link https://wa.me/55...?text=...
        U->>R: gravar Notificacao (canal, mensagem, data)
        R-->>U: notificação
        U-->>C: {notificacao, mensagem, link}
        C-->>W: 201 {notificacao, mensagem, link}
        W->>Z: abre o link em nova aba (wa.me)
        L->>Z: confere a mensagem e envia ao cliente
    end
```
