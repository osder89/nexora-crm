import { InstallmentStatus, PaymentMethod, PurchaseStatus, SaleStatus, SaleType } from "@prisma/client";

const saleStatusLabels: Record<SaleStatus, string> = {
  PAID: "Pagada",
  PENDING: "Pendiente",
  OVERDUE: "Vencida",
  CANCELED: "Cancelada",
};

const installmentStatusLabels: Record<InstallmentStatus, string> = {
  PAID: "Pagada",
  PENDING: "Pendiente",
  OVERDUE: "Vencida",
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  QR: "QR",
};

const saleTypeLabels: Record<SaleType, string> = {
  CONTADO: "Al contado",
  CREDITO: "A credito",
};

const purchaseStatusLabels: Record<PurchaseStatus, string> = {
  ORDERED: "Pedida",
  RECEIVED: "Recibida",
  CANCELED: "Cancelada",
};

export function getSaleStatusLabel(status: SaleStatus) {
  return saleStatusLabels[status];
}

export function getInstallmentStatusLabel(status: InstallmentStatus) {
  return installmentStatusLabels[status];
}

export function getPaymentMethodLabel(method: PaymentMethod) {
  return paymentMethodLabels[method];
}

export function getSaleTypeLabel(type: SaleType) {
  return saleTypeLabels[type];
}

export function getPurchaseStatusLabel(status: PurchaseStatus) {
  return purchaseStatusLabels[status];
}

export function getSaleStatusBadgeClass(status: SaleStatus) {
  if (status === SaleStatus.PAID) {
    return "bg-emerald-100 text-emerald-800";
  }
  if (status === SaleStatus.PENDING) {
    return "bg-amber-100 text-amber-800";
  }
  if (status === SaleStatus.OVERDUE) {
    return "bg-rose-100 text-rose-800";
  }
  return "bg-slate-200 text-slate-700";
}

export function getInstallmentStatusBadgeClass(status: InstallmentStatus) {
  if (status === InstallmentStatus.PAID) {
    return "bg-emerald-100 text-emerald-800";
  }
  if (status === InstallmentStatus.PENDING) {
    return "bg-amber-100 text-amber-800";
  }
  return "bg-rose-100 text-rose-800";
}

export function getPurchaseStatusBadgeClass(status: PurchaseStatus) {
  if (status === PurchaseStatus.RECEIVED) {
    return "bg-emerald-100 text-emerald-800";
  }
  if (status === PurchaseStatus.ORDERED) {
    return "bg-cyan-100 text-cyan-800";
  }
  return "bg-slate-200 text-slate-700";
}
