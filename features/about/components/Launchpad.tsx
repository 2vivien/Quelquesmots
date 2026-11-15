import Link from "next/link";
import { PenLine, BookOpen, Search, Heart, Sparkles, MousePointer2, ShieldCheck, Smile } from "lucide-react";

const ITEMS = [
  { Icon: PenLine, label: "Écrire", href: "/" },
  { Icon: BookOpen, label: "Lire", href: "/" },
  { Icon: Search, label: "Chercher", href: "/recherche" },
  { Icon: Heart, label: "Favoris", href: "/bibliotheque" },
  { Icon: Sparkles, label: "Thèmes", href: "/themes" },
  { Icon: MousePointer2, label: "Auteurs", href: "/auteurs" },
  { Icon: ShieldCheck, label: "Modération", href: "/admin" },
  { Icon: Smile, label: "À propos", href: "/a-propos" },
] as const;

/** Grille d'icônes façon launchpad classique. */
export function Launchpad() {
  return (
    <section className="border-x-[3px] border-encre bg-[#F5EDDC] px-4 py-10 sm:px-8">
      <p className="font-display text-sm uppercase leading-none tracking-[0.25em] text-mute">Launchpad</p>
      <ul className="mt-5 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {ITEMS.map((item) => {
          const Icon = item.Icon;
          return (
            <li key={item.label}>
              <Link href={item.href} className="group flex flex-col items-center gap-2 rounded-2xl border-2 border-encre bg-[#FDF9EE] p-3 text-center transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#1F1B12]">
                <Icon size={32} strokeWidth={1.5} aria-hidden="true" className="text-encre" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-encre">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
