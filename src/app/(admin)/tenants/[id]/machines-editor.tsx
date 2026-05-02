"use client";

import { useState, useTransition } from "react";
import { replaceMachinesAction } from "../actions";

export type MachineErrorRow = {
  code: string;
  meaning: string;
};

export type MachineRow = {
  name: string;
  model: string;
  notes: string;
  errors: MachineErrorRow[];
};

type Props = {
  tenantId: string;
  initial: MachineRow[];
  current: {
    ownerWhatsapp: string;
    humanAttendantPhone: string | null;
    address: string | null;
    openingHours: unknown;
    humanSupportHours: unknown;
    aboutText: string | null;
  };
};

export function MachinesEditor({ tenantId, initial, current }: Props) {
  const [machines, setMachines] = useState<MachineRow[]>(() =>
    initial.length > 0 ? initial : [emptyMachine()],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function updateMachine(index: number, patch: Partial<MachineRow>) {
    setMachines((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    );
  }

  function removeMachine(index: number) {
    setMachines((prev) => prev.filter((_, i) => i !== index));
  }

  function addMachine() {
    setMachines((prev) => [...prev, emptyMachine()]);
  }

  function addError(machineIdx: number) {
    setMachines((prev) =>
      prev.map((m, i) =>
        i === machineIdx
          ? { ...m, errors: [...m.errors, { code: "", meaning: "" }] }
          : m,
      ),
    );
  }

  function updateError(
    machineIdx: number,
    errorIdx: number,
    patch: Partial<MachineErrorRow>,
  ) {
    setMachines((prev) =>
      prev.map((m, i) =>
        i === machineIdx
          ? {
              ...m,
              errors: m.errors.map((e, j) =>
                j === errorIdx ? { ...e, ...patch } : e,
              ),
            }
          : m,
      ),
    );
  }

  function removeError(machineIdx: number, errorIdx: number) {
    setMachines((prev) =>
      prev.map((m, i) =>
        i === machineIdx
          ? { ...m, errors: m.errors.filter((_, j) => j !== errorIdx) }
          : m,
      ),
    );
  }

  async function handleSubmit(fd: FormData) {
    setError(null);
    fd.set("machinesJson", JSON.stringify(machines));
    startTransition(async () => {
      try {
        await replaceMachinesAction(tenantId, current, fd);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        {machines.map((machine, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <input
                value={machine.name}
                onChange={(e) => updateMachine(idx, { name: e.target.value })}
                placeholder="Nome / nº (ex: Lavadora 1)"
                className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
              <input
                value={machine.model}
                onChange={(e) => updateMachine(idx, { model: e.target.value })}
                placeholder="Modelo (ex: LG WD-12)"
                className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            <input
              value={machine.notes}
              onChange={(e) => updateMachine(idx, { notes: e.target.value })}
              placeholder="Observação (opcional, ex: 'fica nos fundos')"
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800"
            />

            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Códigos de erro
                </span>
                <button
                  type="button"
                  onClick={() => addError(idx)}
                  className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  + erro
                </button>
              </div>
              {machine.errors.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  Nenhum erro cadastrado pra essa máquina.
                </p>
              ) : (
                <ul className="space-y-1">
                  {machine.errors.map((err, eIdx) => (
                    <li key={eIdx} className="flex items-center gap-2">
                      <input
                        value={err.code}
                        onChange={(e) =>
                          updateError(idx, eIdx, { code: e.target.value })
                        }
                        placeholder="código (E2)"
                        className="w-24 rounded-md border border-zinc-200 bg-white px-2 py-1 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800"
                      />
                      <input
                        value={err.meaning}
                        onChange={(e) =>
                          updateError(idx, eIdx, { meaning: e.target.value })
                        }
                        placeholder="o que significa (porta aberta)"
                        className="flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                      />
                      <button
                        type="button"
                        onClick={() => removeError(idx, eIdx)}
                        className="rounded-md border border-red-200 bg-white px-2 py-0.5 text-xs font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-red-950/40"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-3 flex justify-end border-t border-zinc-100 pt-2 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => removeMachine(idx)}
                className="rounded-md border border-red-200 bg-white px-2 py-0.5 text-xs font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-red-950/40"
              >
                Remover máquina
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={addMachine}
          className="rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          + Adicionar máquina
        </button>
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
        >
          {pending && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              className="animate-spin"
              aria-hidden
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="3"
                strokeOpacity="0.25"
              />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          )}
          {pending ? "Salvando…" : "Salvar máquinas"}
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

function emptyMachine(): MachineRow {
  return { name: "", model: "", notes: "", errors: [] };
}
