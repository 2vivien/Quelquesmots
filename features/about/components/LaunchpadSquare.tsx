import Link from "next/link";
import { PenLine, BookOpen, Search, Heart, Sparkles, MousePointer2, ShieldCheck, Smile } from "lucide-react";

const ITEMS = [
  { Icon: PenLine, label: "Écrire", href: "/" },
  { Icon: BookOpen, label: "Lire", href: "/" },
  { Icon: Heart, label: "Favoris", href: "/bibliotheque" },
  { Icon: Search, label: "Chercher", href: "/recherche" },
  { Icon: Sparkles, label: "Thèmes", href: "/themes" },
  { Icon: MousePointer2, label: "Auteurs", href: "/auteurs" },
  { Icon: ShieldCheck, label: "Modération", href: "/admin" },
  { Icon: Smile, label: "À propos", href: "/a-propos" },
] as const;

/** Grille d'icônes carrées façon écran de lancement. */
export function LaunchpadSquare() {
  return (
    <section aria-label="Launchpad" className="border-b-[3px] border-encre bg-[#F5EDDC] bg-[radial-gradient(#C8C0B0_1px,transparent_1px)] bg-[size:20px_20px] px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-[980px]">
        <p className="text-center font-display text-[11px] uppercase leading-none tracking-[0.38em] text-mute">Launchpad</p>
        <ul className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-8 sm:gap-4">
          {ITEMS.map((item) => {
            const Icon = item.Icon;
            return (
              <li key={item.label}>
                <Link href={item.href} className="group flex flex-col items-center gap-1.5 rounded-2xl p-2 transition-all hover:-translate-y-1">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-encre bg-[#FDF9EE] text-encre shadow-[3px_3px_0_0_#1F1B12] transition-shadow group-hover:shadow-[5px_5px_0_0_#1F1B12] sm:h-16 sm:w-16">
                    <Icon size={26} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <span className="font-display text-[9px] uppercase leading-none tracking-wider text-encre">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
