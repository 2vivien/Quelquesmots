import { Mail, ExternalLink } from "lucide-react";

/** Citation monument + pied de page sobre en noir. */
export function Signoff() {
  return (
    <>
      <section className="border-x-[3px] border-t-[3px] border-encre bg-[#FAF2EA] px-4 py-12 text-center sm:px-8">
        <p className="font-display text-3xl leading-[0.9] tracking-tight text-encre sm:text-5xl">
          &ldquo;IT IS GOING<br />TO BE<br />INTERESTING&rdquo;
        </p>
        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.3em] text-mute">— Stewart Brand, 1984</p>
      </section>

      <section className="border-x-[3px] border-b-[3px] border-t-[3px] border-encre bg-[#282524] px-5 py-6 text-[#EFE7D5] sm:px-8">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="font-display text-sm uppercase tracking-widest">Quelques mots — maison d&apos;édition ouverte — MMXXVI</p>
          <a href="mailto:contact@quelque-mots.fr" className="inline-flex items-center gap-2 rounded-full border-2 border-[#EFE7D5] bg-transparent px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-[#EFE7D5] transition-colors hover:bg-[#EFE7D5] hover:text-encre">
            <Mail size={14} strokeWidth={2} aria-hidden="true" /> contact@quelque-mots.fr <ExternalLink size={12} aria-hidden="true" />
          </a>
        </div>
      </section>
    </>
  );
}
