import Link from "next/link";
import {
  listConversations,
  STATUS_LABEL,
  STATUS_TONE,
} from "@/lib/conversations";
import { BackendError } from "@/lib/backend";

export default async function EscalationsPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const params = await searchParams;
  const cursor = params.cursor?.trim() || undefined;
  const data = await loadQueue(cursor);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Fila humana</h1>
        <p className="text-sm text-zinc-500">
          Conversas aguardando ou em atendimento humano.
        </p>
      </header>

      {data.kind === "error" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          Não foi possível carregar: {data.message}
        </div>
      ) : data.items.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          Nenhuma conversa na fila. Tudo sob controle.
        </div>
      ) : (
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-950/40">
              <tr>
                <th className="px-4 py-2 font-medium">Cliente</th>
                <th className="px-4 py-2 font-medium">Lavanderia</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Aguardando há</th>
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
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {c.customer.name ?? "Sem nome"}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {formatPhone(c.customer.whatsappPhone)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {c.tenant.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${STATUS_TONE[c.status]}`}
                    >
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-zinc-500">
                    {formatRelative(c.lastMessageAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/conversations/${c.id}`}
                      className="text-xs font-medium text-zinc-700 hover:underline dark:text-zinc-300"
                    >
                      Abrir →
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
            href={{ pathname: "/escalations", query: { cursor: data.nextCursor } }}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Carregar mais
          </Link>
        </div>
      )}
    </div>
  );
}

async function loadQueue(cursor?: string): Promise<
  | {
      kind: "ok";
      items: Awaited<ReturnType<typeof listConversations>>["items"];
      nextCursor: string | null;
    }
  | { kind: "error"; message: string }
> {
  try {
    const data = await listConversations({
      status: ["AWAITING_HUMAN", "HUMAN_ACTIVE"],
      cursor,
      limit: 30,
    });
    return { kind: "ok", items: data.items, nextCursor: data.nextCursor };
  } catch (err) {
    const message =
      err instanceof BackendError ? `HTTP ${err.status}` : (err as Error).message;
    return { kind: "error", message };
  }
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 12 && digits.startsWith("55")) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  return raw;
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
