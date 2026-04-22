import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTenant,
  listTenantPayments,
  TENANT_STATUS_LABEL,
  TENANT_STATUS_TONE,
  SUBSCRIPTION_STATUS_LABEL,
  SUBSCRIPTION_STATUS_TONE,
  formatCents,
  type TenantDetail,
  type SubscriptionPaymentRow,
} from "@/lib/tenants";
import {
  findInstance,
  getInstanceQr,
  instanceStatusLabel,
  type EvolutionInstance,
  type EvolutionQr,
} from "@/lib/instances";
import { BackendError } from "@/lib/backend";
import {
  deleteTenantAction,
  recordPaymentAction,
  updateTenantStatusAction,
  upsertSubscriptionAction,
} from "../actions";
import {
  createInstanceAction,
  deleteInstanceAction,
  logoutInstanceAction,
} from "./instance-actions";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let t: TenantDetail;
  try {
    t = await getTenant(id);
  } catch (err) {
    if (err instanceof BackendError && err.status === 404) notFound();
    throw err;
  }

  const [paymentsResult, instanceResult] = await Promise.allSettled([
    listTenantPayments(id),
    findInstance(t.whatsappNumber),
  ]);

  const payments: SubscriptionPaymentRow[] =
    paymentsResult.status === "fulfilled" ? paymentsResult.value : [];

  let instance: EvolutionInstance | null = null;
  let instanceError: string | null = null;
  if (instanceResult.status === "fulfilled") {
    instance = instanceResult.value;
  } else {
    const err = instanceResult.reason as unknown;
    instanceError =
      err instanceof BackendError
        ? `HTTP ${err.status} — verifique EVOLUTION_URL/EVOLUTION_API_KEY`
        : (err as Error).message;
  }

  let qr: EvolutionQr | null = null;
  if (instance && instance.status.toLowerCase() !== "open") {
    qr = await getInstanceQr(instance.name);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href="/tenants"
          className="text-xs text-zinc-500 hover:underline"
        >
          ← Voltar para lavanderias
        </Link>
      </div>

      <header className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{t.name}</h1>
            <div className="mt-1 text-sm text-zinc-500">
              WhatsApp: <span className="font-mono">{t.whatsappNumber}</span> · {t.timezone}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${TENANT_STATUS_TONE[t.status]}`}
              >
                {TENANT_STATUS_LABEL[t.status]}
              </span>
              {t.subscription && (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${SUBSCRIPTION_STATUS_TONE[t.subscription.status]}`}
                >
                  Assinatura: {SUBSCRIPTION_STATUS_LABEL[t.subscription.status]}
                </span>
              )}
              <span className="text-xs text-zinc-500">
                criado em {new Date(t.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>

          <TenantStatusActions id={t.id} status={t.status} />
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <SubscriptionSection
          id={t.id}
          subscription={t.subscription}
          payments={payments}
        />
        <MetricsSection t={t} />
      </div>

      <InstanceSection
        tenantId={t.id}
        instanceName={t.whatsappNumber}
        instance={instance}
        qr={qr}
        error={instanceError}
      />
      <ConfigSection t={t} />
      <PricesSection t={t} />
      <UsersSection t={t} />
      {t.integrations.length > 0 && <IntegrationsSection t={t} />}
      <DangerZone id={t.id} />
    </div>
  );
}

function TenantStatusActions({
  id,
  status,
}: {
  id: string;
  status: TenantDetail["status"];
}) {
  const setStatus = updateTenantStatusAction.bind(null, id);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "ACTIVE" && (
        <form action={setStatus.bind(null, "ACTIVE")}>
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500"
          >
            Marcar como ativa
          </button>
        </form>
      )}
      {status !== "SUSPENDED" && (
        <form action={setStatus.bind(null, "SUSPENDED")}>
          <button
            type="submit"
            className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-500"
          >
            Suspender
          </button>
        </form>
      )}
      {status === "SUSPENDED" && (
        <form action={setStatus.bind(null, "TRIAL")}>
          <button
            type="submit"
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Voltar pra trial
          </button>
        </form>
      )}
    </div>
  );
}

function MetricsSection({ t }: { t: TenantDetail }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-sm font-medium text-zinc-500">Uso</h2>
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Conversas" value={t._count.conversations} />
        <Metric label="Clientes" value={t._count.customers} />
        <Metric label="Reclamações" value={t._count.complaints} />
        <Metric label="Pagamentos" value={t._count.payments} />
      </div>
    </section>
  );
}

function SubscriptionSection({
  id,
  subscription,
  payments,
}: {
  id: string;
  subscription: TenantDetail["subscription"];
  payments: SubscriptionPaymentRow[];
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-sm font-medium text-zinc-500">Assinatura</h2>

      {subscription ? (
        <dl className="mb-4 grid grid-cols-2 gap-y-3 text-sm">
          <dt className="text-xs text-zinc-500">Mensalidade</dt>
          <dd className="tabular-nums font-medium">
            {formatCents(subscription.monthlyPriceCents)}
          </dd>

          <dt className="text-xs text-zinc-500">Dia do vencimento</dt>
          <dd>dia {subscription.dueDay}</dd>

          <dt className="text-xs text-zinc-500">Próximo vencimento</dt>
          <dd>
            {subscription.nextDueAt
              ? new Date(subscription.nextDueAt).toLocaleDateString("pt-BR")
              : "—"}
            {subscription.overdueDays > 0 && (
              <span className="ml-1 text-xs font-medium text-red-600 dark:text-red-400">
                ({subscription.overdueDays}d atrasado)
              </span>
            )}
          </dd>

          <dt className="text-xs text-zinc-500">Último pagamento</dt>
          <dd>
            {subscription.lastPaidAt
              ? new Date(subscription.lastPaidAt).toLocaleDateString("pt-BR")
              : "—"}
          </dd>
        </dl>
      ) : (
        <p className="mb-4 text-sm text-zinc-500">
          Sem assinatura configurada ainda.
        </p>
      )}

      <details className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/40">
        <summary className="cursor-pointer font-medium text-zinc-700 dark:text-zinc-300">
          {subscription ? "Editar assinatura" : "Configurar assinatura"}
        </summary>
        <form
          action={upsertSubscriptionAction.bind(null, id)}
          className="mt-3 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <LabeledInput
              label="Mensalidade (R$)"
              name="monthlyPrice"
              defaultValue={
                subscription
                  ? (subscription.monthlyPriceCents / 100)
                      .toFixed(2)
                      .replace(".", ",")
                  : ""
              }
              placeholder="99,00"
              inputMode="decimal"
              required
            />
            <LabeledInput
              label="Dia do vencimento"
              name="dueDay"
              type="number"
              min={1}
              max={28}
              defaultValue={String(subscription?.dueDay ?? 5)}
              required
            />
          </div>
          <LabeledSelect
            label="Status"
            name="status"
            defaultValue={subscription?.status ?? "TRIAL"}
            options={[
              { value: "TRIAL", label: "Trial" },
              { value: "ACTIVE", label: "Em dia" },
              { value: "PAST_DUE", label: "Atrasada" },
              { value: "CANCELED", label: "Cancelada" },
            ]}
          />
          <LabeledTextarea
            label="Notas (interno)"
            name="notes"
            rows={2}
            defaultValue={subscription?.notes ?? ""}
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Salvar
          </button>
        </form>
      </details>

      {subscription && (
        <details className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/40">
          <summary className="cursor-pointer font-medium text-zinc-700 dark:text-zinc-300">
            Registrar pagamento
          </summary>
          <form
            action={recordPaymentAction.bind(null, id)}
            className="mt-3 space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <LabeledInput
                label="Valor (R$)"
                name="amount"
                defaultValue={(subscription.monthlyPriceCents / 100)
                  .toFixed(2)
                  .replace(".", ",")}
                placeholder="99,00"
                inputMode="decimal"
                required
              />
              <LabeledSelect
                label="Método"
                name="method"
                defaultValue="PIX"
                options={[
                  { value: "PIX", label: "Pix" },
                  { value: "BOLETO", label: "Boleto" },
                  { value: "TRANSFER", label: "Transferência" },
                  { value: "MANUAL", label: "Outro / manual" },
                ]}
              />
            </div>
            <LabeledInput
              label="Data do pagamento (opcional)"
              name="paidAt"
              type="date"
            />
            <LabeledInput
              label="Nota (opcional)"
              name="note"
              placeholder="Ex: pago via pix, comprovante enviado por WhatsApp"
            />
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500"
            >
              Registrar
            </button>
          </form>
        </details>
      )}

      {payments.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Histórico
          </h3>
          <ul className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
            {payments.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium tabular-nums">
                    {formatCents(p.amountCents)}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {new Date(p.paidAt).toLocaleDateString("pt-BR")} · {p.method}
                  </div>
                </div>
                {p.note && (
                  <div className="max-w-[50%] truncate text-xs text-zinc-500">
                    {p.note}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ConfigSection({ t }: { t: TenantDetail }) {
  if (!t.config) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-2 text-sm font-medium text-zinc-500">Configuração</h2>
        <p className="text-sm text-zinc-500">
          Essa lavanderia ainda não tem <code>TenantConfig</code>.
        </p>
      </section>
    );
  }
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-sm font-medium text-zinc-500">Configuração</h2>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm md:grid-cols-2">
        <Field label="WhatsApp do dono" value={t.config.ownerWhatsapp} />
        <Field
          label="Atendente humano"
          value={t.config.humanAttendantPhone ?? "—"}
        />
        <Field label="Endereço" value={t.config.address ?? "—"} />
        <Field
          label="Horário de funcionamento"
          value={formatJson(t.config.openingHours)}
          multiline
        />
        <Field
          label="Horário de atendimento humano"
          value={formatJson(t.config.humanSupportHours)}
          multiline
        />
        <Field
          label="Customização do prompt"
          value={formatJson(t.config.promptCustomization)}
          multiline
          wide
        />
      </dl>
    </section>
  );
}

function PricesSection({ t }: { t: TenantDetail }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-500">Tabela de preços</h2>
        <span className="text-xs text-zinc-500">{t.priceItems.length} itens</span>
      </header>
      {t.priceItems.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-zinc-500">
          Nenhum item cadastrado.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-5 py-2 font-medium">Nome</th>
              <th className="px-5 py-2 font-medium">Unidade</th>
              <th className="px-5 py-2 font-medium text-right">Preço</th>
              <th className="px-5 py-2 font-medium">Ativo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {t.priceItems.map((p) => (
              <tr key={p.id} className={p.active ? "" : "opacity-60"}>
                <td className="px-5 py-2">
                  <div className="font-medium">{p.name}</div>
                  {p.description && (
                    <div className="text-xs text-zinc-500">{p.description}</div>
                  )}
                </td>
                <td className="px-5 py-2 text-zinc-500">{p.unit ?? "—"}</td>
                <td className="px-5 py-2 text-right tabular-nums">
                  {formatCents(p.priceCents)}
                </td>
                <td className="px-5 py-2">
                  {p.active ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800">
                      sim
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700">
                      não
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function UsersSection({ t }: { t: TenantDetail }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-500">Usuários</h2>
        <span className="text-xs text-zinc-500">{t.users.length} pessoas</span>
      </header>
      {t.users.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-zinc-500">
          Nenhum usuário cadastrado.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {t.users.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between px-5 py-3 text-sm"
            >
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-zinc-500">{u.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {u.role}
                </span>
                {!u.active && (
                  <span className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                    inativo
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function IntegrationsSection({ t }: { t: TenantDetail }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 text-sm font-medium text-zinc-500">Integrações</h2>
      <div className="flex flex-wrap gap-2">
        {t.integrations.map((i) => (
          <span
            key={i.id}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ring-1 ${
              i.enabled
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800"
                : "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700"
            }`}
          >
            {i.kind}
            <span className="text-[10px] uppercase tracking-wide opacity-75">
              {i.enabled ? "on" : "off"}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}

function InstanceSection({
  tenantId,
  instanceName,
  instance,
  qr,
  error,
}: {
  tenantId: string;
  instanceName: string;
  instance: EvolutionInstance | null;
  qr: EvolutionQr | null;
  error: string | null;
}) {
  if (error) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/20">
        <h2 className="text-sm font-medium text-amber-800 dark:text-amber-200">
          Instância Evolution
        </h2>
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
          Não foi possível falar com a Evolution: {error}
        </p>
      </section>
    );
  }

  if (!instance) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500">
            Instância Evolution
          </h2>
          <span className="text-xs text-zinc-400">{instanceName}</span>
        </header>
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
          Ainda não existe uma instância no Evolution com esse nome. Crie agora
          e em seguida escaneie o QR Code com o WhatsApp do cliente.
        </p>
        <form
          action={createInstanceAction.bind(null, tenantId, instanceName)}
        >
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Criar instância
          </button>
        </form>
      </section>
    );
  }

  const statusInfo = instanceStatusLabel(instance.status);
  const isConnected = instance.status.toLowerCase() === "open";

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-zinc-500">
          Instância Evolution
        </h2>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-zinc-500">{instance.name}</span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${statusInfo.tone}`}
          >
            {statusInfo.label}
          </span>
        </div>
      </header>

      {isConnected ? (
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-xs text-zinc-500">Número conectado: </span>
            <span className="font-mono">{instance.ownerJid ?? "—"}</span>
          </div>
          {instance.profileName && (
            <div>
              <span className="text-xs text-zinc-500">Perfil: </span>
              {instance.profileName}
            </div>
          )}
        </div>
      ) : qr?.base64 ? (
        <div className="flex flex-col items-center gap-3">
          <Image
            src={qr.base64}
            alt="QR Code para conectar o WhatsApp"
            width={224}
            height={224}
            unoptimized
            className="rounded border border-zinc-200 bg-white p-2 dark:border-zinc-700"
          />
          <p className="text-center text-xs text-zinc-500">
            Abra o WhatsApp no celular do cliente → Dispositivos Conectados →
            Conectar dispositivo, e escaneie o QR.
          </p>
          {qr.pairingCode && (
            <p className="text-xs text-zinc-500">
              Código de pareamento: <span className="font-mono">{qr.pairingCode}</span>
            </p>
          )}
        </div>
      ) : qr?.code ? (
        <div className="rounded-lg bg-zinc-100 p-3 font-mono text-xs break-all dark:bg-zinc-800">
          {qr.code}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          QR ainda não disponível. Recarregue em alguns segundos.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        {!isConnected && (
          <Link
            href={`/tenants/${tenantId}?r=${Date.now()}`}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Recarregar QR
          </Link>
        )}
        {isConnected && (
          <form
            action={logoutInstanceAction.bind(null, tenantId, instance.name)}
          >
            <button
              type="submit"
              className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50 dark:border-amber-800 dark:bg-zinc-900 dark:text-amber-300 dark:hover:bg-amber-950/40"
            >
              Desconectar WhatsApp
            </button>
          </form>
        )}
        <form
          action={deleteInstanceAction.bind(null, tenantId, instance.name)}
        >
          <button
            type="submit"
            className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-red-950/40"
          >
            Deletar instância
          </button>
        </form>
      </div>
    </section>
  );
}

function DangerZone({ id }: { id: string }) {
  return (
    <section className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/20">
      <h2 className="mb-2 text-sm font-medium text-red-700 dark:text-red-300">
        Zona de perigo
      </h2>
      <p className="mb-3 text-xs text-red-700 dark:text-red-300">
        Excluir a lavanderia remove conversas, mensagens, preços, clientes,
        reclamações e pagamentos. Ação irreversível.
      </p>
      <form action={deleteTenantAction.bind(null, id)}>
        <button
          type="submit"
          className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
        >
          Excluir lavanderia
        </button>
      </form>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Field({
  label,
  value,
  multiline,
  wide,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd
        className={`mt-1 text-zinc-800 dark:text-zinc-200 ${multiline ? "whitespace-pre-wrap font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function LabeledInput({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1">
      <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </div>
      <input
        {...props}
        className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm shadow-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      />
    </label>
  );
}

function LabeledSelect({
  label,
  options,
  ...props
}: {
  label: string;
  options: { value: string; label: string }[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block space-y-1">
      <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </div>
      <select
        {...props}
        className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm shadow-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function LabeledTextarea({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block space-y-1">
      <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </div>
      <textarea
        {...props}
        className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm shadow-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      />
    </label>
  );
}

function formatJson(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
