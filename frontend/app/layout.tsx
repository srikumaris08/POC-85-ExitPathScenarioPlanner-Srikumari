import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Exit Path Scenario Planner | Real Rails Intelligence Library",
  description:
    "Capital Formation Rail — Institutional-grade exit path modeling across IPO, M&A, Secondary, and Continuation Vehicle archetypes. Powered by Real Rails Intelligence.",
  keywords: ["exit path", "scenario planner", "IPO", "M&A", "secondary", "continuation vehicle", "capital formation"],
  openGraph: {
    title: "Exit Path Scenario Planner | Real Rails",
    description: "Institutional-grade exit modeling for capital formation decisions.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body
        className="h-full overflow-hidden"
        style={{ backgroundColor: "var(--rr-bg)", color: "var(--rr-text)" }}
      >
        {children}
      </body>
    </html>
  );
}
