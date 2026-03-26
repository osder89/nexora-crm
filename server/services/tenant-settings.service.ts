import { ApplicationError } from "@/server/base/errors/application.error";
import { prisma } from "@/server/repositories/prisma";
import { getTenantById, updateTenantSettingsRecord } from "@/server/repositories/tenant.repository";
import type { TenantActor } from "@/server/types/actor";

export async function updateTenantSettings(
  actor: TenantActor,
  input: { name: string; logoUrl: string | null; primaryColor: string | null },
) {
  return updateTenantSettingsRecord(prisma, actor.tenantId, input);
}

export async function getTenantSettingsData(tenantId: string) {
  const tenant = await getTenantById(prisma, tenantId);

  if (!tenant) {
    throw new ApplicationError("Tenant no encontrado.", {
      code: "TENANT_NOT_FOUND",
      statusCode: 404,
    });
  }

  return {
    tenant,
  };
}
