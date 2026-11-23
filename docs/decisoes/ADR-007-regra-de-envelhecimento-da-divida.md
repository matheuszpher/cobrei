# ADR-007: Regra de envelhecimento da dívida (aging)

**Status:** Aceita
**Data:** 16/11/2026
**Responsável:** Equipe

## Contexto
A função central do Cobrei é dizer ao lojista quem está devendo há mais tempo (RF06). É preciso definir de forma precisa o que significa "dever há mais tempo": a data da primeira compra, a data da última compra, a média dos vencimentos ou o vencimento mais antigo ainda não pago. A regra também define os níveis usados para destacar e priorizar as cobranças.

## Decisão
Calcular o envelhecimento por cliente, na camada de **domínio**, como função pura:

1. Considerar apenas as vendas **em aberto** (status ABERTA ou PARCIAL, isto é, com saldo maior que zero).
2. O **vencimento mais antigo em aberto** é o menor vencimento entre elas.
3. `diasAtraso = max(0, dias entre hoje e o vencimento mais antigo em aberto)`, contando dias inteiros no calendário. Se nada estiver vencido, o valor é 0.
4. O **nível** é derivado de `diasAtraso`:

| Nível | Dias de atraso |
|---|---|
| EM_DIA | 0 |
| ATENCAO | 1 a 30 |
| CRITICO | mais de 30 |

5. O **ranking** (`GET /devedores`) lista os clientes com saldo em aberto ordenados por `diasAtraso` decrescente; em caso de empate, pelo maior saldo.
6. A data de "hoje" é obtida pela porta `Relogio`, e nunca por `new Date()` dentro do domínio, para que a regra seja testável com datas fixas.
7. O painel usa as faixas de valor Em dia, 1-30 dias, 31-60 dias e 60+ dias, calculadas pela mesma função, por venda em aberto.

O pagamento parcial reduz o saldo, mas não altera o vencimento: a venda continua em atraso até ser quitada.

## Alternativas consideradas
- **Data da primeira compra em aberto:** ignora o prazo combinado; o cliente com compra recente e vencimento futuro seria tratado como atrasado.
- **Média ponderada dos vencimentos:** suaviza o atraso e esconde a venda mais antiga, que é a mais urgente de cobrar.
- **Atraso da última venda:** um cliente que volta a comprar esconderia a dívida antiga.
- **Mais níveis (por exemplo 1-7, 8-30, 31-60, 60+):** daria mais granularidade, mas complicaria a interface; as faixas do painel já oferecem esse detalhe.

## Consequências
**Positivas**
- Regra simples, explicável ao lojista e alinhada à prática de aging de contas a receber.
- Prioriza a cobrança da dívida mais antiga, que é a de maior risco.
- Função pura e `Relogio` injetado tornam a regra totalmente testável sem banco de dados.

**Negativas**
- Um cliente com uma venda muito antiga e valor pequeno pode ficar acima de um cliente com saldo alto e atraso menor; o desempate por saldo só atua em atrasos iguais.
- Os limites (30 dias) são fixos no código nesta versão, sem configuração por lojista.
