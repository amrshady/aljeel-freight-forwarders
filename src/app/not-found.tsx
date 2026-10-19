import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NotFound() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  return (
    <main className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        The page you requested does not exist.
      </p>
      <Link
        href="/shipments"
        className="mt-6 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Back to shipments
      </Link>
    </main>
  );
}
