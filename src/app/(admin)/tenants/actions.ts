"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createTenant,
  deleteTenant as deleteTenantCall,
  patchTenant,
  postTenant,
  putTenant,
  type SubscriptionPaymentMethod,
  type TenantStatus,
  type SubscriptionStatus,
} from "@/lib/tenants";
import { BackendError } from "@/lib/backend";

function parseCents(value: FormDataEntryValue | null): number {
  if (value == null) return 0;
  const normalized = String(value).replace(/\./g, "").replace(",", ".").trim();
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Valor inválido");
  }
  return Math.round(n * 100);
}

function trim(value: FormDataEntryValue | null): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  return s ? s : undefined;
}

export async function createTenantAction(formData: FormData) {
  const priceRaw = trim(formData.get("monthlyPrice"));
  const enableSubscription = Boolean(formData.get("enableSubscription")) && !!priceRaw;

  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    instanceName: String(formData.get("instanceName") ?? "").trim(),
    timezone: trim(formData.get("timezone")) ?? "America/Sao_Paulo",
    status: (trim(formData.get("status")) as TenantStatus) ?? "TRIAL",
    config: {
      ownerWhatsapp: String(formData.get("ownerWhatsapp") ?? "").trim(),
      humanAttendantPhone: trim(formData.get("humanAttendantPhone")) ?? null,
      address: trim(formData.get("address")) ?? null,
      aboutText: trim(formData.get("aboutText")) ?? null,
    },
    priceItems: [] as unknown[],
    subscription: enableSubscription
      ? {
          monthlyPriceCents: parseCents(priceRaw!),
          dueDay: Number(formData.get("dueDay") ?? 1),
          trialDays: formData.get("trialDays")
            ? Number(formData.get("trialDays"))
            : undefined,
        }
      : undefined,
  };

  if (!payload.name || !payload.instanceName || !payload.config.ownerWhatsapp) {
    throw new Error("Nome, instanceName e ownerWhatsapp são obrigatórios");
  }

  const tenant = await createTenant(payload);

  try {
    await postTenant("/admin/instances", { instanceName: payload.instanceName });
  } catch (err) {
    // Se já existe na Evolution (ex: retry após falha), tudo bem — a
    // página de detalhes vai mostrar o QR. Outros erros também não devem
    // bloquear: o tenant foi criado, usuário pode retryar ali.
    if (!(err instanceof BackendError) || err.status !== 409) {
      console.warn(`Falha ao provisionar instância: ${(err as Error).message}`);
    }
  }

  revalidatePath("/tenants");
  redirect(`/tenants/${tenant.id}`);
}

export async function updateTenantStatusAction(
  id: string,
  status: TenantStatus,
) {
  await patchTenant(`/admin/tenants/${encodeURIComponent(id)}`, { status });
  revalidatePath("/tenants");
  revalidatePath(`/tenants/${id}`);
}

export async function deleteTenantAction(id: string) {
  await deleteTenantCall(id);
  revalidatePath("/tenants");
  redirect("/tenants");
}

export async function upsertSubscriptionAction(id: string, formData: FormData) {
  const payload: Record<string, unknown> = {
    monthlyPriceCents: parseCents(formData.get("monthlyPrice")),
    dueDay: Number(formData.get("dueDay") ?? 1),
  };
  const status = trim(formData.get("status")) as SubscriptionStatus | undefined;
  if (status) payload.status = status;
  const notes = trim(formData.get("notes"));
  if (notes !== undefined) payload.notes = notes;

  await putTenant(
    `/admin/tenants/${encodeURIComponent(id)}/subscription`,
    payload,
  );
  revalidatePath(`/tenants/${id}`);
  revalidatePath("/tenants");
}

export async function updateConfigAction(
  id: string,
  current: {
    openingHours?: unknown;
    humanSupportHours?: unknown;
  },
  formData: FormData,
) {
  const ownerWhatsapp = String(formData.get("ownerWhatsapp") ?? "").trim();
  if (!ownerWhatsapp) {
    throw new Error("WhatsApp do dono é obrigatório");
  }
  const payload: Record<string, unknown> = {
    ownerWhatsapp,
    humanAttendantPhone: trim(formData.get("humanAttendantPhone")) ?? null,
    address: trim(formData.get("address")) ?? null,
    aboutText: trim(formData.get("aboutText")) ?? null,
    openingHours: current.openingHours ?? null,
    humanSupportHours: current.humanSupportHours ?? null,
  };

  await putTenant(
    `/admin/tenants/${encodeURIComponent(id)}/config`,
    payload,
  );
  revalidatePath(`/tenants/${id}`);
}

export async function replacePricesAction(id: string, formData: FormData) {
  const raw = String(formData.get("itemsJson") ?? "[]");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Payload de preços inválido");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Payload de preços inválido");
  }

  const items = parsed.map((raw, idx) => {
    const item = raw as Record<string, unknown>;
    const name = String(item.name ?? "").trim();
    const priceCents = Number(item.priceCents ?? 0);
    if (!name) throw new Error(`Item ${idx + 1}: nome é obrigatório`);
    if (!Number.isInteger(priceCents) || priceCents <= 0) {
      throw new Error(`Item ${idx + 1}: preço inválido`);
    }
    const description =
      typeof item.description === "string" && item.description.trim()
        ? item.description.trim()
        : null;
    const unit =
      typeof item.unit === "string" && item.unit.trim()
        ? item.unit.trim()
        : null;
    return {
      name,
      priceCents,
      description,
      unit,
      active: item.active !== false,
    };
  });

  await putTenant(`/admin/tenants/${encodeURIComponent(id)}/prices`, { items });
  revalidatePath(`/tenants/${id}`);
}

export async function recordPaymentAction(id: string, formData: FormData) {
  const method = (trim(formData.get("method")) ??
    "MANUAL") as SubscriptionPaymentMethod;
  const payload: Record<string, unknown> = {
    amountCents: parseCents(formData.get("amount")),
    method,
  };
  const note = trim(formData.get("note"));
  if (note) payload.note = note;
  const paidAt = trim(formData.get("paidAt"));
  if (paidAt) {
    const asDate = new Date(paidAt);
    if (!Number.isNaN(asDate.getTime())) {
      payload.paidAt = asDate.toISOString();
    }
  }

  await postTenant(
    `/admin/tenants/${encodeURIComponent(id)}/subscription/payments`,
    payload,
  );
  revalidatePath(`/tenants/${id}`);
  revalidatePath("/tenants");
}
