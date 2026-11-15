import type { Metadata } from "next";
import localFont from "next/font/local";
import { Archivo_Black } from "next/font/google";
import { AppProviders } from "@/components/layout/AppProviders";
import { AppChrome } from "@/components/layout/AppChrome";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
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
  description: "Un espace où les mots restent. Plateforme littéraire de textes courts en français.",
  openGraph: {
    title: "Quelques mots — Un espace où les mots restent.",
    description: "Un espace où les mots restent. Plateforme littéraire de textes courts en français.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quelques mots — Un espace où les mots restent.",
    description: "Un espace où les mots restent. Plateforme littéraire de textes courts en français.",
  },
};

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${newsreader.variable} ${inter.variable} ${archivoBlack.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-ivoire text-encre antialiased" suppressHydrationWarning>
        <AppProviders>
          <AppChrome sidebar={<Sidebar />} header={<Header />}>{children}</AppChrome>
        </AppProviders>
      </body>
    </html>
  );
}
