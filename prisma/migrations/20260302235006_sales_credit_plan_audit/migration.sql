-- CreateEnum
CREATE TYPE "public"."SaleType" AS ENUM ('CONTADO', 'CREDITO');

-- CreateEnum
CREATE TYPE "public"."InstallmentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "public"."Sale" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "firstInstallmentDate" TIMESTAMP(3),
ADD COLUMN     "installmentCount" INTEGER,
ADD COLUMN     "installmentFrequencyDays" INTEGER,
ADD COLUMN     "saleType" "public"."SaleType" NOT NULL DEFAULT 'CONTADO',
ADD COLUMN     "updatedById" TEXT;

UPDATE "public"."Sale"
SET
  "createdById" = "sellerId",
  "updatedById" = "sellerId"
WHERE "sellerId" IS NOT NULL;

UPDATE "public"."Payment"
SET "updatedById" = "createdById"
WHERE "createdById" IS NOT NULL;

-- CreateTable
CREATE TABLE "public"."SaleInstallment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."InstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SaleInstallment_tenantId_dueDate_idx" ON "public"."SaleInstallment"("tenantId", "dueDate");

-- CreateIndex
CREATE INDEX "SaleInstallment_tenantId_status_idx" ON "public"."SaleInstallment"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SaleInstallment_id_tenantId_key" ON "public"."SaleInstallment"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SaleInstallment_tenantId_saleId_installmentNumber_key" ON "public"."SaleInstallment"("tenantId", "saleId", "installmentNumber");

-- CreateIndex
CREATE INDEX "Payment_tenantId_deletedAt_idx" ON "public"."Payment"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Sale_tenantId_deletedAt_idx" ON "public"."Sale"("tenantId", "deletedAt");

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaleInstallment" ADD CONSTRAINT "SaleInstallment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaleInstallment" ADD CONSTRAINT "SaleInstallment_saleId_tenantId_fkey" FOREIGN KEY ("saleId", "tenantId") REFERENCES "public"."Sale"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaleInstallment" ADD CONSTRAINT "SaleInstallment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaleInstallment" ADD CONSTRAINT "SaleInstallment_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
