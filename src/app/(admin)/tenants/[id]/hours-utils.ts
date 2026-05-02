export type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type DayHours = { open: boolean; start: string; end: string };

export type WeeklyHours = Record<DayKey, DayHours>;

export const DAYS: { key: DayKey; label: string }[] = [
  { key: "monday", label: "Seg" },
  { key: "tuesday", label: "Ter" },
  { key: "wednesday", label: "Qua" },
  { key: "thursday", label: "Qui" },
  { key: "friday", label: "Sex" },
  { key: "saturday", label: "Sáb" },
  { key: "sunday", label: "Dom" },
];

export function parseWeeklyHours(raw: unknown): WeeklyHours {
  const empty: WeeklyHours = {
    monday: { open: false, start: "08:00", end: "18:00" },
    tuesday: { open: false, start: "08:00", end: "18:00" },
    wednesday: { open: false, start: "08:00", end: "18:00" },
    thursday: { open: false, start: "08:00", end: "18:00" },
    friday: { open: false, start: "08:00", end: "18:00" },
    saturday: { open: false, start: "08:00", end: "18:00" },
    sunday: { open: false, start: "08:00", end: "18:00" },
  };
  if (!raw || typeof raw !== "object") return empty;
  const record = raw as Record<string, unknown>;
  for (const { key } of DAYS) {
    const slot = record[key];
    if (!slot || typeof slot !== "object") continue;
    const s = slot as { start?: unknown; end?: unknown };
    const start = typeof s.start === "string" ? s.start : "";
    const end = typeof s.end === "string" ? s.end : "";
    if (start && end) {
      empty[key] = { open: true, start, end };
    }
  }
  return empty;
}
