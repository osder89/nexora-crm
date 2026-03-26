import { getBackendErrorMessage } from "@/services/backend/error";
import { formDataToPayload } from "@/services/backend/form-data";
import { clientBackendRequest } from "@/services/backend/client-request";

export async function createSupplierClient(formData: FormData) {
  try {
    return await clientBackendRequest("/suppliers", {
      method: "POST",
      body: formDataToPayload(formData),
    });
  } catch (error) {
    throw new Error(getBackendErrorMessage(error, "No se pudo registrar el proveedor."));
  }
}

export async function createPurchaseClient(formData: FormData) {
  try {
    return await clientBackendRequest("/purchases", {
      method: "POST",
      body: formDataToPayload(formData),
    });
  } catch (error) {
    throw new Error(getBackendErrorMessage(error, "No se pudo registrar la compra."));
  }
}

export async function receivePurchaseClient(formData: FormData) {
  const purchaseId = String(formData.get("purchaseId") ?? "").trim();

  if (!purchaseId) {
    throw new Error("Compra invalida.");
  }

  try {
    return await clientBackendRequest(`/purchases/${purchaseId}/receive`, {
      method: "POST",
    });
  } catch (error) {
    throw new Error(getBackendErrorMessage(error, "No se pudo recibir la compra."));
  }
}

export async function cancelPurchaseClient(formData: FormData) {
  const purchaseId = String(formData.get("purchaseId") ?? "").trim();

  if (!purchaseId) {
    throw new Error("Compra invalida.");
  }

  try {
    return await clientBackendRequest(`/purchases/${purchaseId}/cancel`, {
      method: "POST",
      body: formDataToPayload(formData),
    });
  } catch (error) {
    throw new Error(getBackendErrorMessage(error, "No se pudo cancelar la compra."));
  }
}

