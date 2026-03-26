import { getBackendErrorMessage } from "@/services/backend/error";
import { formDataToPayload } from "@/services/backend/form-data";
import { clientBackendRequest } from "@/services/backend/client-request";
import type { SaleDetail } from "@/services/server/sales.service";

export type LowStockProductAlert = {
  id: string;
  name: string;
  stock: number;
  stockMin: number;
};

export type CreateSaleResponse = {
  ok: true;
  sale: {
    id: string;
  };
  lowStockProducts: LowStockProductAlert[];
};

export async function createSaleClient(formData: FormData) {
  try {
    return await clientBackendRequest<CreateSaleResponse>("/sales", {
      method: "POST",
      body: formDataToPayload(formData),
    });
  } catch (error) {
    throw new Error(getBackendErrorMessage(error, "No se pudo registrar la venta."));
  }
}

export async function getSaleDetailClient(saleId: string) {
  if (!saleId) {
    throw new Error("Venta invalida.");
  }

  try {
    const response = await clientBackendRequest<{ ok: true; sale: SaleDetail }>(`/sales/${saleId}`);
    return response.sale;
  } catch (error) {
    throw new Error(getBackendErrorMessage(error, "No se pudo obtener el detalle de la venta."));
  }
}

export async function createPaymentClient(formData: FormData) {
  const saleId = String(formData.get("saleId") ?? "").trim();

  if (!saleId) {
    throw new Error("Venta invalida.");
  }

  try {
    return await clientBackendRequest(`/sales/${saleId}/payments`, {
      method: "POST",
      body: formDataToPayload(formData),
    });
  } catch (error) {
    throw new Error(getBackendErrorMessage(error, "No se pudo registrar el pago."));
  }
}

export async function cancelSaleClient(formData: FormData) {
  const saleId = String(formData.get("saleId") ?? "").trim();

  if (!saleId) {
    throw new Error("Venta invalida.");
  }

  try {
    return await clientBackendRequest(`/sales/${saleId}/cancel`, {
      method: "POST",
      body: formDataToPayload(formData),
    });
  } catch (error) {
    throw new Error(getBackendErrorMessage(error, "No se pudo cancelar la venta."));
  }
}
