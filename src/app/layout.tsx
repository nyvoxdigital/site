import type { Metadata } from "next";
import { Unbounded } from "next/font/google";
import "./globals.css";
import { CursorTrail } from "@/components/SiteChrome";

const displayFont = Unbounded({
  subsets: ["latin"],
  weight: ["800", "900"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "Murilo Gonçalves | Filmes e campanhas",
  description: "Produção de vídeo para marcas: filmes, campanhas e conteúdo."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={displayFont.variable}>
      <body>
        <CursorTrail />
        {children}
      </body>
    </html>
  );
}
