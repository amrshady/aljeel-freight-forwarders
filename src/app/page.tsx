import { signIn } from "@/app/actions";
import { AljeelLogo } from "@/components/aljeel-logo";
import { SiteFooter } from "@/components/site-footer";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/shipments");

  const { error } = await searchParams;
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
            Sign in with your portal email address and password.
          </p>
          {error ? (
            <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              The email or password is incorrect.
            </p>
          ) : null}
          <form action={signIn} className="mt-8 space-y-4 rounded-xl border bg-card p-6 shadow-sm">
            <label className="block text-sm text-foreground">
              Email
              <input
                required
                name="email"
                type="email"
                autoComplete="username"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </label>
            <label className="block text-sm text-foreground">
              Password
              <input
                required
                name="password"
                type="password"
                autoComplete="current-password"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </label>
            <button className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Sign in
            </button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
