"use server";

import { hash } from "bcrypt";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireSuperAdminUser } from "@/lib/session";

export async function createTenantAction(formData: FormData) {
  await requireSuperAdminUser();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("El nombre de empresa es obligatorio.");
  }

  await prisma.tenant.create({
    data: {
      name,
      nit: optionalText(formData.get("nit")),
      phone: optionalText(formData.get("phone")),
      email: optionalText(formData.get("email"))?.toLowerCase(),
      address: optionalText(formData.get("address")),
      logoUrl: optionalText(formData.get("logoUrl")),
      primaryColor: optionalText(formData.get("primaryColor")),
      isActive: true,
    },
  });

  revalidatePath("/super/tenants");
}

export async function toggleTenantStatusAction(formData: FormData) {
  await requireSuperAdminUser();

  const tenantId = String(formData.get("tenantId") ?? "").trim();
  const nextState = String(formData.get("nextState") ?? "").trim() === "true";

  if (!tenantId) {
    throw new Error("Tenant inválido.");
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { isActive: nextState },
  });

  revalidatePath("/super/tenants");
}

export async function createTenantAdminAction(formData: FormData) {
  await requireSuperAdminUser();

  const tenantId = String(formData.get("tenantId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

  if (!tenantId || !email || !password) {
    throw new Error("Tenant, email y password son obligatorios.");
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    throw new Error("Tenant no encontrado.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("El email ya está en uso.");
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash: await hash(password, 10),
      role: Role.ADMIN_EMPRESA,
      tenantId,
      isActive: true,
    },
  });

  revalidatePath("/super/tenants");
}

function optionalText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

