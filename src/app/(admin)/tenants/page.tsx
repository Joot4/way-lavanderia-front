import Link from "next/link";
import {
  listTenants,
  formatCents,
  TENANT_STATUS_LABEL,
  TENANT_STATUS_TONE,
  SUBSCRIPTION_STATUS_LABEL,
  SUBSCRIPTION_STATUS_TONE,
  type SubscriptionSummary,
} from "@/lib/tenants";
import { BackendError } from "@/lib/backend";

export default async function TenantsPage() {
  let rows;
  try {
    rows = await listTenants();
  } catch (err) {
    const message =
      err instanceof BackendError ? `HTTP ${err.status}` : (err as Error).message;
    return (
      <div className="mx-auto max-w-6xl">
        <Header />
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          Não foi possível carregar: {message}
        </div>
      </div>
    );
  }

  const pastDue = rows.filter(
    (t) => t.subscription?.status === "PAST_DUE" || (t.subscription?.overdueDays ?? 0) > 0,
  ).length;
  const active = rows.filter((t) => t.subscription?.status === "ACTIVE").length;
  const trial = rows.filter(
    (t) => t.status === "TRIAL" || t.subscription?.status === "TRIAL",
  ).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Header />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Total" value={rows.length} />
        <Metric label="Em dia" value={active} tone="ok" />
        <Metric label="Em atraso" value={pastDue} tone="warn" />
        <Metric label="Trial" value={trial} tone="info" />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          Nenhuma lavanderia cadastrada. Clique em “Nova lavanderia” para
          começar.
        </div>
      ) : (
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-950/40">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Instância</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Mensalidade</th>
                <th className="px-4 py-2 font-medium">Cobrança</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.map((t) => (
                <tr
                  key={t.id}
                  className="transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {t.name}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {t.counts.conversations} conversas ·{" "}
                      {t.counts.customers} clientes
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {t.whatsappNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${TENANT_STATUS_TONE[t.status]}`}
                    >
                      {TENANT_STATUS_LABEL[t.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                    {t.subscription
                      ? formatCents(t.subscription.monthlyPriceCents)
                      : <span className="text-xs text-zinc-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <BillingCell sub={t.subscription} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/tenants/${t.id}`}
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

function Header() {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lavanderias</h1>
        <p className="text-sm text-zinc-500">
          Clientes do SaaS — controle de assinatura, uso e instância do WhatsApp.
        </p>
      </div>
      <Link
        href="/tenants/new"
        className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        + Nova lavanderia
      </Link>
    </header>
  );
}

function BillingCell({ sub }: { sub: SubscriptionSummary | null }) {
  if (!sub) {
    return (
      <div className="flex flex-col gap-1">
        <span className="inline-flex w-fit items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700">
          Sem assinatura
        </span>
      </div>
    );
  }
  const overdue = sub.overdueDays > 0;
  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs ring-1 ${SUBSCRIPTION_STATUS_TONE[sub.status]}`}
      >
        {SUBSCRIPTION_STATUS_LABEL[sub.status]}
      </span>
      <div className="text-xs text-zinc-500">
        {sub.nextDueAt ? (
          <>
            Vence em {new Date(sub.nextDueAt).toLocaleDateString("pt-BR")}
            {overdue && (
              <span className="ml-1 font-medium text-red-600 dark:text-red-400">
                ({sub.overdueDays}d atrasado)
              </span>
            )}
          </>
        ) : (
          "sem vencimento"
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "ok" | "warn" | "info";
}) {
  const tones: Record<string, string> = {
    neutral: "text-zinc-900 dark:text-zinc-100",
    ok: "text-emerald-600 dark:text-emerald-400",
    warn: "text-red-600 dark:text-red-400",
    info: "text-sky-600 dark:text-sky-400",
  };
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${tones[tone]}`}>
        {value}
      </div>
    </div>
  );
}
