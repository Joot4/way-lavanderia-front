import "server-only";
import { backendFetch, backendJson, BackendError } from "./backend";

export type EvolutionInstance = {
  name: string;
  status: string;
  ownerJid: string | null;
  profileName: string | null;
  profilePictureUrl: string | null;
  integration: string | null;
};

export type EvolutionQr = {
  pairingCode: string | null;
  code: string | null;
  base64: string | null;
};

export function listInstances(): Promise<EvolutionInstance[]> {
  return backendJson<EvolutionInstance[]>("/admin/instances");
}

export async function findInstance(
  name: string,
): Promise<EvolutionInstance | null> {
  try {
    return await backendJson<EvolutionInstance>(
      `/admin/instances/${encodeURIComponent(name)}`,
    );
  } catch (err) {
    if (err instanceof BackendError && err.status === 404) return null;
    throw err;
  }
}

export async function getInstanceQr(name: string): Promise<EvolutionQr | null> {
  try {
    return await backendJson<EvolutionQr>(
      `/admin/instances/${encodeURIComponent(name)}/qr`,
    );
  } catch (err) {
    if (err instanceof BackendError) return null;
    throw err;
  }
}

export async function createInstance(params: {
  instanceName: string;
  webhookUrl?: string;
}): Promise<EvolutionInstance> {
  const res = await backendFetch("/admin/instances", {
    method: "POST",
    body: JSON.stringify(params),
  });
  if (!res.ok) throw await backendErrorFrom(res, "create instance");
  return res.json();
}

export async function logoutInstance(name: string): Promise<void> {
  const res = await backendFetch(
    `/admin/instances/${encodeURIComponent(name)}/logout`,
    { method: "POST" },
  );
  if (!res.ok) throw await backendErrorFrom(res, "logout");
}

export async function deleteInstance(name: string): Promise<void> {
  const res = await backendFetch(
    `/admin/instances/${encodeURIComponent(name)}`,
    { method: "DELETE" },
  );
  if (!res.ok && res.status !== 204) {
    throw await backendErrorFrom(res, "delete");
  }
}

async function backendErrorFrom(res: Response, label: string) {
  const text = await res.text().catch(() => "");
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // keep text
  }
  return new BackendError(`${label} -> ${res.status}`, res.status, body);
}

export function instanceStatusLabel(status: string): {
  label: string;
  tone: string;
} {
  const s = status.toLowerCase();
  if (s === "open" || s === "connected") {
    return {
      label: "Conectada",
      tone: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800",
    };
  }
  if (s === "connecting" || s === "qr" || s === "qrcode") {
    return {
      label: "Conectando",
      tone: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800",
    };
  }
  if (s === "close" || s === "closed" || s === "disconnected") {
    return {
      label: "Desconectada",
      tone: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-800",
    };
  }
  return {
    label: status,
    tone: "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700",
  };
}
