import { getBackendErrorMessage } from "@/services/backend/error";
import { formDataToPayload } from "@/services/backend/form-data";
import { clientBackendRequest } from "@/services/backend/client-request";

export async function updateTenantSettingsClient(formData: FormData) {
  try {
    return await clientBackendRequest("/settings/tenant", {
      method: "PUT",
      body: formDataToPayload(formData),
    });
  } catch (error) {
    throw new Error(getBackendErrorMessage(error, "No se pudo guardar la configuracion."));
  }
}

