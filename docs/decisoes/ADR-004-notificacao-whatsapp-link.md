# ADR-004: Notificação por WhatsApp via link (adaptador simulado)

**Status:** Aceita
**Data:** 16/11/2026
**Responsável:** Equipe

## Contexto
A função central do sistema é cobrar os clientes que estão devendo há mais tempo (RF06 e RF07). No contexto de pequenos comércios, o WhatsApp é o canal natural de cobrança. O envio automático por provedor oficial (API do WhatsApp Business) exige conta empresarial verificada, modelos de mensagem aprovados, custo por conversa e consentimento do destinatário, o que é inviável para a demonstração.

Além disso, o lojista quer controlar o que é enviado, e a cobrança deve ser feita de forma educada, para reduzir o constrangimento.

## Decisão
Definir a porta de saída `Notificador` na camada de aplicação e implementá-la com o adaptador `WhatsAppLinkNotificador`:

- O caso de uso `GerarCobranca` calcula saldo e vencimento mais antigo do cliente e chama a porta com dados de negócio (cliente, saldo e vencimento).
- O adaptador monta a mensagem pronta e o link `https://wa.me/55<telefone>?text=<mensagem codificada>`, com o telefone normalizado para dígitos.
- O **envio é simulado**: o sistema não transmite nada; o lojista abre o link, o WhatsApp abre a conversa com a mensagem preenchida e ele envia manualmente.
- O caso de uso registra a cobrança como `Notificacao` (canal `WHATSAPP`, mensagem e data) pela porta `NotificacaoRepository`, formando o histórico e alimentando o campo `ultimaCobranca` do ranking.
- O canal é um valor do pedido (`canal: "WHATSAPP"`), o que deixa espaço para outros canais no futuro.
- Um adaptador real, como `WhatsAppBusinessNotificador`, pode ser adicionado depois e selecionado por configuração (RF09).

## Alternativas consideradas
- **API do WhatsApp Business (envio real):** entregaria a mensagem de fato, mas exige conta verificada, aprovação de modelos e custo, e traz risco de falha na apresentação.
- **SMS ou e-mail:** menor taxa de leitura no público-alvo e exigiria serviço externo; o e-mail do cliente é opcional no cadastro.
- **Chamada direta ao link dentro do controller:** seria mais rápida de escrever, mas colocaria regra de negócio (texto e dados da cobrança) no adaptador HTTP e impediria testar o caso de uso.

## Consequências
**Positivas**
- Funciona sem conta, chave de API ou rede além do próprio WhatsApp do lojista.
- O lojista revisa a mensagem antes de enviar, o que evita cobranças indevidas.
- A troca por um adaptador de envio real não altera nenhum caso de uso, evidenciando a Arquitetura Hexagonal.
- Os testes podem usar um `Notificador` falso em memória.

**Negativas**
- Nenhuma mensagem é entregue de fato pelo sistema; o histórico registra a geração da cobrança, não a confirmação de envio ou de leitura.
- O envio depende de ação manual do lojista, e não há agendamento nem cobrança em lote.
