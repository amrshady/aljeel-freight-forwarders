import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlJeel freight",
  description: "Air freight quotations for Al Jeel forwarders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#006EB3" />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
