import type { Metadata } from "next";
import "./globals.css";
import { CookieConsent } from "./components/cookie-consent";

export const metadata: Metadata = {
  title: "Be Neighbor | MediCare",
  description: "Bilingual dental treatment planning, clinic matching, appointments and travel coordination for international patients visiting China.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
