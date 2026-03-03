"use server";

import { revalidatePath } from "next/cache";

import { optionalDate, requiredText } from "@/lib/actions/helpers";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";

export async function createCollectionLogAction(formData: FormData) {
  const user = await requireTenantUser();

  const saleId = requiredText(formData, "saleId", "Venta inválida.");
  const comment = requiredText(formData, "comment", "Comentario obligatorio.");
  const nextContactAt = optionalDate(formData, "nextContactAt");

  const sale = await prisma.sale.findUnique({
    where: {
      id_tenantId: {
        id: saleId,
        tenantId: user.tenantId,
      },
    },
    select: {
      id: true,
      customerId: true,
    },
  });

  if (!sale) {
    throw new Error("Venta no encontrada.");
  }

  await prisma.collectionLog.create({
    data: {
      tenantId: user.tenantId,
      saleId,
      customerId: sale.customerId,
      createdById: user.id,
      comment,
      nextContactAt,
    },
  });

  revalidatePath("/app/receivables");
  revalidatePath(`/app/sales/${saleId}`);
}

