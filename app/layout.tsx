import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppProviders } from "@/components/layout/AppProviders";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { RightIconRail } from "@/components/layout/RightIconRail";
import "./globals.css";

const newsreader = localFont({
  src: [
    { path: "./fonts/newsreader-normal.woff2", weight: "400 500", style: "normal" },
    { path: "./fonts/newsreader-italic.woff2", weight: "400 500", style: "italic" },
  ],
  variable: "--font-newsreader",
});

const inter = localFont({
  src: "./fonts/inter-normal.woff2",
  weight: "400 600",
  style: "normal",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Quelques mots — Un espace où les mots restent.",
  description:
    "Un espace où les mots restent. Plateforme littéraire de textes courts en français.",
  openGraph: {
    title: "Quelques mots — Un espace où les mots restent.",
    description:
      "Un espace où les mots restent. Plateforme littéraire de textes courts en français.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quelques mots — Un espace où les mots restent.",
    description:
      "Un espace où les mots restent. Plateforme littéraire de textes courts en français.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${newsreader.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-ivoire text-encre antialiased md:pr-14" suppressHydrationWarning>
        <AppProviders>
          <Header />
          <RightIconRail />
          <main className="mx-auto min-h-[68vh] max-w-[1200px] px-4 py-8 sm:px-6">
            {children}
          </main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
