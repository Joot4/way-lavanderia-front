import Link from "next/link";
import { BackendError } from "@/lib/backend";
import { getDashboardSummary, type DashboardActionRow, type DashboardSummary } from "@/lib/dashboard";
import { formatCents } from "@/lib/tenants";

export default async function DashboardPage() {
  let data: DashboardSummary;
  try {
    data = await getDashboardSummary();
  } catch (err) {
    const message =
      err instanceof BackendError ? `HTTP ${err.status}` : (err as Error).message;
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Header />
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          Não foi possível carregar o dashboard: {message}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Header />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card
          label="MRR"
          value={formatCents(data.mrrCents)}
          hint={`${data.activeCount} ${data.activeCount === 1 ? "assinatura ativa" : "assinaturas ativas"}`}
          tone="ok"
        />
        <Card
          label="Inadimplência"
          value={data.overdueCount.toString()}
          hint={
            data.overdueCount === 0
              ? "nenhuma em atraso"
              : `${formatCents(data.overdueAmountCents)} em aberto`
          }
          tone={data.overdueCount > 0 ? "warn" : "neutral"}
        />
        <Card
          label="Trials"
          value={data.trialCount.toString()}
          hint={
            data.trialExpiringSoonCount > 0
              ? `${data.trialExpiringSoonCount} vence${data.trialExpiringSoonCount === 1 ? "" : "m"} em até 7 dias`
              : "nenhum vencendo em breve"
          }
          tone={data.trialExpiringSoonCount > 0 ? "info" : "neutral"}
        />
        <Card
          label="Recebido no mês"
          value={formatCents(data.receivedThisMonthCents)}
          hint={new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          tone="neutral"
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-medium">Ação necessária</h2>
          <span className="text-xs text-zinc-500">
            {data.actionRequired.length} pendente{data.actionRequired.length === 1 ? "" : "s"}
          </span>
        </header>
        {data.actionRequired.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-zinc-500">
            Tudo em dia. Nenhum tenant precisa de atenção agora.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-950/40">
              <tr>
                <th className="px-4 py-2 font-medium">Lavanderia</th>
                <th className="px-4 py-2 font-medium">Motivo</th>
                <th className="px-4 py-2 font-medium">Valor</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.actionRequired.map((row) => (
                <ActionRow key={row.tenantId} row={row} />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-sm text-zinc-500">Saúde financeira do SaaS em tempo real.</p>
    </div>
  );
}

type Tone = "neutral" | "ok" | "warn" | "info";

function Card({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: Tone;
}) {
  const valueTone: Record<Tone, string> = {
    neutral: "text-zinc-900 dark:text-zinc-100",
    ok: "text-emerald-600 dark:text-emerald-400",
    warn: "text-red-600 dark:text-red-400",
    info: "text-sky-600 dark:text-sky-400",
  };
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${valueTone[tone]}`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-zinc-500">{hint}</div>
    </div>
  );
}

function ActionRow({ row }: { row: DashboardActionRow }) {
  return (
    <tr className="transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
      <td className="px-4 py-3">
        <div className="font-medium text-zinc-900 dark:text-zinc-100">{row.tenantName}</div>
      </td>
      <td className="px-4 py-3">
        {row.reason === "OVERDUE" ? (
          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-800">
            Em atraso {row.overdueDays > 0 && `· ${row.overdueDays}d`}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800">
            Trial vence
            {row.trialEndsAt &&
              ` ${new Date(row.trialEndsAt).toLocaleDateString("pt-BR")}`}
          </span>
        )}
      </td>
      <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
        {formatCents(row.monthlyPriceCents)}
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/tenants/${row.tenantId}`}
          className="text-xs font-medium text-zinc-700 hover:underline dark:text-zinc-300"
        >
          Gerenciar →
        </Link>
      </td>
    </tr>
  );
}
