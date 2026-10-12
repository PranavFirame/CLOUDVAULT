import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "CloudVault — Premium Zero-Knowledge Encrypted Cloud Storage",
  description:
    "Store, organize, and protect your files in one secure, beautifully simple zero-knowledge encrypted workspace.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans selection:bg-brand-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
