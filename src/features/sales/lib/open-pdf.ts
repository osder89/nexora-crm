export function buildSaleReceiptFilename(saleId: string) {
  return `recibo-venta-${saleId.slice(-8).toLowerCase()}.pdf`;
}

export function openPdfBytes(pdfBytes: Uint8Array, filename: string) {
  const normalizedBytes = new Uint8Array(pdfBytes.byteLength);
  normalizedBytes.set(pdfBytes);

  const blob = new Blob([normalizedBytes.buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const popup = window.open(url, "_blank", "noopener,noreferrer");

  if (!popup) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
