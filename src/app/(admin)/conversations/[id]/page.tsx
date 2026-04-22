import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getConversation,
  STATUS_LABEL,
  STATUS_TONE,
  type ConversationDetail,
} from "@/lib/conversations";
import { BackendError } from "@/lib/backend";
import { pauseAi, resumeAi, reactivateAi, escalate } from "./actions";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let conv: ConversationDetail;
  try {
    conv = await getConversation(id);
  } catch (err) {
    if (err instanceof BackendError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const paused = !!conv.aiPausedUntil && new Date(conv.aiPausedUntil) > new Date();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/conversations"
          className="text-xs text-zinc-500 hover:underline"
        >
          ← Voltar para conversas
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {conv.customer.name ?? "Cliente sem nome"}
          </h1>
          <div className="mt-1 text-sm text-zinc-500">
            {formatPhone(conv.customer.whatsappPhone)} · {conv.tenant.name}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${STATUS_TONE[conv.status]}`}
            >
              {STATUS_LABEL[conv.status]}
            </span>
            {paused && (
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700">
                IA pausada até {formatDateTime(conv.aiPausedUntil!)}
              </span>
            )}
          </div>
        </div>

        <ActionBar
          id={conv.id}
          status={conv.status}
          paused={paused}
        />
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-medium text-zinc-500">Mensagens</h2>
        {conv.messages.length === 0 ? (
          <div className="py-8 text-center text-sm text-zinc-500">
            Ainda sem mensagens nessa conversa.
          </div>
        ) : (
          <ol className="space-y-3">
            {conv.messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function ActionBar({
  id,
  status,
  paused,
}: {
  id: string;
  status: ConversationDetail["status"];
  paused: boolean;
}) {
  const isAwaitingOrHumanActive =
    status === "AWAITING_HUMAN" || status === "HUMAN_ACTIVE";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "AI_ACTIVE" && !paused && (
        <>
          <ActionForm action={pauseAi.bind(null, id, 60)} label="Pausar IA 1h" />
          <ActionForm
            action={pauseAi.bind(null, id, 60 * 24)}
            label="Pausar IA 24h"
            variant="ghost"
          />
          <ActionForm action={escalate.bind(null, id)} label="Escalar" variant="warn" />
        </>
      )}
      {status === "AI_ACTIVE" && paused && (
        <>
          <ActionForm action={resumeAi.bind(null, id)} label="Retomar IA" variant="primary" />
          <ActionForm action={escalate.bind(null, id)} label="Escalar" variant="warn" />
        </>
      )}
      {isAwaitingOrHumanActive && (
        <ActionForm
          action={reactivateAi.bind(null, id)}
          label="Reativar IA"
          variant="primary"
        />
      )}
    </div>
  );
}

function ActionForm({
  action,
  label,
  variant = "default",
}: {
  action: () => Promise<void>;
  label: string;
  variant?: "default" | "primary" | "warn" | "ghost";
}) {
  const base =
    "rounded-md px-3 py-1.5 text-xs font-medium transition disabled:opacity-50";
  const styles: Record<NonNullable<typeof variant>, string> = {
    default:
      "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700",
    primary:
      "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200",
    warn: "bg-amber-600 text-white hover:bg-amber-500",
    ghost:
      "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
  };
  return (
    <form action={action}>
      <button type="submit" className={`${base} ${styles[variant]}`}>
        {label}
      </button>
    </form>
  );
}

function MessageBubble({
  message,
}: {
  message: ConversationDetail["messages"][number];
}) {
  const isCustomer = message.sender === "CUSTOMER";
  const align = isCustomer ? "justify-start" : "justify-end";
  const tone =
    message.sender === "CUSTOMER"
      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
      : message.sender === "AI"
        ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-900"
        : "bg-sky-50 text-sky-900 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-100 dark:ring-sky-900";

  return (
    <li className={`flex ${align}`}>
      <div className="max-w-[75%]">
        <div
          className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${tone}`}
        >
          {message.content}
        </div>
        <div
          className={`mt-1 text-[10px] text-zinc-500 ${isCustomer ? "text-left" : "text-right"}`}
        >
          {senderLabel(message.sender)} · {formatDateTime(message.createdAt)}
        </div>
      </div>
    </li>
  );
}

function senderLabel(sender: "CUSTOMER" | "AI" | "HUMAN"): string {
  if (sender === "CUSTOMER") return "Cliente";
  if (sender === "AI") return "IA";
  return "Atendente";
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

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
