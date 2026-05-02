"use server";

import { revalidatePath } from "next/cache";
import { updateGlobalConfig } from "@/lib/global-config";
import { BackendError } from "@/lib/backend";
import { setFlash } from "@/lib/flash";

function backendErrorMessage(err: unknown): string {
  if (err instanceof BackendError) {
    if (err.body && typeof err.body === "object") {
      const body = err.body as { message?: unknown; error?: unknown };
      if (typeof body.message === "string") return body.message;
      if (Array.isArray(body.message)) return body.message.join(", ");
      if (typeof body.error === "string") return body.error;
    }
    return `Backend respondeu ${err.status}`;
  }
  return (err as Error)?.message ?? "Erro inesperado";
}

export async function updateGlobalConfigAction(formData: FormData) {
  const generalPrompt = String(formData.get("generalPrompt") ?? "").trim();
  try {
    await updateGlobalConfig({ generalPrompt });
  } catch (err) {
    await setFlash(
      "error",
      `Falha ao salvar prompt geral: ${backendErrorMessage(err)}`,
    );
    throw err;
  }
  await setFlash("success", "Prompt geral salvo.");
  revalidatePath("/config");
}
