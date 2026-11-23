-- Remove produtos e estoque: a venda passa a ser um lancamento com valor e descricao.
ALTER TABLE "Venda" ADD COLUMN "descricao" TEXT;

-- Preserva o historico: transforma os itens em texto, como "2x Arroz 5kg, 1x Cafe 500g".
UPDATE "Venda" v
SET "descricao" = d.texto
FROM (
  SELECT i."vendaId", string_agg(i."quantidade" || 'x ' || p."nome", ', ' ORDER BY i."id") AS texto
  FROM "ItemVenda" i
  JOIN "Produto" p ON p."id" = i."produtoId"
  GROUP BY i."vendaId"
) d
WHERE d."vendaId" = v."id";

DROP TABLE "ItemVenda";
DROP TABLE "Produto";
