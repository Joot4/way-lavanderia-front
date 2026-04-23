import Link from "next/link";
import { createTenantAction } from "../actions";
import { SubmitButton } from "@/components/submit-button";

export default function NewTenantPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/tenants"
          className="text-xs text-zinc-500 hover:underline"
        >
          ← Voltar
        </Link>
      </div>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Nova lavanderia
        </h1>
        <p className="text-sm text-zinc-500">
          Cadastre um cliente novo. A instância do WhatsApp é criada
          automaticamente — ao salvar, você já vê o QR pra conectar.
        </p>
      </header>

      <form
        action={createTenantAction}
        className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <Section title="Identificação">
          <Field label="Nome da lavanderia" name="name" required placeholder="Ex: LavExpress Jardim" />
          <Field
            label="Instância / número do WhatsApp"
            name="instanceName"
            required
            placeholder="Ex: lavexpress-jardim ou 551199999999"
            hint="Esse é o identificador único usado pela Evolution e tem que bater com a instância que você vai criar."
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Status"
              name="status"
              defaultValue="TRIAL"
              options={[
                { value: "TRIAL", label: "Trial" },
                { value: "ACTIVE", label: "Ativa" },
                { value: "SUSPENDED", label: "Suspensa" },
              ]}
            />
            <Field
              label="Timezone"
              name="timezone"
              defaultValue="America/Sao_Paulo"
            />
          </div>
        </Section>

        <Section title="Contato">
          <Field
            label="WhatsApp do dono"
            name="ownerWhatsapp"
            required
            placeholder="5511999998888"
            hint="Só dígitos com DDI/DDD. É pra quem a IA avisa quando escala."
          />
          <Field
            label="WhatsApp do atendente (opcional)"
            name="humanAttendantPhone"
            placeholder="5511988887777"
          />
          <Field label="Endereço" name="address" placeholder="Rua X, 123 – Bairro" />
          <Textarea
            label="Descrição / sobre a lavanderia"
            name="aboutText"
            placeholder="Horário, regras, observações que a IA deve considerar no atendimento."
            rows={4}
          />
        </Section>

        <Section title="Assinatura (opcional)">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="enableSubscription"
              value="1"
              className="mt-1"
              defaultChecked
            />
            <span>
              <span className="font-medium">Ativar cobrança</span>
              <span className="block text-xs text-zinc-500">
                Define mensalidade e dia de vencimento. Pode configurar depois.
              </span>
            </span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <Field
              label="Mensalidade (R$)"
              name="monthlyPrice"
              placeholder="99,00"
              inputMode="decimal"
            />
            <Field
              label="Dia do vencimento"
              name="dueDay"
              type="number"
              min={1}
              max={28}
              defaultValue="5"
            />
            <Field
              label="Dias de trial"
              name="trialDays"
              type="number"
              min={0}
              defaultValue="14"
            />
          </div>
        </Section>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Link
            href="/tenants"
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <SubmitButton pendingLabel="Criando lavanderia…">
            Criar lavanderia
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-zinc-500">{title}</legend>
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1">
      <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        {props.required && <span className="text-red-500"> *</span>}
      </div>
      <input
        {...props}
        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      />
      {hint && <div className="text-xs text-zinc-500">{hint}</div>}
    </label>
  );
}

function Textarea({
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
        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      />
    </label>
  );
}

function Select({
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
        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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
