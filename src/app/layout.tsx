import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import { ThemeProvider } from "@/components/ThemeProvider";
import ToasterWrapper from "@/components/ToasterWrapper";

export const metadata: Metadata = {
  title: "HybridCrypto — AES-256 + RSA-2048 Document Security",
  description:
    "Implementasi Hybrid Cryptosystem menggunakan AES-256 dan RSA-2048 untuk pengamanan dokumen digital berbasis web",
  keywords: ["kriptografi", "AES-256", "RSA-2048", "hybrid cryptosystem", "enkripsi dokumen"],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <SessionProvider session={session}>
          <ThemeProvider>
            {children}
            <ToasterWrapper />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
