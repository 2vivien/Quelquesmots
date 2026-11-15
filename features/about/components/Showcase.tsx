import { ClassicWindow } from "./ClassicWindow";

/** Fenêtre showcase — éditeur faux-code + écran terminal mac classique. */
export function AboutShowcase() {
  return (
    <section className="border-x-[3px] border-encre bg-[#BFDDF4] px-4 py-8 sm:px-8 sm:py-10">
      <ClassicWindow title="~/quelquesmots — Aperçu">
        <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto] sm:gap-10">
          <div className="space-y-4">
            <p className="font-serif text-2xl font-normal leading-tight text-encre">Un éditeur honnête pour quelques lignes honnêtes.</p>
            <p className="max-w-[52ch] text-[15px] leading-relaxed text-encre/85">
              Quelques mots est une plateforme littéraire centrée sur l&apos;écriture brève — le fragment,
              le fait, l&apos;éclat fugace d&apos;une intuition — sans publicité, sans monétisation forcée, sans
              algorithmes qui décident de votre valeur.
            </p>
            <ul className="space-y-1.5 text-sm text-encre/85">
              <li className="flex items-start gap-2"><span className="mt-1 flex h-2.5 w-2.5 shrink-0 rounded-sm border border-encre bg-[#CFFB7F]" aria-hidden="true" /><span>Chaque texte publié est visible in extenso — pas de « lire la suite » cachée derrière un paywall.</span></li>
              <li className="flex items-start gap-2"><span className="mt-1 flex h-2.5 w-2.5 shrink-0 rounded-sm border border-encre bg-[#FFB4CF]" aria-hidden="true" /><span>Votre profil d&apos;auteur est votre vitrine — annonceur ou hébergeur vous n&apos;êtes jamais exposé au regard d&apos;inconnus qui paient pour vous voir.</span></li>
              <li className="flex items-start gap-2"><span className="mt-1 flex h-2.5 w-2.5 shrink-0 rounded-sm border border-encre bg-[#BDE0FE]" aria-hidden="true" /><span>Modération humaine, empathique, transparente.</span></li>
            </ul>
          </div>
          <div className="mx-auto w-full max-w-md overflow-hidden rounded-[8px] border-[3px] border-encre bg-encre text-[10px] text-[#EFE7D5] shadow-[6px_6px_0_0_#1F1B12]">
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-1.5 text-[#EFE7D5]/70">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FFB4CF]" /><span className="h-2.5 w-2.5 rounded-full bg-[#FFE37E]" /><span className="h-2.5 w-2.5 rounded-full bg-[#CFFB7F]" /><span className="ml-2 font-mono">nouvel-texte.md</span>
            </div>
            <div className="space-y-3 p-4 font-mono leading-relaxed">
              <p className="text-[#FFE37E]"># Un éclat fugace</p>
              <p className="text-[#EFE7D5]">Les mots ne sont pas des objets — ce sont des respirations entre les lignes.</p>
              <p className="text-[#BDE0FE]">#oracle #essai #rupture</p>
              <hr className="border-white/10" />
              <p className="flex items-center gap-2 text-[#CFFB7F]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#CFFB7F]" /> <span>Enregistrement…</span></p>
            </div>
          </div>
        </div>
      </ClassicWindow>
    </section>
  );
}
