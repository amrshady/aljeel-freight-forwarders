import { AljeelLogo } from "@/components/aljeel-logo";
import { SiteFooter } from "@/components/site-footer";
import { getAccessEmail, getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const email = await getAccessEmail();
  if (email && (await getSessionUser())) redirect("/shipments");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex h-1.5" dir="ltr" aria-hidden="true">
        <div className="flex-1 bg-denim" />
        <div className="flex-1 bg-pimento" />
      </div>
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">
          <AljeelLogo />
          <h1 className="mt-8 text-2xl font-semibold tracking-tight text-primary">
            Freight quotations
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {email
              ? "Your email is not set up for this portal. Contact the portal administrator."
              : "Sign-in is handled by Cloudflare Access."}
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
