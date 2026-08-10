import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "800", "900"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "Studio Motion | Filmes e campanhas",
  description: "Produção de vídeo para marcas: filmes, campanhas e conteúdo."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
