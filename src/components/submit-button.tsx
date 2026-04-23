"use client";

import { useFormStatus } from "react-dom";

type Variant = "primary" | "success" | "warn" | "danger" | "ghost";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-sky-600 text-white shadow-sm hover:bg-sky-700 disabled:bg-sky-300",
  success:
    "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 disabled:bg-emerald-300",
  warn: "bg-amber-600 text-white shadow-sm hover:bg-amber-700 disabled:bg-amber-300",
  danger:
    "border border-red-300 bg-white text-red-700 hover:bg-red-50 disabled:opacity-60",
  ghost:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
};

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  size = "md",
  className = "",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {pending && <Spinner />}
      {pending ? (pendingLabel ?? "Aguarde…") : children}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      aria-hidden="true"
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
  );
}
