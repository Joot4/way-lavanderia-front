"use server";

import { revalidatePath } from "next/cache";
import {
  createInstance,
  deleteInstance,
  logoutInstance,
} from "@/lib/instances";
import { setFlash } from "@/lib/flash";
import { BackendError } from "@/lib/backend";

function backendMessage(err: unknown): string {
  if (err instanceof BackendError) {
    if (err.body && typeof err.body === "object") {
      const b = err.body as { message?: unknown };
      if (typeof b.message === "string") return b.message;
    }
    return `Backend ${err.status}`;
  }
  return (err as Error)?.message ?? "Erro inesperado";
}

export async function createInstanceAction(
  tenantId: string,
  instanceName: string,
) {
  try {
    await createInstance({ instanceName });
  } catch (err) {
    await setFlash("error", `Falha ao criar instância: ${backendMessage(err)}`);
    throw err;
  }
  await setFlash("success", "Instância criada. Aguarde o QR Code.");
  revalidatePath(`/tenants/${tenantId}`);
  revalidatePath("/instances");
}

export async function logoutInstanceAction(
  tenantId: string,
  instanceName: string,
) {
  try {
    await logoutInstance(instanceName);
  } catch (err) {
    await setFlash("error", `Falha ao desconectar: ${backendMessage(err)}`);
    throw err;
  }
  await setFlash("success", "WhatsApp desconectado.");
  revalidatePath(`/tenants/${tenantId}`);
  revalidatePath("/instances");
}

export async function deleteInstanceAction(
  tenantId: string,
  instanceName: string,
) {
  try {
    await deleteInstance(instanceName);
  } catch (err) {
    await setFlash("error", `Falha ao deletar instância: ${backendMessage(err)}`);
    throw err;
  }
  await setFlash("success", "Instância deletada.");
  revalidatePath(`/tenants/${tenantId}`);
  revalidatePath("/instances");
}
