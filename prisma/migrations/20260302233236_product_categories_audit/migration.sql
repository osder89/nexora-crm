-- DropIndex
DROP INDEX IF EXISTS "public"."Customer_tenantId_email_key";

-- DropIndex
DROP INDEX IF EXISTS "public"."Customer_tenantId_phone_key";

-- DropIndex
DROP INDEX IF EXISTS "public"."Product_tenantId_sku_key";

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- CreateTable
CREATE TABLE "public"."ProductCategory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductCategory_tenantId_idx" ON "public"."ProductCategory"("tenantId");

-- CreateIndex
CREATE INDEX "ProductCategory_tenantId_name_idx" ON "public"."ProductCategory"("tenantId", "name");

-- CreateIndex
CREATE INDEX "ProductCategory_tenantId_isActive_idx" ON "public"."ProductCategory"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "ProductCategory_tenantId_deletedAt_idx" ON "public"."ProductCategory"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_id_tenantId_key" ON "public"."ProductCategory"("id", "tenantId");

-- CreateIndex
CREATE INDEX "Product_tenantId_sku_idx" ON "public"."Product"("tenantId", "sku");

-- CreateIndex
CREATE INDEX "Product_tenantId_categoryId_idx" ON "public"."Product"("tenantId", "categoryId");

-- CreateIndex
CREATE INDEX "Product_tenantId_isActive_idx" ON "public"."Product"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "Product_tenantId_deletedAt_idx" ON "public"."Product"("tenantId", "deletedAt");

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_categoryId_tenantId_fkey" FOREIGN KEY ("categoryId", "tenantId") REFERENCES "public"."ProductCategory"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductCategory" ADD CONSTRAINT "ProductCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductCategory" ADD CONSTRAINT "ProductCategory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductCategory" ADD CONSTRAINT "ProductCategory_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductCategory" ADD CONSTRAINT "ProductCategory_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
