import Link from "next/link";
import { Globe, Search, PenLine, Heart, Smile, ShieldCheck, Sparkles, MousePointer2 } from "lucide-react";

interface WindowItem {
  Icon: typeof Globe;
  label: string;
  href: string;
  position: string;
}

const ITEMS: WindowItem[] = [
  { Icon: Globe, label: "Le mur", href: "/", position: "left-2 top-24 sm:left-4" },
  { Icon: Search, label: "Chercher", href: "/recherche", position: "right-3 top-24 sm:right-5" },
  { Icon: PenLine, label: "Écrire", href: "/studio", position: "left-2 top-[58%] sm:left-4" },
  { Icon: Heart, label: "Favoris", href: "/bibliotheque", position: "right-3 bottom-14 sm:right-5" },
  { Icon: Sparkles, label: "Thèmes", href: "/themes", position: "left-3 top-1/2 sm:left-5" },
  { Icon: MousePointer2, label: "Auteurs", href: "/auteurs", position: "right-3 top-1/2 sm:right-5" },
  { Icon: ShieldCheck, label: "Modération", href: "/admin", position: "left-3 top-[72%] sm:left-7" },
  { Icon: Smile, label: "À propos", href: "/a-propos", position: "right-6 bottom-4 sm:right-10" },
];

/** Fenêtre browser façon Apple 1984 — le wordmark flottant entouré des 8 icônes du lieu. */
export function BrowserWindow() {
  return (
    <section aria-label="Aperçu de Quelques mots" className="border-b-[3px] border-encre bg-[#A6D5F1] px-3 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-[1000px] overflow-hidden rounded-[14px] border-[3.5px] border-encre bg-[#EAE6DA] shadow-[10px_10px_0_0_#1F1B12]">
        {/* Barre de titre */}
        <div className="relative flex items-center gap-2 border-b-[3px] border-encre bg-[#EAE6DA] px-4 py-2">
          <span aria-hidden="true" className="h-3 w-3 rounded-full border border-encre bg-[#FFB4CF]" />
          <span aria-hidden="true" className="h-3 w-3 rounded-full border border-encre bg-[#FFE37E]" />
          <span aria-hidden="true" className="h-3 w-3 rounded-full border border-encre bg-[#CFFB7F]" />
          <span className="absolute left-1/2 -translate-x-1/2 font-display text-[10px] uppercase tracking-[0.35em] text-encre/80">Quelques mots — Aperçu</span>
        </div>

        {/* Zone bleu vif avec wordmark + icônes flottantes */}
        <div className="relative flex h-[420px] items-center justify-center overflow-hidden bg-[#A6D5F1] sm:h-[500px]">
          {/* Grille de fond subtile */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.85) 1.1px, transparent 1.1px)", backgroundSize: "14px 14px" }} />

          {/* Wordmark */}
          <div className="relative flex flex-col items-center">
            <h2 className="font-display text-[58px] leading-[0.82] tracking-tighter text-encre drop-shadow-[3px_3px_0_var(--color-jaune)] sm:text-[80px] md:text-[110px]">
              QUELQUES<br />MOTS
            </h2>
          </div>

          {/* Icônes flottantes */}
          {ITEMS.map((item) => {
            const Icon = item.Icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-label={item.label}
                className={`absolute ${item.position} z-10 flex w-14 flex-col items-center gap-1 transition-transform hover:-translate-y-1 sm:w-20`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-encre bg-[#FDF9EE] text-encre shadow-[3px_3px_0_0_#1F1B12] sm:h-14 sm:w-14">
                  <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span className="font-mono text-[9px] uppercase leading-none tracking-wider text-encre/90">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
