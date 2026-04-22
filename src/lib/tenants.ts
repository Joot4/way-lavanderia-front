import "server-only";
import { backendFetch, backendJson, BackendError } from "./backend";

export type TenantStatus = "ACTIVE" | "SUSPENDED" | "TRIAL";
export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED";
export type SubscriptionPaymentMethod =
  | "PIX"
  | "BOLETO"
  | "TRANSFER"
  | "MANUAL";

export type SubscriptionSummary = {
  id: string;
  status: SubscriptionStatus;
  monthlyPriceCents: number;
  dueDay: number;
  nextDueAt: string | null;
  lastPaidAt: string | null;
  trialEndsAt: string | null;
  notes: string | null;
  overdueDays: number;
};

export type TenantListItem = {
  id: string;
  name: string;
  whatsappNumber: string;
  timezone: string;
  status: TenantStatus;
  createdAt: string;
  counts: {
    conversations: number;
    customers: number;
    priceItems: number;
  };
  subscription: SubscriptionSummary | null;
};

export type TenantDetail = {
  id: string;
  name: string;
  whatsappNumber: string;
  timezone: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
  config: {
    id: string;
    ownerWhatsapp: string;
    humanAttendantPhone: string | null;
    address: string | null;
    openingHours: unknown;
    humanSupportHours: unknown;
    promptCustomization: unknown;
  } | null;
  subscription: SubscriptionSummary | null;
  priceItems: {
    id: string;
    name: string;
    description: string | null;
    priceCents: number;
    unit: string | null;
    active: boolean;
  }[];
  integrations: {
    id: string;
    kind: "SISLAV" | "MAXPAN" | "CUSTOM";
    enabled: boolean;
  }[];
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
  }[];
  _count: {
    conversations: number;
    customers: number;
    complaints: number;
    payments: number;
  };
};

export type SubscriptionPaymentRow = {
  id: string;
  amountCents: number;
  method: SubscriptionPaymentMethod;
  paidAt: string;
  note: string | null;
  recordedBy: string | null;
  createdAt: string;
};

export function listTenants(): Promise<TenantListItem[]> {
  return backendJson<TenantListItem[]>("/admin/tenants");
}

export function getTenant(id: string): Promise<TenantDetail> {
  return backendJson<TenantDetail>(`/admin/tenants/${encodeURIComponent(id)}`);
}

export function listTenantPayments(
  id: string,
): Promise<SubscriptionPaymentRow[]> {
  return backendJson<SubscriptionPaymentRow[]>(
    `/admin/tenants/${encodeURIComponent(id)}/subscription/payments`,
  );
}

export async function postTenant(path: string, body: unknown): Promise<void> {
  const res = await backendFetch(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await backendErrorFrom(res, path);
}

export async function patchTenant(path: string, body: unknown): Promise<void> {
  const res = await backendFetch(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await backendErrorFrom(res, path);
}

export async function putTenant(path: string, body: unknown): Promise<void> {
  const res = await backendFetch(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await backendErrorFrom(res, path);
}

export async function deleteTenant(id: string): Promise<void> {
  const res = await backendFetch(
    `/admin/tenants/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  if (!res.ok && res.status !== 204) {
    throw await backendErrorFrom(res, `delete /admin/tenants/${id}`);
  }
}

async function backendErrorFrom(res: Response, path: string) {
  const text = await res.text().catch(() => "");
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // keep as text
  }
  return new BackendError(`${path} -> ${res.status}`, res.status, body);
}

export const TENANT_STATUS_LABEL: Record<TenantStatus, string> = {
  ACTIVE: "Ativa",
  TRIAL: "Trial",
  SUSPENDED: "Suspensa",
};

export const TENANT_STATUS_TONE: Record<TenantStatus, string> = {
  ACTIVE:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800",
  TRIAL:
    "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800",
  SUSPENDED:
    "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-800",
};

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  TRIAL: "Trial",
  ACTIVE: "Em dia",
  PAST_DUE: "Atrasada",
  CANCELED: "Cancelada",
};

export const SUBSCRIPTION_STATUS_TONE: Record<SubscriptionStatus, string> = {
  ACTIVE:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800",
  TRIAL:
    "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800",
  PAST_DUE:
    "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-800",
  CANCELED:
    "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700",
};

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
