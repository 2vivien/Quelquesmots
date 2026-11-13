import Link from "next/link";

/**
 * Pied de page discret avec liens utiles et mention légale obligatoire.
 */
export function Footer() {
  return (
    <footer className="mt-16 border-t border-bord bg-ivoire py-10">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="space-y-1.5">
          <p className="font-serif text-2xl text-encre">Quelques mots</p>
          <p className="font-serif text-sm italic text-muted">— Parce que les mots comptent.</p>
          <p className="pt-1 text-xs text-muted">Quelques mots n&apos;est pas un service d&apos;aide.</p>
        </div>
        <nav className="flex flex-wrap gap-5 text-sm text-muted" aria-label="Liens de pied de page">
          <Link href="/a-propos" className="hover:text-encre">À propos</Link>
          <Link href="/aide" className="hover:text-encre">Aide</Link>
          <Link href="/conditions" className="hover:text-encre">Conditions</Link>
          <Link href="/confidentialite" className="hover:text-encre">Confidentialité</Link>
        </nav>
      </div>
    </footer>
  );
}
