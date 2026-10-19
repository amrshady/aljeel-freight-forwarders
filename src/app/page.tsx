import { signIn } from "@/app/actions";
import { AljeelLogo } from "@/components/aljeel-logo";
import { SiteFooter } from "@/components/site-footer";
import { prisma } from "@/lib/db";
import { roleLabel } from "@/lib/freight";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const roleOrder = ["PROCUREMENT", "FINANCE", "FORWARDER"];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/shipments");

  const { error } = await searchParams;
  const users = await prisma.user.findMany();
  users.sort(
    (a, b) =>
      roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role) ||
      a.name.localeCompare(b.name),
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex h-1.5" dir="ltr" aria-hidden="true">
        <div className="flex-1 bg-denim" />
        <div className="flex-1 bg-pimento" />
      </div>
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <AljeelLogo />
          <h1 className="mt-8 text-center text-2xl font-semibold tracking-tight text-primary">
            Freight quotations
          </h1>
          <p className="mt-3 text-center text-sm leading-6 text-muted-foreground">
            Local sign-in for the first version. Production will use its own
            address and login list, separate from the AP portal.
          </p>
          {error ? (
            <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              That account is not on this portal.
            </p>
          ) : null}
          <ul className="mt-8 space-y-3">
            {users.map((account) => (
              <li key={account.id}>
                <form action={signIn}>
                  <input type="hidden" name="email" value={account.email} />
                  <button className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-3 text-left shadow-sm transition-colors hover:border-primary/40">
                    <span>
                      <span className="block font-medium text-foreground">
                        {account.company ?? account.name}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {account.email}
                      </span>
                    </span>
                    <span className="text-sm text-primary">
                      {roleLabel(account.role)}
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
