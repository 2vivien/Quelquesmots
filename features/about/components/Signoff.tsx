import { Mail, ExternalLink } from "lucide-react";

/** Citation-monument pleine largeur + signature noire (Pied de page magazine). */
export function Signoff() {
  return (
    <>
      {/* Citation-monument */}
      <section aria-label="Manifeste" className="border-b-[3px] border-encre bg-[#FAF2EA] px-4 py-14 text-center sm:py-20">
        <p className="mx-auto max-w-[900px] font-display text-[30px] leading-[0.92] tracking-tight text-encre sm:text-[56px] md:text-[80px]">
          « Ce qui est intéressant<br />est souvent inattendu. »
        </p>
        <p className="mt-6 font-mono text-[11px] uppercase leading-none tracking-[0.32em] text-mute">— Stewart Brand, 1984</p>
      </section>

      {/* Pied de page noir, typo noir blanc */}
      <footer aria-label="Pied de page" className="bg-[#1E1B1D] px-5 py-6 text-[#F5EDE0] sm:px-10">
        <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-4 font-display text-[11px] uppercase tracking-[0.25em] sm:flex-row sm:text-[12px]">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-3 w-3 rounded-full border border-[#F5EDE0] bg-jaune" />
            <span>Quelques mots. MMXXVI</span>
          </div>
          <a href="mailto:contact@quelque-mots.fr" className="inline-flex items-center gap-2 rounded-full border-2 border-[#F5EDE0] bg-transparent px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider text-[#F5EDE0] transition-colors hover:bg-[#F5EDE0] hover:text-encre">
            <Mail size={14} strokeWidth={2} aria-hidden="true" /> contact@quelque-mots.fr <ExternalLink size={12} aria-hidden="true" />
          </a>
        </div>
      </footer>
    </>
  );
}
