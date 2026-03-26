import { getBackendErrorMessage } from "@/services/backend/error";
import { formDataToPayload } from "@/services/backend/form-data";
import { clientBackendRequest } from "@/services/backend/client-request";

export async function createCollectionLogClient(formData: FormData) {
  const saleId = String(formData.get("saleId") ?? "").trim();

  if (!saleId) {
    throw new Error("Venta invalida.");
  }

  try {
    return await clientBackendRequest("/receivables/collection-logs", {
      method: "POST",
      body: formDataToPayload(formData),
    });
  } catch (error) {
    throw new Error(getBackendErrorMessage(error, "No se pudo registrar el seguimiento."));
  }
}

