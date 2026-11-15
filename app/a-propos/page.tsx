import { AboutHero, AboutShowcase, AboutProgrammer, Launchpad, Signoff } from "@/features/about";

export const revalidate = 3600;

const ABOUT_PILLS = [
  { label: "FRANÇAIS", bg: "#F5B921" },
  { label: "SANS PUB", bg: "#FFB4CF" },
  { label: "OSS", bg: "#CFFB7F" },
  { label: "INDÉPENDANT", bg: "#FFB3A0" },
  { label: "COÛT ZÉRO", bg: "#BDE0FE" },
  { label: "OUVERT", bg: "#FFE37E" },
] as const;

/** Page À propos — homage à l'affiche Susan Kare (Apple, 1984). */
export default function AboutPage() {
  return (
    <main className="mx-auto max-w-[1100px] font-sans text-encre">
      <AboutHero pills={ABOUT_PILLS} />
      <AboutShowcase />
      <AboutProgrammer />
      <Launchpad />
      <Signoff />
    </main>
  );
}
