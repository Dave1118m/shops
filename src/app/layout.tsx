import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boutique Shop Control System",
  description: "Stock and Financial Control System for Boutique Retail",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-rose-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

