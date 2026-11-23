-- Cada conta passa a ter sua loja e seus próprios clientes.
ALTER TABLE "Usuario" ADD COLUMN "nomeLoja" TEXT NOT NULL DEFAULT 'Mercadinho Bom Preço';
ALTER TABLE "Usuario" ALTER COLUMN "nomeLoja" DROP DEFAULT;

ALTER TABLE "Cliente" ADD COLUMN "usuarioId" INTEGER;
UPDATE "Cliente" SET "usuarioId" = (SELECT "id" FROM "Usuario" ORDER BY "id" LIMIT 1);
ALTER TABLE "Cliente" ALTER COLUMN "usuarioId" SET NOT NULL;

CREATE INDEX "Cliente_usuarioId_idx" ON "Cliente"("usuarioId");
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
