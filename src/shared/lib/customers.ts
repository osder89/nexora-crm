export type CustomerNameLike = {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
};

export function getCustomerFullName(customer: CustomerNameLike) {
  const firstName = customer.firstName?.trim() ?? "";
  const lastName = customer.lastName?.trim() ?? "";
  const fullName = `${firstName} ${lastName}`.trim();

  if (fullName.length > 0) {
    return fullName;
  }

  return customer.name?.trim() || "Sin nombre";
}

