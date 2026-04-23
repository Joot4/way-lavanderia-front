"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-slate-900">Algo deu errado</h2>
      <p className="text-sm text-slate-500">
        {error.message || "Erro inesperado ao carregar a página."}
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-sky-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
      >
        Tentar novamente
      </button>
    </div>
  );
}
