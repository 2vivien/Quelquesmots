import { AboutMasthead, BrowserWindow, BioPortrait, LaunchpadSquare, Signoff } from "@/features/about";

export const revalidate = 3600;

const ABOUT_PILLS = [
  { label: "SANS PUB", bg: "#F5B921" },
  { label: "FRANÇAIS", bg: "#FFB4CF" },
  { label: "OSS", bg: "#CFFB7F" },
  { label: "INDÉPENDANT", bg: "#FFB3A0" },
  { label: "COÛT ZÉRO", bg: "#BDE0FE" },
  { label: "SANS ALGO", bg: "#FFE37E" },
] as const;

/** Page À propos — homage à l'affiche Susan Kare (Apple, 1984), pleine largeur immersive, sans sidebar ni header. */
export default function AboutPage() {
  return (
    <>
      <AboutMasthead pills={ABOUT_PILLS} />
      <BrowserWindow />
      <BioPortrait />
      <LaunchpadSquare />
      <Signoff />
    </>
  );
}
