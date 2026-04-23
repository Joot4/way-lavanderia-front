"use client";

import { useState, useTransition } from "react";
import { replacePricesAction } from "../actions";

export type PriceRow = {
  name: string;
  description: string;
  priceCents: number;
  unit: string;
  active: boolean;
};

type Props = {
  tenantId: string;
  initial: PriceRow[];
};

export function PricesEditor({ tenantId, initial }: Props) {
  const [items, setItems] = useState<PriceRow[]>(() =>
    initial.length > 0 ? initial : [emptyRow()],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function updateItem(index: number, patch: Partial<PriceRow>) {
    setItems((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyRow()]);
  }

  async function handleSubmit(fd: FormData) {
    setError(null);
    fd.set("itemsJson", JSON.stringify(items));
    startTransition(async () => {
      try {
        await replacePricesAction(tenantId, fd);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-3 py-2 font-medium">Nome</th>
            <th className="px-3 py-2 font-medium">Unidade</th>
            <th className="px-3 py-2 font-medium">Preço (R$)</th>
            <th className="px-3 py-2 font-medium">Ativo</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {items.map((row, idx) => (
            <tr key={idx}>
              <td className="px-3 py-2">
                <input
                  value={row.name}
                  onChange={(e) => updateItem(idx, { name: e.target.value })}
                  placeholder="Ex: Lavagem 8kg"
                  className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                />
                <input
                  value={row.description}
                  onChange={(e) => updateItem(idx, { description: e.target.value })}
                  placeholder="descrição (opcional)"
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  value={row.unit}
                  onChange={(e) => updateItem(idx, { unit: e.target.value })}
                  placeholder="kg, peça..."
                  className="w-20 rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  inputMode="decimal"
                  value={centsToInput(row.priceCents)}
                  onChange={(e) =>
                    updateItem(idx, { priceCents: parseCentsSafe(e.target.value) })
                  }
                  placeholder="0,00"
                  className="w-24 rounded-md border border-zinc-200 bg-white px-2 py-1 text-right text-sm tabular-nums dark:border-zinc-700 dark:bg-zinc-800"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={row.active}
                  onChange={(e) => updateItem(idx, { active: e.target.checked })}
                />
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="rounded-md border border-red-200 bg-white px-2 py-0.5 text-xs font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-red-950/40"
                >
                  Remover
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={addItem}
          className="rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          + Adicionar item
        </button>
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
        >
          {pending && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
          {pending ? "Salvando…" : "Salvar tabela de preços"}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}
    </form>
  );
}

function emptyRow(): PriceRow {
  return { name: "", description: "", priceCents: 0, unit: "", active: true };
}

function centsToInput(cents: number): string {
  if (!cents) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

function parseCentsSafe(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".").trim();
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}
