export function formDataToPayload(formData: FormData) {
  const payload: Record<string, string | string[]> = {};

  for (const [key, value] of formData.entries()) {
    const normalized = typeof value === "string" ? value : value.name;
    const current = payload[key];

    if (current === undefined) {
      payload[key] = normalized;
      continue;
    }

    payload[key] = Array.isArray(current) ? [...current, normalized] : [current, normalized];
  }

  return payload;
}

