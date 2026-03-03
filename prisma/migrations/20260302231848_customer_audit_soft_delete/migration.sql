-- AlterTable
ALTER TABLE "public"."Customer" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "firstName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lastName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "nit" TEXT,
ADD COLUMN     "updatedById" TEXT;

ALTER TABLE "public"."Customer" DROP CONSTRAINT IF EXISTS "Customer_tenantId_phone_key";
ALTER TABLE "public"."Customer" DROP CONSTRAINT IF EXISTS "Customer_tenantId_email_key";

UPDATE "public"."Customer"
SET
  "firstName" = COALESCE(NULLIF(split_part(trim("name"), ' ', 1), ''), "name"),
  "lastName" = COALESCE(NULLIF(regexp_replace(trim("name"), '^\S+\s*', ''), ''), '')
WHERE "name" IS NOT NULL;

-- CreateIndex
CREATE INDEX "Customer_tenantId_isActive_idx" ON "public"."Customer"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "Customer_tenantId_deletedAt_idx" ON "public"."Customer"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Customer_tenantId_phone_idx" ON "public"."Customer"("tenantId", "phone");

-- CreateIndex
CREATE INDEX "Customer_tenantId_email_idx" ON "public"."Customer"("tenantId", "email");

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
