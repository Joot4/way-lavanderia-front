"use server";

import { revalidatePath } from "next/cache";
import { backendFetch } from "@/lib/backend";

async function postAction(id: string, path: string, body?: unknown) {
  const res = await backendFetch(
    `/admin/conversations/${encodeURIComponent(id)}${path}`,
    {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`backend ${res.status}: ${text.slice(0, 200)}`);
  }
  revalidatePath(`/conversations/${id}`);
  revalidatePath("/conversations");
}

export async function pauseAi(id: string, minutes: number) {
  await postAction(id, "/pause", { minutes });
}

export async function resumeAi(id: string) {
  await postAction(id, "/resume");
}

export async function reactivateAi(id: string) {
  await postAction(id, "/reactivate-ai");
}

export async function escalate(id: string) {
  await postAction(id, "/escalate");
}
