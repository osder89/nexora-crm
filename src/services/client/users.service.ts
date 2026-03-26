import { getBackendErrorMessage } from "@/services/backend/error";
import { formDataToPayload } from "@/services/backend/form-data";
import { clientBackendRequest } from "@/services/backend/client-request";

export async function createVendorClient(formData: FormData) {
  try {
    return await clientBackendRequest("/users/vendors", {
      method: "POST",
      body: formDataToPayload(formData),
    });
  } catch (error) {
    throw new Error(getBackendErrorMessage(error, "No se pudo crear el vendedor."));
  }
}

export async function toggleTenantUserStatusClient(formData: FormData) {
  const userId = String(formData.get("userId") ?? "").trim();

  if (!userId) {
    throw new Error("Usuario invalido.");
  }

  try {
    return await clientBackendRequest(`/users/${userId}/toggle-status`, {
      method: "POST",
      body: formDataToPayload(formData),
    });
  } catch (error) {
    throw new Error(getBackendErrorMessage(error, "No se pudo actualizar el usuario."));
  }
}

