"use client";

import { useState, useTransition } from "react";
import { updateHoursAction } from "../actions";
import { DAYS, type DayHours, type DayKey, type WeeklyHours } from "./hours-utils";

type Props = {
  tenantId: string;
  initialOpening: WeeklyHours;
  initialHumanSupport: WeeklyHours;
  current: {
    ownerWhatsapp: string;
    humanAttendantPhone: string | null;
    address: string | null;
    aboutText: string | null;
    machines: unknown;
  };
};

export function HoursEditor({
  tenantId,
  initialOpening,
  initialHumanSupport,
  current,
}: Props) {
  const [opening, setOpening] = useState<WeeklyHours>(initialOpening);
  const [humanSupport, setHumanSupport] =
    useState<WeeklyHours>(initialHumanSupport);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(fd: FormData) {
    setError(null);
    fd.set("openingHoursJson", JSON.stringify(toPayload(opening)));
    fd.set("humanSupportHoursJson", JSON.stringify(toPayload(humanSupport)));
    startTransition(async () => {
      try {
        await updateHoursAction(tenantId, current, fd);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <WeeklyTable
        title="Horário de funcionamento"
        helper="Quando a lavanderia está aberta pro autoatendimento."
        value={opening}
        onChange={setOpening}
      />
      <WeeklyTable
        title="Atendimento humano presencial"
        helper="Janelas em que tem alguém na loja pra atender — fora disso a IA evita prometer atendente."
        value={humanSupport}
        onChange={setHumanSupport}
      />

      <div className="flex items-center justify-end border-t border-zinc-100 pt-3 dark:border-zinc-800">
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
          {pending ? "Salvando…" : "Salvar horários"}
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

function WeeklyTable({
  title,
  helper,
  value,
  onChange,
}: {
  title: string;
  helper: string;
  value: WeeklyHours;
  onChange: (next: WeeklyHours) => void;
}) {
  function update(day: DayKey, patch: Partial<DayHours>) {
    onChange({ ...value, [day]: { ...value[day], ...patch } });
  }

  function applyToAll(from: DayKey) {
    const src = value[from];
    const next = { ...value };
    for (const { key } of DAYS) {
      next[key] = { ...src };
    }
    onChange(next);
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {title}
      </legend>
      <p className="text-xs text-zinc-500">{helper}</p>
      <ul className="divide-y divide-zinc-100 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700">
        {DAYS.map(({ key, label }) => {
          const day = value[key];
          return (
            <li
              key={key}
              className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm"
            >
              <span className="w-10 font-medium text-zinc-700 dark:text-zinc-300">
                {label}
              </span>
              <label className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={day.open}
                  onChange={(e) => update(key, { open: e.target.checked })}
                />
                aberto
              </label>
              <input
                type="time"
                value={day.start}
                onChange={(e) => update(key, { start: e.target.value })}
                disabled={!day.open}
                className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-xs disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800"
              />
              <span className="text-xs text-zinc-500">até</span>
              <input
                type="time"
                value={day.end}
                onChange={(e) => update(key, { end: e.target.value })}
                disabled={!day.open}
                className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-xs disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800"
              />
              <button
                type="button"
                onClick={() => applyToAll(key)}
                title={`Replicar ${label} pros outros dias`}
                className="ml-auto rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                replicar p/ todos
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

function toPayload(
  hours: WeeklyHours,
): Record<DayKey, { start: string; end: string } | null> {
  const out = {} as Record<DayKey, { start: string; end: string } | null>;
  for (const { key } of DAYS) {
    const d = hours[key];
    if (!d.open || !d.start || !d.end) {
      out[key] = null;
    } else {
      out[key] = { start: d.start, end: d.end };
    }
  }
  return out;
}

