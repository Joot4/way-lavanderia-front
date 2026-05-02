import { getGlobalConfig } from "@/lib/global-config";
import { SubmitButton } from "@/components/submit-button";
import { updateGlobalConfigAction } from "./actions";

export default async function ConfigPage() {
  const config = await getGlobalConfig();
  const updatedAt = new Date(config.updatedAt).toLocaleString("pt-BR");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Configuração geral
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Regras aplicadas ao prompt da IA de <strong>todas</strong> as
          lavanderias. Use pra políticas que valem em qualquer cliente
          (linguagem, limites de desconto, escalonamento, etc.).
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700">Prompt geral</h2>
          <span className="text-xs text-slate-500">
            atualizado em {updatedAt}
          </span>
        </header>

        <form action={updateGlobalConfigAction} className="space-y-3">
          <textarea
            name="generalPrompt"
            rows={16}
            defaultValue={config.generalPrompt}
            placeholder={`Ex:\n- Nunca prometa horário que não consta no cadastro.\n- Não ofereça desconto sem aprovação do dono.\n- Sempre use português do Brasil, tom informal e respeitoso.\n- Quando o cliente reclamar, peça nº da máquina e horário antes de escalar.`}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-sm leading-relaxed shadow-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            maxLength={8000}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Esse texto entra no system prompt antes das regras específicas da
              lavanderia. Máx. 8000 caracteres.
            </p>
            <SubmitButton size="sm" pendingLabel="Salvando…">
              Salvar prompt geral
            </SubmitButton>
          </div>
        </form>
      </section>
    </div>
  );
}
