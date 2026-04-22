import Link from "next/link";
import {
  listComplaints,
  COMPLAINT_STATUS_LABEL,
  COMPLAINT_STATUS_TONE,
  type ComplaintStatus,
} from "@/lib/ops";
import { BackendError } from "@/lib/backend";

const STATUS_OPTIONS: { value: "" | ComplaintStatus; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "OPEN", label: "Abertas" },
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "RESOLVED", label: "Resolvidas" },
  { value: "CLOSED", label: "Fechadas" },
];

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; cursor?: string }>;
}) {
  const params = await searchParams;
  const status = isStatus(params.status) ? params.status : undefined;
  const cursor = params.cursor?.trim() || undefined;

  const data = await load({ status, cursor });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reclamações</h1>
          <p className="text-sm text-zinc-500">
            Problemas relatados pelos clientes durante o atendimento.
          </p>
        </div>
        <form className="flex items-center gap-2">
          <label className="text-xs text-zinc-500" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Filtrar
          </button>
        </form>
      </header>

      {data.kind === "error" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          Não foi possível carregar: {data.message}
        </div>
      ) : data.items.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          Nenhuma reclamação com esse filtro.
        </div>
      ) : (
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-950/40">
              <tr>
                <th className="px-4 py-2 font-medium">Cliente</th>
                <th className="px-4 py-2 font-medium">Lavanderia</th>
                <th className="px-4 py-2 font-medium">Categoria</th>
                <th className="px-4 py-2 font-medium">Descrição</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Quando</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.items.map((c) => (
                <tr
                  key={c.id}
                  className="transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {c.conversation.customerName ?? "Sem nome"}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {c.conversation.customerPhone}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {c.tenant.name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.category}</div>
                    {c.machine && (
                      <div className="text-xs text-zinc-500">
                        Máquina {c.machine}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-md">
                    <p className="line-clamp-2 text-zinc-700 dark:text-zinc-300">
                      {c.description}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${COMPLAINT_STATUS_TONE[c.status]}`}
                    >
                      {COMPLAINT_STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-zinc-500">
                    {formatRelative(c.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/conversations/${c.conversation.id}`}
                      className="text-xs font-medium text-zinc-700 hover:underline dark:text-zinc-300"
                    >
                      Conversa →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {data.kind === "ok" && data.nextCursor && (
        <div className="flex justify-center">
          <Link
            href={{
              pathname: "/complaints",
              query: {
                ...(status ? { status } : {}),
                cursor: data.nextCursor,
              },
            }}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Carregar mais
          </Link>
        </div>
      )}
    </div>
  );
}

async function load(params: { status?: ComplaintStatus; cursor?: string }): Promise<
  | {
      kind: "ok";
      items: Awaited<ReturnType<typeof listComplaints>>["items"];
      nextCursor: string | null;
    }
  | { kind: "error"; message: string }
> {
  try {
    const data = await listComplaints(params);
    return { kind: "ok", items: data.items, nextCursor: data.nextCursor };
  } catch (err) {
    const message =
      err instanceof BackendError ? `HTTP ${err.status}` : (err as Error).message;
    return { kind: "error", message };
  }
}

function isStatus(v: string | undefined): v is ComplaintStatus {
  return v === "OPEN" || v === "IN_PROGRESS" || v === "RESOLVED" || v === "CLOSED";
}

function formatRelative(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = 60_000;
  const h = 60 * min;
  const d = 24 * h;
  if (diff < min) return "agora";
  if (diff < h) return `${Math.floor(diff / min)}m`;
  if (diff < d) return `${Math.floor(diff / h)}h`;
  if (diff < 7 * d) return `${Math.floor(diff / d)}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}
