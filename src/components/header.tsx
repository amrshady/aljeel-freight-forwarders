import { signOut } from "@/app/actions";
import { roleLabel } from "@/lib/freight";
import { AljeelLogo } from "@/components/aljeel-logo";
import Link from "next/link";

export function Header({
  name,
  role,
  company,
  accessMode,
}: {
  name: string;
  role: string;
  company: string | null;
  accessMode: boolean;
}) {
  return (
    <header className="header-surface text-primary-foreground">
      <div className="relative z-10 mx-auto flex max-w-[90rem] items-center justify-between gap-6 px-4 py-4 sm:px-6">
        <Link href="/shipments">
          <AljeelLogo variant="light" />
        </Link>
        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1">
            <Link
              href="/shipments"
              className="inline-flex items-center gap-2 rounded-full bg-white/[0.14] px-4 py-2 text-sm font-medium text-white"
            >
              <span
                className="size-1.5 rounded-full bg-pimento shadow-[0_0_8px_rgba(222,94,76,0.9)]"
                aria-hidden="true"
              />
              Shipments
            </Link>
          </nav>
          <span className="mx-3 h-6 w-px bg-white/20" aria-hidden="true" />
          <p className="hidden text-right text-sm text-white/90 sm:block">
            <span className="font-medium">{company ?? name}</span>
            <span className="mt-0.5 block text-white/70">{roleLabel(role)}</span>
          </p>
          {accessMode ? (
            <a
              href="/cdn-cgi/access/logout"
              className="inline-flex h-9 items-center rounded-full border border-white/20 bg-white/[0.06] px-4 text-sm text-white/90 hover:border-pimento hover:bg-pimento hover:text-white"
            >
              Sign out
            </a>
          ) : (
            <form action={signOut}>
              <button className="h-9 rounded-full border border-white/20 bg-white/[0.06] px-4 text-sm text-white/90 hover:border-pimento hover:bg-pimento hover:text-white">
                Sign out
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
