import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Not Websites | Cinematic Portfolio",
  description: "An immersive portfolio staged as a scrolling digital exhibition."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
