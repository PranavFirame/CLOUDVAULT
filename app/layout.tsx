import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "CloudVault | Local-First Zero-Knowledge Encrypted Cloud Storage",
  description:
    "Zero-knowledge client-side AES-256-GCM encrypted file storage platform running entirely on your local infrastructure. Your Files. Your Keys. Your Privacy.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080c14] text-slate-100 antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
