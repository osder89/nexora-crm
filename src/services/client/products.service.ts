import { getBackendErrorMessage } from "@/services/backend/error";
import { formDataToPayload } from "@/services/backend/form-data";
import { clientBackendRequest } from "@/services/backend/client-request";

export async function createProductClient(formData: FormData) {
  try {
    return await clientBackendRequest("/products", {
      method: "POST",
      body: formDataToPayload(formData),
    });
  } catch (error) {
    throw new Error(getBackendErrorMessage(error, "No se pudo registrar el producto."));
  }
}

export async function updateProductClient(formData: FormData) {
  const productId = String(formData.get("productId") ?? "").trim();

  if (!productId) {
    throw new Error("Producto invalido.");
  }

  try {
    return await clientBackendRequest(`/products/${productId}`, {
      method: "PUT",
      body: formDataToPayload(formData),
    });
  } catch (error) {
    throw new Error(getBackendErrorMessage(error, "No se pudo actualizar el producto."));
  }
}

export async function softDeleteProductClient(formData: FormData) {
  const productId = String(formData.get("productId") ?? "").trim();

  if (!productId) {
    throw new Error("Producto invalido.");
  }

  try {
    return await clientBackendRequest(`/products/${productId}`, {
      method: "DELETE",
    });
  } catch (error) {
    throw new Error(getBackendErrorMessage(error, "No se pudo eliminar el producto."));
  }
}

export async function createProductCategoryClient(formData: FormData) {
  try {
    return await clientBackendRequest("/product-categories", {
      method: "POST",
      body: formDataToPayload(formData),
    });
  } catch (error) {
    throw new Error(getBackendErrorMessage(error, "No se pudo registrar la categoria."));
  }
}

