import Link from "next/link";
import {
  listConversations,
  STATUS_LABEL,
  STATUS_TONE,
  type ConversationStatus,
} from "@/lib/conversations";
import { BackendError } from "@/lib/backend";

const STATUS_OPTIONS: { value: "" | ConversationStatus; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "AI_ACTIVE", label: "IA ativa" },
  { value: "AWAITING_HUMAN", label: "Aguardando humano" },
  { value: "HUMAN_ACTIVE", label: "Humano atendendo" },
  { value: "RESOLVED", label: "Resolvidas" },
];

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; cursor?: string }>;
}) {
  const params = await searchParams;
  const status = isStatus(params.status) ? params.status : undefined;
  const cursor = params.cursor?.trim() || undefined;

  const data = await loadConversations({ status, cursor });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Conversas</h1>
          <p className="text-sm text-zinc-500">
            Histórico multi-tenant das conversas com clientes.
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
          Nenhuma conversa encontrada com esse filtro.
        </div>
      ) : (
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-950/40">
              <tr>
                <th className="px-4 py-2 font-medium">Cliente</th>
                <th className="px-4 py-2 font-medium">Lavanderia</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Última mensagem</th>
                <th className="px-4 py-2 font-medium">Quando</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.items.map((c) => (
                <tr
                  key={c.id}
                  className="transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/conversations/${c.id}`}
                      className="block font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                    >
                      {c.customer.name ?? "Sem nome"}
                    </Link>
                    <div className="text-xs text-zinc-500">
                      {formatPhone(c.customer.whatsappPhone)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {c.tenant.name}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} paused={!!c.aiPausedUntil} />
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {c.lastMessage ? (
                      <span className="flex items-center gap-2">
                        <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          {senderLabel(c.lastMessage.sender)}
                        </span>
                        <span className="line-clamp-1 max-w-md">
                          {c.lastMessage.content}
                        </span>
                      </span>
                    ) : (
                      <em className="text-zinc-400">sem mensagens</em>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-zinc-500">
                    {formatRelative(c.lastMessageAt)}
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
              pathname: "/conversations",
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

function StatusBadge({
  status,
  paused,
}: {
  status: ConversationStatus;
  paused: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs ring-1 ${STATUS_TONE[status]}`}
      >
        {STATUS_LABEL[status]}
      </span>
      {paused && status === "AI_ACTIVE" && (
        <span className="inline-flex w-fit items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700">
          IA pausada
        </span>
      )}
    </div>
  );
}

async function loadConversations(params: {
  status?: ConversationStatus;
  cursor?: string;
}): Promise<
  | { kind: "ok"; items: Awaited<ReturnType<typeof listConversations>>["items"]; nextCursor: string | null }
  | { kind: "error"; message: string }
> {
  try {
    const data = await listConversations({ ...params, limit: 30 });
    return { kind: "ok", items: data.items, nextCursor: data.nextCursor };
  } catch (err) {
    const message =
      err instanceof BackendError
        ? `HTTP ${err.status}`
        : (err as Error).message;
    return { kind: "error", message };
  }
}

function isStatus(v: string | undefined): v is ConversationStatus {
  return (
    v === "AI_ACTIVE" ||
    v === "AWAITING_HUMAN" ||
    v === "HUMAN_ACTIVE" ||
    v === "RESOLVED"
  );
}

function senderLabel(sender: "CUSTOMER" | "AI" | "HUMAN"): string {
  if (sender === "CUSTOMER") return "Cliente";
  if (sender === "AI") return "IA";
  return "Humano";
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) {
    const ddd = digits.slice(2, 4);
    const a = digits.slice(4, 9);
    const b = digits.slice(9, 13);
    return `+55 (${ddd}) ${a}-${b}`;
  }
  if (digits.length === 12 && digits.startsWith("55")) {
    const ddd = digits.slice(2, 4);
    const a = digits.slice(4, 8);
    const b = digits.slice(8, 12);
    return `+55 (${ddd}) ${a}-${b}`;
  }
  return raw;
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const min = 60_000;
  const h = 60 * min;
  const d = 24 * h;
  if (diff < min) return "agora";
  if (diff < h) return `${Math.floor(diff / min)}m`;
  if (diff < d) return `${Math.floor(diff / h)}h`;
  if (diff < 7 * d) return `${Math.floor(diff / d)}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}
