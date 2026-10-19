export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-[90rem] px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
        <p>© {year} Accord Partners</p>
        <p className="mt-1">All rights reserved.</p>
      </div>
    </footer>
  );
}
