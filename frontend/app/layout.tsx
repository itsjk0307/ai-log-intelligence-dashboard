import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI System Monitoring Dashboard",
  description: "NLP-Based Log Analysis & Issue Detection",
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
