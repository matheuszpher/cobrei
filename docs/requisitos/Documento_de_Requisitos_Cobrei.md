# Documento de Requisitos: Cobrei

| Campo | Informação |
|---|---|
| Projeto | Cobrei: controle de vendas fiado para pequenos comércios |
| Equipe | Equipe |
| Estilo arquitetural | Hexagonal (Ports and Adapters) |
| Versão | 1.0 |
| Data | 16/11/2026 |

## 1. Introdução

### 1.1 Propósito
Este documento descreve os requisitos do Cobrei, sistema desenvolvido como trabalho final da disciplina. Ele define o problema, os objetivos, os atores, as funcionalidades, os requisitos não funcionais, as regras de negócio e o escopo da implementação parcial. O contrato da API está em [`../API.md`](../API.md) e as decisões arquiteturais em [`../decisoes`](../decisoes).

### 1.2 Visão geral do sistema
O Cobrei substitui o caderninho de papel de mercadinhos e padarias. O lojista cadastra clientes (com limite de crédito), registra vendas fiado com valor, descrição opcional e data de vencimento e anota os pagamentos, parciais ou totais. A função central do sistema é mostrar quais clientes estão devendo há mais tempo, ordenados pelos dias de atraso do vencimento mais antigo em aberto, e gerar a cobrança por WhatsApp com uma mensagem pronta. Um painel resume os indicadores da carteira de fiado.

### 1.3 Escopo
O escopo completo está documentado neste documento. A implementação parcial cobre os requisitos RF01 a RF08, de forma a demonstrar o fluxo principal (vender fiado, receber, identificar devedores e cobrar) e a adoção real da Arquitetura Hexagonal. Os requisitos RF09 e RF10 ficam apenas documentados.

## 2. Problema

O fiado é uma prática comum no pequeno comércio de bairro: o cliente leva a mercadoria e paga depois. Hoje o controle costuma ser feito em um caderninho de papel, o que gera problemas recorrentes:

- **Esquecimento:** vendas e pagamentos são anotados de forma incompleta ou se perdem; o lojista não sabe ao certo quanto tem a receber.
- **Falta de visão de prazo:** não há como saber, sem somar à mão, quem deve há mais tempo nem quem já passou do limite razoável de dívida.
- **Constrangimento de cobrar:** cobrar pessoalmente é desconfortável, e por isso a cobrança é adiada até a dívida crescer.
- **Risco de inadimplência:** sem limite de crédito por cliente, a dívida de um único cliente pode comprometer o caixa do comércio.

## 3. Objetivos

- Substituir o caderninho por um registro confiável de clientes, vendas fiado e pagamentos.
- Impedir que um cliente ultrapasse o limite de crédito combinado.
- Mostrar, em uma única lista, quem está devendo há mais tempo e em que nível de atraso.
- Reduzir o constrangimento da cobrança, oferecendo uma mensagem educada pronta para envio por WhatsApp.
- Dar ao lojista uma visão rápida da carteira (total em aberto, total vencido, recebido e vendido no mês).

## 4. Stakeholders e personas

| Ator | Descrição |
|---|---|
| Lojista (usuário do sistema) | Dono ou responsável por mercadinho ou padaria. Registra vendas e pagamentos, consulta devedores e dispara cobranças. Perfil com pouca familiaridade com sistemas; precisa de telas simples. |
| Cliente devedor (parte interessada) | Freguês que compra fiado. Não acessa o sistema; recebe a cobrança por WhatsApp. |
| WhatsApp (externo) | Canal de mensagens usado para a cobrança. Na implementação, o envio é simulado e o sistema apenas gera o link `wa.me`. |
| Equipe de desenvolvimento | Responsável pela documentação, implementação e demonstração do sistema. |

**Persona principal: Dona Marlene, 52 anos, dona de uma padaria de bairro.** Vende fiado para cerca de 40 fregueses, anota tudo em um caderno e tem vergonha de cobrar pessoalmente. Quer saber, ao abrir o comércio, quem está devendo há mais tempo e mandar uma mensagem simpática com poucos cliques.

## 5. Escopo

| ID | Requisito | Prioridade | Escopo |
|---|---|---|---|
| RF01 | Autenticação do lojista (JWT) | Essencial | Implementação |
| RF02 | Cadastro de clientes com limite de crédito | Essencial | Implementação |
| RF03 | Produtos e estoque | Removido | Fora do escopo |
| RF04 | Registro e cancelamento de vendas fiado | Essencial | Implementação |
| RF05 | Registro de pagamentos parciais ou totais | Essencial | Implementação |
| RF06 | Ranking de devedores por tempo de atraso | Essencial | Implementação |
| RF07 | Cobrança por WhatsApp com histórico | Essencial | Implementação (envio simulado) |
| RF08 | Painel com indicadores | Desejável | Implementação |
| RF09 | Envio automático agendado de cobranças | Opcional | Somente documentação |
| RF10 | Multiusuário e multiloja | Opcional | Somente documentação |

## 6. Requisitos funcionais

### RF01: Autenticação do lojista (JWT)
**Ator:** Lojista
**Prioridade:** Essencial | **Escopo:** Implementação
**Descrição:** O lojista deve fazer login com e-mail e senha e receber um token JWT, usado nas demais requisições. O sistema atende a um único usuário lojista; há um usuário de demonstração criado na carga inicial do banco.
**Critérios de aceitação:**
- Credenciais inválidas retornam erro 401.
- A senha é armazenada com hash (bcrypt), nunca em texto puro.
- Todas as rotas, exceto login e verificação de saúde, recusam requisições sem token válido.

### RF02: Cadastro de clientes com limite de crédito
**Ator:** Lojista
**Prioridade:** Essencial | **Escopo:** Implementação
**Descrição:** O lojista deve cadastrar, editar, buscar, consultar e excluir clientes, informando nome, telefone, limite de crédito e, opcionalmente, e-mail, endereço e observação. A consulta de um cliente exibe o saldo devedor, as vendas e os pagamentos.
**Critérios de aceitação:**
- Nome, telefone e limite de crédito são obrigatórios; o limite não pode ser negativo.
- A listagem aceita busca por nome e exibe o saldo devedor de cada cliente.
- Um cliente com saldo devedor não pode ser excluído (RN04).

### RF03: Produtos e estoque (removido)
Requisito retirado do escopo: o foco do Cobrei é registrar e cobrar o fiado, não controlar mercadorias. A venda passou a guardar valor e descrição opcional.

### RF04: Registro e cancelamento de vendas fiado
**Ator:** Lojista
**Prioridade:** Essencial | **Escopo:** Implementação
**Descrição:** O lojista deve registrar uma venda fiado para um cliente, informando o valor, a data de vencimento e, se quiser, uma descrição do que foi comprado. A venda pode ser consultada, filtrada por status (ABERTA, PARCIAL, QUITADA) e por cliente, e cancelada.
**Critérios de aceitação:**
- A venda é recusada com erro 409 se o saldo devedor do cliente somado ao total da venda ultrapassar o limite de crédito (RN01).
- O valor deve ser maior que zero.
- Toda venda nasce com status ABERTA.
- O cancelamento só é permitido se a venda não tiver pagamento (RN05).

### RF05: Registro de pagamentos parciais ou totais
**Ator:** Lojista
**Prioridade:** Essencial | **Escopo:** Implementação
**Descrição:** O lojista deve registrar o pagamento de uma venda, informando o valor e a forma (DINHEIRO, PIX ou CARTAO). O pagamento pode ser parcial ou total, e pode ser removido em caso de lançamento errado.
**Critérios de aceitação:**
- O valor deve ser maior que zero e não pode exceder o saldo da venda; caso contrário, erro 400 (RN03).
- A venda passa para PARCIAL após um pagamento parcial e para QUITADA quando o saldo chega a zero.
- Ao remover um pagamento, o status da venda é recalculado.

### RF06: Ranking de devedores por tempo de atraso
**Ator:** Lojista
**Prioridade:** Essencial | **Escopo:** Implementação
**Descrição:** O sistema deve listar os clientes com saldo em aberto, ordenados do atraso mais antigo para o mais novo, exibindo saldo, dias de atraso, vencimento mais antigo, quantidade de vendas em aberto, nível e data da última cobrança. Esta é a função central do sistema.
**Critérios de aceitação:**
- Os dias de atraso são contados a partir do vencimento mais antigo em aberto (RN02, ADR-007).
- O nível é EM_DIA (0 dia), ATENCAO (1 a 30 dias) ou CRITICO (mais de 30 dias).
- Clientes sem saldo em aberto não aparecem na lista.
- A data de referência vem da porta `Relogio`, o que permite testar a regra com datas fixas.

### RF07: Cobrança por WhatsApp com histórico
**Ator:** Lojista
**Prioridade:** Essencial | **Escopo:** Implementação (envio simulado)
**Descrição:** A partir do ranking, o lojista pode gerar a cobrança de um cliente. O sistema monta uma mensagem pronta (nome, saldo e vencimento mais antigo) e o link `https://wa.me/55<telefone>?text=<mensagem>`; o lojista abre o link e envia a mensagem. O envio é simulado: nada é transmitido pelo sistema, mas a cobrança é registrada no histórico (notificação).
**Critérios de aceitação:**
- A resposta traz a notificação registrada, a mensagem e o link.
- A cobrança de cliente sem saldo em aberto é recusada.
- O histórico de cobranças pode ser listado e a data da última cobrança aparece no ranking.
- O canal é uma porta (`Notificador`), com `WhatsAppLinkNotificador` como adaptador (ADR-004).

### RF08: Painel com indicadores
**Ator:** Lojista
**Prioridade:** Desejável | **Escopo:** Implementação
**Descrição:** O painel exibe total em aberto, total vencido, quantidade de clientes devendo, recebido e vendido no mês, valor por faixa de atraso (Em dia, 1-30, 31-60 e 60+ dias), vendido e recebido nos últimos seis meses e os cinco maiores devedores.
**Critérios de aceitação:**
- Os valores do painel são consistentes com o ranking de devedores e com as vendas e os pagamentos registrados.

### RF09: Envio automático agendado de cobranças
**Ator:** Sistema, Lojista
**Prioridade:** Opcional | **Escopo:** Somente documentação
**Descrição:** O lojista configuraria regras de cobrança automática (por exemplo, lembrete 3 dias antes do vencimento e nova mensagem a cada 7 dias de atraso). Um agendador executaria as regras e enviaria as mensagens por um provedor oficial de WhatsApp, como a API do WhatsApp Business. Exigiria um novo adaptador da porta `Notificador`, um agendador e o consentimento do cliente para receber mensagens. Não será implementado nesta versão.

### RF10: Multiusuário e multiloja
**Ator:** Lojista, Administrador
**Prioridade:** Opcional | **Escopo:** Somente documentação
**Descrição:** O sistema passaria a atender vários comércios, cada um com seus clientes e vendas isolados, e vários usuários por comércio (dono e funcionário) com perfis de acesso diferentes. Exigiria a entidade Loja, a inclusão da loja no token e em todas as consultas e o cadastro de usuários. Não será implementado nesta versão, que atende a um único lojista.

## 7. Requisitos não funcionais

| ID | Requisito | Descrição |
|---|---|---|
| RNF01 | Arquitetura | O backend segue a Arquitetura Hexagonal (ADR-001), com as camadas domain, application e adapters. |
| RNF02 | Independência do domínio | As regras de negócio (saldo, dias de atraso, nível e limite) ficam em funções puras no domínio, sem dependência de framework, banco ou relógio do sistema. |
| RNF03 | Testabilidade | Domínio e casos de uso devem ser testáveis sem banco de dados, usando repositórios em memória e um `Relogio` fixo. |
| RNF04 | Segurança | Autenticação por JWT, senhas com bcrypt, validação das entradas e mensagens de erro sem detalhes internos. |
| RNF05 | Usabilidade | Interface simples e responsiva, adequada a usuários sem experiência técnica, com a lista de devedores a poucos cliques. |
| RNF06 | Desempenho | As listagens e o painel devem responder em até 2 segundos para até 500 clientes e 10 mil vendas. |
| RNF07 | Portabilidade | O sistema sobe com um único comando (`docker compose up`), com três serviços: db, api e web. |
| RNF08 | Integridade | Valores monetários usam tipo decimal; o saldo é sempre derivado de vendas e pagamentos, nunca armazenado. |
| RNF09 | Contrato | A API é REST/JSON conforme `docs/API.md`, com erros no formato `{ "erro": "mensagem" }` (ADR-003). |
| RNF10 | Privacidade | Dados pessoais (nome e telefone dos clientes) ficam apenas no banco do lojista, e nada é enviado a terceiros pelo sistema. |

## 8. Regras de negócio

| ID | Regra |
|---|---|
| RN01 | **Limite de crédito.** Uma venda só é aceita se `saldo devedor atual + total da venda <= limite de crédito` do cliente. Caso contrário, é recusada (409). |
| RN02 | **Nível de atraso.** Os dias de atraso de um cliente são os dias entre a data de hoje e o vencimento mais antigo entre suas vendas em aberto (ABERTA ou PARCIAL), ou 0 se nenhuma estiver vencida. EM_DIA = 0; ATENCAO = 1 a 30; CRITICO = mais de 30. |
| RN03 | **Pagamento não excede o saldo.** O valor de um pagamento deve ser maior que zero e menor ou igual ao saldo da venda (total menos o já pago). |
| RN04 | **Cliente com saldo não é excluído.** A exclusão é recusada (409) enquanto houver saldo devedor. |
| RN05 | **Cancelamento de venda.** Só é possível cancelar uma venda sem pagamentos. Com pagamento, a operação é recusada (409). |
| RN06 | **Status da venda.** ABERTA: nenhum pagamento. PARCIAL: pagamento menor que o total. QUITADA: pagamento igual ao total. |
| RN07 | **Removida.** Regra de preço congelado, que deixou de existir com a retirada de produtos. |
| RN08 | **Removida.** Regra de estoque, fora do escopo do Cobrei. |
| RN09 | **Vencimento.** O vencimento deve ser informado e não pode ser anterior à data da venda. |
| RN10 | **Cobrança.** Só é possível gerar cobrança para cliente com saldo em aberto; cada geração fica registrada no histórico, e o envio é sempre feito pelo lojista. |

## 9. Casos de uso principais

| ID | Caso de uso | Requisitos |
|---|---|---|
| UC01 | Autenticar | RF01 |
| UC02 | Cadastrar cliente | RF02 |
| UC03 | Registrar venda fiado | RF04 |
| UC04 | Registrar pagamento | RF05 |
| UC05 | Consultar devedores | RF06 |
| UC06 | Gerar cobrança por WhatsApp | RF07 |
| UC07 | Cancelar venda | RF04 |
| UC08 | Consultar painel | RF08 |

### UC03: Registrar venda fiado
**Ator:** Lojista. **Pré-condição:** lojista autenticado, cliente cadastrado.
**Fluxo principal:**
1. O lojista escolhe o cliente e informa o valor, o vencimento e, se quiser, uma descrição.
2. O sistema calcula o saldo devedor do cliente e valida o limite de crédito (RN01).
3. O sistema grava a venda com status ABERTA.
4. O sistema devolve a venda criada.

**Fluxos alternativos:**
- 2a. O limite seria ultrapassado: o sistema retorna erro 409 e nada é gravado.

### UC04: Registrar pagamento
**Ator:** Lojista. **Pré-condição:** existe venda com saldo em aberto.
**Fluxo principal:**
1. O lojista seleciona a venda, informa o valor e a forma de pagamento.
2. O sistema calcula o saldo da venda.
3. O sistema valida que o valor é positivo e não excede o saldo (RN03).
4. O sistema grava o pagamento e atualiza o status da venda para PARCIAL ou QUITADA (RN06).

**Fluxo alternativo:** 3a. O valor excede o saldo: erro 400, nada é gravado.

### UC05: Consultar devedores
**Ator:** Lojista. **Pré-condição:** lojista autenticado.
**Fluxo principal:**
1. O lojista abre a tela de devedores.
2. O sistema obtém a data atual pela porta `Relogio` e carrega as vendas em aberto.
3. Para cada cliente, o sistema calcula saldo, vencimento mais antigo, dias de atraso e nível (RN02).
4. O sistema ordena do maior atraso para o menor e devolve a lista, com a data da última cobrança.

**Fluxo alternativo:** 3a. Cliente sem vendas em aberto não entra na lista.

### UC06: Gerar cobrança por WhatsApp
**Ator:** Lojista. **Pré-condição:** o cliente possui saldo em aberto.
**Fluxo principal:**
1. O lojista clica em "Cobrar" na linha do cliente no ranking.
2. O sistema calcula saldo e vencimento mais antigo do cliente.
3. O sistema monta a mensagem e o link `wa.me` pela porta `Notificador` (adaptador `WhatsAppLinkNotificador`).
4. O sistema registra a notificação no histórico.
5. O sistema devolve notificação, mensagem e link, e o frontend abre o link em nova aba.
6. O lojista confere a mensagem no WhatsApp e envia.

**Fluxo alternativo:** 2a. Cliente sem saldo: erro 409 e nenhuma notificação é registrada.

### UC07: Cancelar venda
**Ator:** Lojista. **Pré-condição:** a venda existe.
**Fluxo principal:**
1. O lojista solicita o cancelamento da venda.
2. O sistema verifica que não há pagamentos (RN05).
3. O sistema remove a venda.

**Fluxo alternativo:** 2a. Há pagamento: erro 409; o lojista deve remover os pagamentos antes, se for o caso.

## 10. Glossário

| Termo | Definição |
|---|---|
| Fiado | Venda cujo pagamento é feito depois, em data combinada. |
| Saldo devedor | Soma dos totais das vendas do cliente menos a soma dos pagamentos. |
| Limite de crédito | Valor máximo de saldo devedor que o lojista aceita de um cliente. |
| Vencimento | Data combinada para pagamento de uma venda fiado. |
| Dias de atraso | Dias desde o vencimento mais antigo em aberto. |
| Aging (envelhecimento) | Classificação da dívida por tempo de atraso, em níveis. |
| Nível | EM_DIA, ATENCAO ou CRITICO, conforme os dias de atraso. |
| Venda em aberto | Venda com status ABERTA ou PARCIAL, isto é, com saldo a receber. |
| Cobrança | Mensagem de lembrete de pagamento gerada pelo sistema para um cliente. |
| Notificação | Registro no histórico de uma cobrança gerada (canal, mensagem e data). |
| wa.me | Formato de link do WhatsApp que abre uma conversa com mensagem preenchida. |
| Porta | Interface declarada pela camada de aplicação para o que é externo (repositório, notificador, relógio). |
| Adaptador | Implementação de uma porta com uma tecnologia concreta (Prisma, Express, link do WhatsApp). |
| JWT | JSON Web Token, usado para autenticar as requisições da API. |
