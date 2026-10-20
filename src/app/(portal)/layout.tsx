import { Header } from "@/components/header";
import { SiteFooter } from "@/components/site-footer";
import { isAccessAuthMode } from "@/lib/auth-mode";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header
        name={user.name}
        role={user.role}
        company={user.company}
        accessMode={isAccessAuthMode()}
      />
      <main className="mx-auto w-full max-w-[90rem] flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
