"use server";

import { hash } from "bcrypt";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requiredText } from "@/lib/actions/helpers";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";

export async function createVendorAction(formData: FormData) {
  const user = await requireTenantUser([Role.ADMIN_EMPRESA]);

  const email = requiredText(formData, "email", "Email requerido.").toLowerCase();
  const password = requiredText(formData, "password", "Password requerido.");

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    throw new Error("El email ya esta en uso.");
  }

  await prisma.user.create({
    data: {
      tenantId: user.tenantId,
      email,
      passwordHash: await hash(password, 10),
      role: Role.VENDEDOR,
      isActive: true,
    },
  });

  revalidatePath("/app/users");
}

export async function toggleTenantUserStatusAction(formData: FormData) {
  const user = await requireTenantUser([Role.ADMIN_EMPRESA]);

  const targetUserId = requiredText(formData, "userId", "Usuario invalido.");
  const nextState = requiredText(formData, "nextState", "Estado invalido.") === "true";

  const target = await prisma.user.findFirst({
    where: {
      id: targetUserId,
      tenantId: user.tenantId,
      role: Role.VENDEDOR,
    },
    select: { id: true },
  });

  if (!target) {
    throw new Error("Usuario no encontrado.");
  }

  const updated = await prisma.user.updateMany({
    where: {
      id: targetUserId,
      tenantId: user.tenantId,
      role: Role.VENDEDOR,
    },
    data: { isActive: nextState },
  });

  if (updated.count === 0) {
    throw new Error("No se pudo actualizar el usuario.");
  }

  revalidatePath("/app/users");
}
