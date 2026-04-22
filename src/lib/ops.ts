import "server-only";
import { backendJson } from "./backend";

export type ComplaintStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type PaymentStatus = "PENDING" | "APPROVED" | "PAID" | "CANCELLED";

type Related = {
  tenant: { id: string; name: string };
  conversation: {
    id: string;
    customerName: string | null;
    customerPhone: string;
  };
};

export type ComplaintItem = Related & {
  id: string;
  machine: string | null;
  category: string;
  description: string;
  status: ComplaintStatus;
  resolvedAt: string | null;
  createdAt: string;
};

export type PaymentItem = Related & {
  id: string;
  machine: string | null;
  amountCents: number;
  pixCode: string | null;
  status: PaymentStatus;
  approvedAt: string | null;
  paidAt: string | null;
  createdAt: string;
};

type Page<T> = { items: T[]; nextCursor: string | null };

export function listComplaints(params: {
  status?: ComplaintStatus;
  tenantId?: string;
  cursor?: string;
}): Promise<Page<ComplaintItem>> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.tenantId) qs.set("tenantId", params.tenantId);
  if (params.cursor) qs.set("cursor", params.cursor);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return backendJson<Page<ComplaintItem>>(`/admin/complaints${suffix}`);
}

export function listPayments(params: {
  status?: PaymentStatus;
  tenantId?: string;
  cursor?: string;
}): Promise<Page<PaymentItem>> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.tenantId) qs.set("tenantId", params.tenantId);
  if (params.cursor) qs.set("cursor", params.cursor);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return backendJson<Page<PaymentItem>>(`/admin/payments${suffix}`);
}

export const COMPLAINT_STATUS_LABEL: Record<ComplaintStatus, string> = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em andamento",
  RESOLVED: "Resolvida",
  CLOSED: "Fechada",
};

export const COMPLAINT_STATUS_TONE: Record<ComplaintStatus, string> = {
  OPEN:
    "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-800",
  IN_PROGRESS:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800",
  RESOLVED:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800",
  CLOSED:
    "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  PAID: "Pago",
  CANCELLED: "Cancelado",
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, string> = {
  PENDING:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800",
  APPROVED:
    "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800",
  PAID:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800",
  CANCELLED:
    "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700",
};
