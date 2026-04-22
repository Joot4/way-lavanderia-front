import Link from "next/link";
import {
  listPayments,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  type PaymentStatus,
} from "@/lib/ops";
import { BackendError } from "@/lib/backend";

const STATUS_OPTIONS: { value: "" | PaymentStatus; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "PENDING", label: "Pendentes" },
  { value: "APPROVED", label: "Aprovados" },
  { value: "PAID", label: "Pagos" },
  { value: "CANCELLED", label: "Cancelados" },
];

export default async function PaymentsPage({
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
          <h1 className="text-2xl font-semibold tracking-tight">Pagamentos</h1>
          <p className="text-sm text-zinc-500">
            Solicitações de pagamento geradas pela IA.
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
          Nenhum pagamento com esse filtro.
        </div>
      ) : (
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-950/40">
              <tr>
                <th className="px-4 py-2 font-medium">Cliente</th>
                <th className="px-4 py-2 font-medium">Lavanderia</th>
                <th className="px-4 py-2 font-medium">Máquina</th>
                <th className="px-4 py-2 font-medium text-right">Valor</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Quando</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.items.map((p) => (
                <tr
                  key={p.id}
                  className="transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {p.conversation.customerName ?? "Sem nome"}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {p.conversation.customerPhone}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {p.tenant.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {p.machine ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatCents(p.amountCents)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs ring-1 ${PAYMENT_STATUS_TONE[p.status]}`}
                      >
                        {PAYMENT_STATUS_LABEL[p.status]}
                      </span>
                      {p.paidAt && (
                        <span className="text-[10px] text-zinc-500">
                          pago em {new Date(p.paidAt).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-zinc-500">
                    {formatRelative(p.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/conversations/${p.conversation.id}`}
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
              pathname: "/payments",
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

async function load(params: { status?: PaymentStatus; cursor?: string }): Promise<
  | {
      kind: "ok";
      items: Awaited<ReturnType<typeof listPayments>>["items"];
      nextCursor: string | null;
    }
  | { kind: "error"; message: string }
> {
  try {
    const data = await listPayments(params);
    return { kind: "ok", items: data.items, nextCursor: data.nextCursor };
  } catch (err) {
    const message =
      err instanceof BackendError ? `HTTP ${err.status}` : (err as Error).message;
    return { kind: "error", message };
  }
}

function isStatus(v: string | undefined): v is PaymentStatus {
  return v === "PENDING" || v === "APPROVED" || v === "PAID" || v === "CANCELLED";
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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
