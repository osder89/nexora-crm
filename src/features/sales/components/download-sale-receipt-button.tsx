"use client";

import { useState } from "react";

import { buildSaleReceiptFilename, openPdfBytes } from "@/features/sales/lib/open-pdf";
import { createSaleReceiptPdf, getTenantCompanyName } from "@/features/sales/lib/sale-receipt-pdf";
import type { SaleDetail } from "@/services/server/sales.service";
import type { PagePropsWithShell } from "@/services/pages/guards";
import { useToast } from "@/shared/components/toast-provider";

type DownloadSaleReceiptButtonProps = {
  sale: SaleDetail;
  appShell?: PagePropsWithShell["appShell"];
  className?: string;
  label?: string;
};

export function DownloadSaleReceiptButton({
  sale,
  appShell,
  className,
  label = "Recibo PDF",
}: DownloadSaleReceiptButtonProps) {
  const [pending, setPending] = useState(false);
  const toast = useToast();

  async function handleClick() {
    setPending(true);

    try {
      const pdfBytes = await createSaleReceiptPdf({
        sale,
        companyName: getTenantCompanyName(appShell),
      });

      openPdfBytes(pdfBytes, buildSaleReceiptFilename(sale.id));
    } catch {
      toast.error("No se pudo generar el recibo PDF.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={pending}
      className={
        className ??
        "inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      }
    >
      {pending ? "Generando PDF..." : label}
    </button>
  );
}
