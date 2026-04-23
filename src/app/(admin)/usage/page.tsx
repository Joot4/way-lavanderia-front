import Link from "next/link";
import { BackendError } from "@/lib/backend";
import { formatTokens, formatUsd, getUsageByTenant, type UsageByTenantResponse } from "@/lib/usage";

type PageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function UsagePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedMonth = params.month ?? currentMonth();

  let data: UsageByTenantResponse;
  try {
    data = await getUsageByTenant(selectedMonth);
  } catch (err) {
    const message =
      err instanceof BackendError ? `HTTP ${err.status}` : (err as Error).message;
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Header month={selectedMonth} />
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          Não foi possível carregar: {message}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Header month={selectedMonth} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Mensagens" value={data.totals.messageCount.toLocaleString("pt-BR")} />
        <Metric label="Tokens in" value={formatTokens(data.totals.inputTokens)} />
        <Metric label="Tokens out" value={formatTokens(data.totals.outputTokens)} />
        <Metric label="Custo IA" value={formatUsd(data.totals.costUsd)} tone="warn" />
      </div>

      {data.rows.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          Sem atividade nesse mês.
        </div>
      ) : (
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-950/40">
              <tr>
                <th className="px-4 py-2 font-medium">Lavanderia</th>
                <th className="px-4 py-2 font-medium">Mensagens</th>
                <th className="px-4 py-2 font-medium">Conversas</th>
                <th className="px-4 py-2 font-medium">Tokens in / out</th>
                <th className="px-4 py-2 font-medium">Custo IA</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.rows.map((r) => (
                <tr
                  key={r.tenantId}
                  className="transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {r.tenantName}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {r.inboundMessageCount} recebidas · {r.outboundMessageCount} enviadas
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {r.messageCount.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{r.conversationCount}</td>
                  <td className="px-4 py-3 tabular-nums text-xs text-zinc-600 dark:text-zinc-400">
                    {formatTokens(r.inputTokens)} / {formatTokens(r.outputTokens)}
                  </td>
                  <td className="px-4 py-3 tabular-nums font-medium">
                    {formatUsd(r.costUsd)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/tenants/${r.tenantId}`}
                      className="text-xs font-medium text-zinc-700 hover:underline dark:text-zinc-300"
                    >
                      Gerenciar →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function Header({ month }: { month: string }) {
  const options = lastNMonths(12);
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Uso por lavanderia</h1>
        <p className="text-sm text-zinc-500">
          Volume de mensagens, tokens de IA e custo real por tenant.
        </p>
      </div>
      <form method="get" className="flex items-center gap-2">
        <label htmlFor="month" className="text-xs text-zinc-500">
          Mês
        </label>
        <select
          id="month"
          name="month"
          defaultValue={month}
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white dark:bg-white dark:text-zinc-900"
        >
          Aplicar
        </button>
      </form>
    </header>
  );
}

type MetricTone = "neutral" | "warn";
function Metric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: MetricTone }) {
  const toneClass =
    tone === "warn"
      ? "text-amber-600 dark:text-amber-400"
      : "text-zinc-900 dark:text-zinc-100";
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function lastNMonths(n: number): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const value = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    out.push({ value, label });
  }
  return out;
}
