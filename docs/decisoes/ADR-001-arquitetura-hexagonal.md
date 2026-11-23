# ADR-001: Adoção da Arquitetura Hexagonal

**Status:** Aceita
**Data:** 16/11/2026
**Responsável:** Equipe

## Contexto
O Cobrei controla vendas fiado de pequenos comércios. O núcleo do sistema tem regras próprias e sensíveis (saldo devedor, limite de crédito, dias de atraso, nível de atraso, pagamento limitado ao saldo) e depende de elementos externos: banco de dados, canal de cobrança (WhatsApp), relógio do sistema e a interface web.

As regras de atraso dependem da data de hoje, o que torna difícil testá-las se o domínio ler o relógio diretamente.

## Decisão
Adotar a **Arquitetura Hexagonal (Ports and Adapters)** de forma leve no backend, em três camadas:

- **domain:** regras puras, sem dependência de framework, banco ou relógio: cálculo de saldo, dias de atraso, nível (EM_DIA, ATENCAO, CRITICO) e validação de limite de crédito.
- **application:** casos de uso que orquestram o domínio e declaram as **portas**:
  - Portas de entrada: casos de uso como `Autenticar`, `RegistrarVenda`, `CancelarVenda`, `RegistrarPagamento`, `ListarDevedores`, `GerarCobranca` e `ObterDashboard`.
  - Portas de saída: `ClienteRepository`, `VendaRepository`, `PagamentoRepository`, `NotificacaoRepository`, `UsuarioRepository`, `Notificador` e `Relogio`.
- **adapters:**
  - Entrada: controllers e rotas HTTP (Express).
  - Saída: repositórios Prisma, `WhatsAppLinkNotificador` e `RelogioSistema`.

A regra de dependência é: adapters dependem de application, application depende de domain, e o domain não depende de ninguém.

## Alternativas consideradas
- **Arquitetura em camadas tradicional (controller, service, repository):** é mais simples, mas tende a misturar regras de negócio com acesso a dados e a dificultar o teste das regras de atraso.
- **Clean Architecture completa:** é muito próxima da Hexagonal; foi usada como inspiração. Optamos pela versão "leve" (sem camadas extras de apresentação e de casos de uso por interface) para manter o projeto proporcional ao tamanho do problema.

## Consequências
**Positivas**
- O domínio e os casos de uso podem ser testados sem banco de dados, com repositórios em memória e um `Relogio` fixo.
- Trocar o `WhatsAppLinkNotificador` por um envio real (API do WhatsApp Business) exige apenas um novo adaptador.
- A estrutura de pastas reflete o estilo arquitetural, o que facilita verificar a conformidade com os diagramas.

**Negativas**
- Mais interfaces e arquivos do que uma arquitetura em camadas simples.
- Exige disciplina para que o domínio e a aplicação não importem código de adaptadores (Prisma, Express).
