import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import type { SaleDetail } from "@/services/server/sales.service";
import type { PagePropsWithShell } from "@/services/pages/guards";
import {
  getInstallmentStatusLabel,
  getPaymentMethodLabel,
  getSaleStatusLabel,
  getSaleTypeLabel,
} from "@/shared/lib/labels";
import { getCustomerFullName } from "@/shared/lib/customers";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FONT_SIZE = 10;
const SMALL_FONT_SIZE = 9;
const TITLE_SIZE = 18;
const SECTION_TITLE_SIZE = 12;
const LINE_HEIGHT = 15;
const ROW_HEIGHT = 18;
const TEXT_COLOR = rgb(0.15, 0.2, 0.3);
const MUTED_COLOR = rgb(0.45, 0.5, 0.58);
const BORDER_COLOR = rgb(0.84, 0.87, 0.91);
const HEADER_BG = rgb(0.95, 0.97, 0.99);
const BRAND_COLOR = rgb(0.05, 0.45, 0.69);

type ReceiptOptions = {
  sale: SaleDetail;
  companyName: string;
};

type PdfContext = {
  pdfDoc: PDFDocument;
  regularFont: PDFFont;
  boldFont: PDFFont;
  page: PDFPage;
  cursorY: number;
};

type Column = {
  label: string;
  width: number;
  align?: "left" | "right" | "center";
};

export async function createSaleReceiptPdf({ sale, companyName }: ReceiptOptions) {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const context: PdfContext = {
    pdfDoc,
    regularFont,
    boldFont,
    page: pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    cursorY: PAGE_HEIGHT - MARGIN,
  };

  drawHeader(context, sale, companyName);
  drawSummary(context, sale, companyName);
  drawItemsTable(context, sale);

  if (sale.saleType === "CREDITO") {
    drawInstallmentsTable(context, sale);
  }

  drawPaymentsSection(context, sale);
  drawNotesSection(context, sale);
  drawFooter(context);

  return pdfDoc.save();
}

function drawHeader(context: PdfContext, sale: SaleDetail, companyName: string) {
  const receiptTitle = sale.saleType === "CREDITO" ? "Recibo de venta a credito" : "Recibo de venta";
  const saleCode = sale.id.slice(-8).toUpperCase();

  drawText(context, companyName, MARGIN, context.cursorY, {
    font: context.boldFont,
    size: TITLE_SIZE,
    color: BRAND_COLOR,
  });

  context.cursorY -= 24;

  drawText(context, receiptTitle, MARGIN, context.cursorY, {
    font: context.boldFont,
    size: 13,
    color: TEXT_COLOR,
  });

  drawText(context, `Recibo ${saleCode}`, PAGE_WIDTH - MARGIN - 130, context.cursorY, {
    font: context.boldFont,
    size: 12,
    color: TEXT_COLOR,
  });

  context.cursorY -= 18;

  drawText(context, `Emitido: ${formatDateTime(new Date().toISOString())}`, MARGIN, context.cursorY, {
    font: context.regularFont,
    size: SMALL_FONT_SIZE,
    color: MUTED_COLOR,
  });

  drawText(context, `Fecha venta: ${formatDateTime(sale.createdAt)}`, PAGE_WIDTH - MARGIN - 150, context.cursorY, {
    font: context.regularFont,
    size: SMALL_FONT_SIZE,
    color: MUTED_COLOR,
  });

  context.cursorY -= 22;
  drawDivider(context);
  context.cursorY -= 16;
}

function drawSummary(context: PdfContext, sale: SaleDetail, companyName: string) {
  ensureSpace(context, 150);

  drawSectionTitle(context, "Resumen de la venta");

  const customerName = sale.customer ? getCustomerFullName(sale.customer) : "Consumidor final";
  const customerNit = sale.customer?.nit?.trim() ? sale.customer.nit : "-";

  const leftColumn = [
    ["Empresa", companyName],
    ["Cliente", customerName],
    ["NIT/CI", customerNit],
    ["Vendedor", sale.seller.email],
  ] as const;

  const rightColumn = [
    ["Tipo", getSaleTypeLabel(sale.saleType)],
    ["Estado", getSaleStatusLabel(sale.status)],
    ["Total", formatCurrency(Number(sale.total))],
    ["Saldo", formatCurrency(Number(sale.balance))],
    ["Vencimiento", formatDate(sale.dueDate)],
  ] as const;

  const leftX = MARGIN;
  const rightX = MARGIN + CONTENT_WIDTH / 2 + 10;
  let leftY = context.cursorY;
  let rightY = context.cursorY;

  for (const [label, value] of leftColumn) {
    drawLabelValue(context, leftX, leftY, label, value);
    leftY -= LINE_HEIGHT;
  }

  for (const [label, value] of rightColumn) {
    drawLabelValue(context, rightX, rightY, label, value);
    rightY -= LINE_HEIGHT;
  }

  context.cursorY = Math.min(leftY, rightY) - 10;
}

function drawItemsTable(context: PdfContext, sale: SaleDetail) {
  ensureSpace(context, 120);
  drawSectionTitle(context, "Detalle de items");

  const columns: Column[] = [
    { label: "Producto", width: 250 },
    { label: "Cant.", width: 55, align: "center" },
    { label: "P. unit.", width: 90, align: "right" },
    { label: "Subtotal", width: 100, align: "right" },
  ];

  drawTableHeader(context, columns);

  for (const item of sale.items) {
    ensureSpace(context, ROW_HEIGHT + 8);

    const productLines = splitTextToLines(item.product.name, columns[0].width - 8, context.regularFont, FONT_SIZE);
    const rowHeight = Math.max(ROW_HEIGHT, productLines.length * 12 + 6);
    let x = MARGIN;

    drawCell(context, productLines, x, context.cursorY, columns[0].width, rowHeight, "left");
    x += columns[0].width;
    drawCell(context, [String(item.quantity)], x, context.cursorY, columns[1].width, rowHeight, "center");
    x += columns[1].width;
    drawCell(context, [formatCurrency(Number(item.unitPrice))], x, context.cursorY, columns[2].width, rowHeight, "right");
    x += columns[2].width;
    drawCell(context, [formatCurrency(Number(item.subtotal))], x, context.cursorY, columns[3].width, rowHeight, "right");

    context.cursorY -= rowHeight;
  }

  context.cursorY -= 12;
}

function drawInstallmentsTable(context: PdfContext, sale: SaleDetail) {
  ensureSpace(context, 140);
  drawSectionTitle(context, "Plan de cuotas");

  const columns: Column[] = [
    { label: "#", width: 32, align: "center" },
    { label: "Vence", width: 82 },
    { label: "Monto", width: 82, align: "right" },
    { label: "Pagado", width: 82, align: "right" },
    { label: "Pendiente", width: 82, align: "right" },
    { label: "Estado", width: 95 },
  ];

  drawTableHeader(context, columns);

  for (const installment of sale.installments) {
    ensureSpace(context, ROW_HEIGHT + 8);

    const pending = Math.max(Number(installment.amount) - Number(installment.paidAmount), 0);
    let x = MARGIN;

    drawCell(context, [String(installment.installmentNumber)], x, context.cursorY, columns[0].width, ROW_HEIGHT, "center");
    x += columns[0].width;
    drawCell(context, [formatDate(installment.dueDate)], x, context.cursorY, columns[1].width, ROW_HEIGHT, "left");
    x += columns[1].width;
    drawCell(context, [formatCurrency(Number(installment.amount))], x, context.cursorY, columns[2].width, ROW_HEIGHT, "right");
    x += columns[2].width;
    drawCell(context, [formatCurrency(Number(installment.paidAmount))], x, context.cursorY, columns[3].width, ROW_HEIGHT, "right");
    x += columns[3].width;
    drawCell(context, [formatCurrency(pending)], x, context.cursorY, columns[4].width, ROW_HEIGHT, "right");
    x += columns[4].width;
    drawCell(context, [getInstallmentStatusLabel(installment.status)], x, context.cursorY, columns[5].width, ROW_HEIGHT, "left");

    context.cursorY -= ROW_HEIGHT;
  }

  context.cursorY -= 12;
}

function drawPaymentsSection(context: PdfContext, sale: SaleDetail) {
  ensureSpace(context, 100);
  drawSectionTitle(context, sale.payments.length > 0 ? "Pagos registrados" : "Pagos");

  if (sale.payments.length === 0) {
    drawParagraph(context, "No hay pagos registrados todavia.");
    context.cursorY -= 6;
    return;
  }

  const columns: Column[] = [
    { label: "Fecha", width: 92 },
    { label: "Monto", width: 92, align: "right" },
    { label: "Metodo", width: 88 },
    { label: "Nota", width: 203 },
  ];

  drawTableHeader(context, columns);

  for (const payment of sale.payments) {
    ensureSpace(context, ROW_HEIGHT + 8);
    const noteLines = splitTextToLines(payment.note ?? "-", columns[3].width - 8, context.regularFont, FONT_SIZE);
    const rowHeight = Math.max(ROW_HEIGHT, noteLines.length * 12 + 6);
    let x = MARGIN;

    drawCell(context, [formatDate(payment.paidAt)], x, context.cursorY, columns[0].width, rowHeight, "left");
    x += columns[0].width;
    drawCell(context, [formatCurrency(Number(payment.amount))], x, context.cursorY, columns[1].width, rowHeight, "right");
    x += columns[1].width;
    drawCell(context, [getPaymentMethodLabel(payment.method)], x, context.cursorY, columns[2].width, rowHeight, "left");
    x += columns[2].width;
    drawCell(context, noteLines, x, context.cursorY, columns[3].width, rowHeight, "left");

    context.cursorY -= rowHeight;
  }

  context.cursorY -= 12;
}

function drawNotesSection(context: PdfContext, sale: SaleDetail) {
  ensureSpace(context, 80);
  drawSectionTitle(context, "Notas");
  drawParagraph(context, sale.notes?.trim() ? sale.notes : "Sin notas registradas.");
  context.cursorY -= 10;
}

function drawFooter(context: PdfContext) {
  const footerY = 28;
  context.page.drawLine({
    start: { x: MARGIN, y: footerY + 12 },
    end: { x: PAGE_WIDTH - MARGIN, y: footerY + 12 },
    thickness: 1,
    color: BORDER_COLOR,
  });

  drawText(context, "Documento generado por Nexora CRM.", MARGIN, footerY, {
    font: context.regularFont,
    size: 8,
    color: MUTED_COLOR,
  });
}

function drawSectionTitle(context: PdfContext, title: string) {
  ensureSpace(context, 30);
  drawText(context, title, MARGIN, context.cursorY, {
    font: context.boldFont,
    size: SECTION_TITLE_SIZE,
    color: TEXT_COLOR,
  });
  context.cursorY -= 18;
}

function drawParagraph(context: PdfContext, text: string) {
  const lines = splitTextToLines(text, CONTENT_WIDTH, context.regularFont, FONT_SIZE);

  for (const line of lines) {
    ensureSpace(context, LINE_HEIGHT);
    drawText(context, line, MARGIN, context.cursorY, {
      font: context.regularFont,
      size: FONT_SIZE,
      color: TEXT_COLOR,
    });
    context.cursorY -= LINE_HEIGHT;
  }
}

function drawLabelValue(context: PdfContext, x: number, y: number, label: string, value: string) {
  drawText(context, `${label}:`, x, y, {
    font: context.boldFont,
    size: FONT_SIZE,
    color: TEXT_COLOR,
  });

  drawText(context, value, x + 62, y, {
    font: context.regularFont,
    size: FONT_SIZE,
    color: TEXT_COLOR,
  });
}

function drawDivider(context: PdfContext) {
  context.page.drawLine({
    start: { x: MARGIN, y: context.cursorY },
    end: { x: PAGE_WIDTH - MARGIN, y: context.cursorY },
    thickness: 1,
    color: BORDER_COLOR,
  });
}

function drawTableHeader(context: PdfContext, columns: Column[]) {
  ensureSpace(context, ROW_HEIGHT + 10);
  let x = MARGIN;

  for (const column of columns) {
    context.page.drawRectangle({
      x,
      y: context.cursorY - ROW_HEIGHT + 4,
      width: column.width,
      height: ROW_HEIGHT,
      color: HEADER_BG,
      borderColor: BORDER_COLOR,
      borderWidth: 1,
    });

    drawAlignedText(context, column.label, x + 4, context.cursorY - 11, column.width - 8, column.align ?? "left", {
      font: context.boldFont,
      size: SMALL_FONT_SIZE,
      color: TEXT_COLOR,
    });

    x += column.width;
  }

  context.cursorY -= ROW_HEIGHT;
}

function drawCell(
  context: PdfContext,
  lines: string[],
  x: number,
  y: number,
  width: number,
  height: number,
  align: Column["align"] = "left",
) {
  context.page.drawRectangle({
    x,
    y: y - height + 4,
    width,
    height,
    borderColor: BORDER_COLOR,
    borderWidth: 1,
  });

  let textY = y - 11;
  for (const line of lines) {
    drawAlignedText(context, line, x + 4, textY, width - 8, align, {
      font: context.regularFont,
      size: FONT_SIZE,
      color: TEXT_COLOR,
    });
    textY -= 12;
  }
}

function drawAlignedText(
  context: PdfContext,
  text: string,
  x: number,
  y: number,
  width: number,
  align: Column["align"],
  options: { font: PDFFont; size: number; color: ReturnType<typeof rgb> },
) {
  const textWidth = options.font.widthOfTextAtSize(text, options.size);
  const drawX =
    align === "right"
      ? x + Math.max(width - textWidth, 0)
      : align === "center"
        ? x + Math.max((width - textWidth) / 2, 0)
        : x;

  drawText(context, text, drawX, y, options);
}

function drawText(
  context: PdfContext,
  text: string,
  x: number,
  y: number,
  options: { font: PDFFont; size: number; color: ReturnType<typeof rgb> },
) {
  context.page.drawText(text, {
    x,
    y,
    font: options.font,
    size: options.size,
    color: options.color,
  });
}

function splitTextToLines(text: string, maxWidth: number, font: PDFFont, size: number) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return ["-"];
  }

  const words = normalized.split(" ");
  const lines: string[] = [];
  let currentLine = words[0] ?? "";

  for (let index = 1; index < words.length; index += 1) {
    const nextWord = words[index];
    const candidate = `${currentLine} ${nextWord}`;

    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    lines.push(currentLine);
    currentLine = nextWord;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function ensureSpace(context: PdfContext, heightNeeded: number) {
  if (context.cursorY - heightNeeded >= 55) {
    return;
  }

  context.page = context.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  context.cursorY = PAGE_HEIGHT - MARGIN;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("es-BO");
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("es-BO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getTenantCompanyName(appShell?: PagePropsWithShell["appShell"]) {
  return appShell?.kind === "tenant" ? appShell.tenantName : "Nexora CRM";
}
