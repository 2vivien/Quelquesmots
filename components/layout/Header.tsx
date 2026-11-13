import Link from "next/link";
import { HeaderMobile } from "./HeaderMobile";

/** Barre de navigation minimale : le logotype « Quelques mots » aligné à gauche. */
export function Header() {
  return (
    <header className="border-b border-bord bg-ivoire/95">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/" className="font-serif text-xl text-encre transition-opacity hover:opacity-70">
          Quelques mots
        </Link>
        <HeaderMobile />
      </div>
    </header>
  );
}
