import { formDataToPayload } from "@/services/backend/form-data";
import { clientBackendRequest } from "@/services/backend/client-request";

export async function createCustomerClient(formData: FormData) {
  return clientBackendRequest("/customers", {
    method: "POST",
    body: formDataToPayload(formData),
  });
}

export async function updateCustomerClient(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "").trim();

  if (!customerId) {
    throw new Error("Cliente invalido.");
  }

  return clientBackendRequest(`/customers/${customerId}`, {
    method: "PUT",
    body: formDataToPayload(formData),
  });
}

export async function softDeleteCustomerClient(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "").trim();

  if (!customerId) {
    throw new Error("Cliente invalido.");
  }

  return clientBackendRequest(`/customers/${customerId}`, {
    method: "DELETE",
  });
}

