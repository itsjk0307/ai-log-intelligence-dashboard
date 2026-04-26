import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Log Intelligence Dashboard",
  description: "NLP dashboard for system log issue analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
