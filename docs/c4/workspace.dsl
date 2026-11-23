workspace "Cobrei: Vendas Fiado para Pequenos Comércios" "Modelo C4 do trabalho final do Cobrei" {

    !identifiers hierarchical

    model {
        lojista = person "Lojista" "Dono ou responsável por mercadinho ou padaria. Registra vendas fiado e pagamentos, consulta devedores e cobra clientes."
        devedor = person "Cliente devedor" "Freguês que compra fiado. Não usa o sistema; recebe a cobrança pelo WhatsApp." "Externo"

        whatsapp = softwareSystem "WhatsApp" "Aplicativo de mensagens. Abre a conversa com a mensagem de cobrança preenchida a partir do link wa.me." "Externo"

        fiado = softwareSystem "Cobrei" "Controla clientes, produtos, vendas fiado e pagamentos, lista os devedores por tempo de atraso e gera a cobrança por WhatsApp." {
            web = container "Aplicação Web" "Interface do lojista: clientes, produtos, vendas, pagamentos, devedores, cobranças e painel. Servida em http://localhost:8080." "React + Vite + TypeScript + Tailwind" "Browser"
            api = container "API Backend" "Regras de negócio do fiado, organizada em Arquitetura Hexagonal (domain, application, adapters). Exposta em http://localhost:3333/api." "Node.js + Express + TypeScript + Prisma" {
                controllers = component "Controllers HTTP" "Rotas Express, validação de entrada e mapeamento de erros de domínio para status HTTP (adaptador de entrada)." "Express"
                authMiddleware = component "Middleware JWT" "Valida o token Bearer em todas as rotas, exceto /auth e /health." "jsonwebtoken"
                casosDeUso = component "Casos de Uso" "Autenticar, CadastrarCliente, RegistrarVenda, CancelarVenda, RegistrarPagamento, ListarDevedores, GerarCobranca e ObterDashboard." "Application"
                portas = component "Portas" "Interfaces: ClienteRepository, ProdutoRepository, VendaRepository, PagamentoRepository, NotificacaoRepository, UsuarioRepository, TokenService, Notificador e Relogio." "Application (interfaces)"
                dominio = component "Domínio" "Regras puras: cálculo de saldo, dias de atraso, nível (EM_DIA, ATENCAO, CRITICO), validação de limite de crédito e de pagamento." "Domain (TypeScript puro)"
                repositorios = component "Repositórios Prisma" "Implementam as portas de repositório e gravam em transação." "Prisma Client"
                notificadorWhats = component "WhatsAppLinkNotificador" "Monta a mensagem de cobrança e o link wa.me. Envio simulado." "Adaptador de saída"
                relogio = component "RelogioSistema" "Fornece a data atual ao caso de uso." "Adaptador de saída"
            }
            db = container "Banco de Dados" "Armazena usuários, clientes, produtos, vendas, itens, pagamentos e notificações." "PostgreSQL" "Database"
        }

        # Relações no nível de contexto
        lojista -> fiado "Registra vendas e pagamentos, consulta devedores e gera cobranças"
        fiado -> whatsapp "Gera link wa.me com a mensagem de cobrança" "Link (envio simulado)"
        lojista -> whatsapp "Abre o link e envia a mensagem" "WhatsApp"
        whatsapp -> devedor "Entrega a mensagem de cobrança"

        # Relações no nível de container
        lojista -> fiado.web "Usa" "HTTPS"
        fiado.web -> fiado.api "Faz requisições" "JSON/HTTPS (REST) + JWT"
        fiado.api -> fiado.db "Lê e grava dados" "SQL (via Prisma)"

        # Relações no nível de componente
        fiado.web -> fiado.api.controllers "Faz requisições" "JSON/HTTPS (REST) + JWT"
        fiado.api.controllers -> fiado.api.authMiddleware "Passa por"
        fiado.api.controllers -> fiado.api.casosDeUso "Chama"
        fiado.api.casosDeUso -> fiado.api.dominio "Usa regras"
        fiado.api.casosDeUso -> fiado.api.portas "Depende de"
        fiado.api.repositorios -> fiado.api.portas "Implementa"
        fiado.api.notificadorWhats -> fiado.api.portas "Implementa Notificador"
        fiado.api.relogio -> fiado.api.portas "Implementa Relogio"
        fiado.api.repositorios -> fiado.db "Lê e grava" "SQL (Prisma)"
    }

    views {
        systemContext fiado "Contexto" {
            include *
            autolayout lr
            description "Diagrama de Contexto (C4 nível 1) do Cobrei."
        }

        container fiado "Containers" {
            include *
            exclude whatsapp
            exclude devedor
            autolayout lr
            description "Diagrama de Containers (C4 nível 2) do Cobrei."
        }

        component fiado.api "Componentes" {
            include *
            exclude fiado.web
            autolayout tb
            description "Diagrama de Componentes (C4 nível 3) da API, em Arquitetura Hexagonal."
        }

        styles {
            element "Person" {
                shape Person
                background #08427b
                color #ffffff
            }
            element "Software System" {
                background #1168bd
                color #ffffff
            }
            element "Externo" {
                background #999999
                color #ffffff
            }
            element "Container" {
                background #438dd5
                color #ffffff
            }
            element "Component" {
                background #85bbf0
                color #000000
            }
            element "Database" {
                shape Cylinder
            }
            element "Browser" {
                shape WebBrowser
            }
        }
    }
}
