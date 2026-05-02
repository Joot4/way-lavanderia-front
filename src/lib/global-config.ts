import "server-only";
import { backendFetch, backendJson, BackendError } from "./backend";

export type GlobalConfig = {
  id: string;
  generalPrompt: string;
  createdAt: string;
  updatedAt: string;
};

export function getGlobalConfig(): Promise<GlobalConfig> {
  return backendJson<GlobalConfig>("/admin/config");
}

export async function updateGlobalConfig(input: {
  generalPrompt: string;
}): Promise<void> {
  const res = await backendFetch("/admin/config", {
    method: "PUT",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      // keep as text
    }
    throw new BackendError(
      `PUT /admin/config -> ${res.status}`,
      res.status,
      body,
    );
  }
}
