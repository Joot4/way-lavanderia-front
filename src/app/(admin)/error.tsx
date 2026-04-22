"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h2 className="text-lg font-semibold">Algo deu errado</h2>
      <p className="max-w-sm text-sm text-zinc-500">
        {error.message || "Erro inesperado ao carregar a página."}
      </p>
      <button
        onClick={reset}
        className="rounded-md border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
      >
        Tentar novamente
      </button>
    </div>
  );
}
