import { backendJson, BackendError } from "@/lib/backend";

type PingResponse = { ok: boolean; service: string; now: string };

async function fetchPing(): Promise<
  | { kind: "ok"; data: PingResponse }
  | { kind: "error"; message: string }
> {
  try {
    const data = await backendJson<PingResponse>("/admin/ping");
    return { kind: "ok", data };
  } catch (err) {
    const message =
      err instanceof BackendError
        ? `HTTP ${err.status} — ${JSON.stringify(err.body).slice(0, 200)}`
        : (err as Error).message;
    return { kind: "error", message };
  }
}

export default async function DashboardPage() {
  const ping = await fetchPing();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-500">
          Visão geral do Lavanderia AI. Métricas em breve.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">Backend</h2>
        {ping.kind === "ok" ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium">
                Conectado — {ping.data.service}
              </span>
            </div>
            <div className="text-xs text-zinc-500">
              Última resposta: {new Date(ping.data.now).toLocaleString("pt-BR")}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
              <span className="text-sm font-medium">Offline</span>
            </div>
            <div className="text-xs text-zinc-500">{ping.message}</div>
          </div>
        )}
      </section>
    </div>
  );
}
