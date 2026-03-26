import { getBackendErrorMessage } from "@/services/backend/error";
import { formDataToPayload } from "@/services/backend/form-data";
import { clientBackendRequest } from "@/services/backend/client-request";

export async function createTenantClient(formData: FormData) {
  try {
    return await clientBackendRequest("/super/tenants", {
      method: "POST",
      body: formDataToPayload(formData),
    });
  } catch (error) {
    throw new Error(getBackendErrorMessage(error, "No se pudo crear el tenant."));
  }
}

export async function toggleTenantStatusClient(formData: FormData) {
  const tenantId = String(formData.get("tenantId") ?? "").trim();

  if (!tenantId) {
    throw new Error("Tenant invalido.");
  }

  try {
    return await clientBackendRequest(`/super/tenants/${tenantId}/toggle-status`, {
      method: "POST",
      body: formDataToPayload(formData),
    });
  } catch (error) {
    throw new Error(getBackendErrorMessage(error, "No se pudo actualizar el tenant."));
  }
}

export async function createTenantAdminClient(formData: FormData) {
  const tenantId = String(formData.get("tenantId") ?? "").trim();

  if (!tenantId) {
    throw new Error("Tenant invalido.");
  }

  try {
    return await clientBackendRequest(`/super/tenants/${tenantId}/admins`, {
      method: "POST",
      body: formDataToPayload(formData),
    });
  } catch (error) {
    throw new Error(getBackendErrorMessage(error, "No se pudo crear el administrador."));
  }
}

