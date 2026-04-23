import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { FlashToaster } from "@/components/flash-toaster";
import { MobileNav } from "@/components/mobile-nav";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/tenants", label: "Lavanderias" },
  { href: "/usage", label: "Uso & custo" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const email = session?.user?.email ?? "";
  const name = session?.user?.name ?? email.split("@")[0];

  return (
    <div className="flex min-h-dvh text-slate-900">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white/80 p-4 backdrop-blur md:block">
        <div className="mb-6 px-2">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            Lavanderia AI
          </h1>
          <p className="text-xs text-slate-500">Admin</p>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur">
          <div className="flex items-center gap-2 md:hidden">
            <MobileNav items={NAV} />
            <span className="text-sm font-semibold text-slate-900">
              Lavanderia AI
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-slate-900">{name}</div>
              <div className="text-xs text-slate-500">{email}</div>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Sair
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>

      <FlashToaster />
    </div>
  );
}
