/** Page éditoriale À propos. */
export default function AboutPage() {
  return (
    <article className="mx-auto max-w-[680px] space-y-7 py-4 font-serif text-encre">
      <div className="space-y-3">
        <h1 className="font-serif text-xs uppercase tracking-[0.25em] text-muted">Quelques mots</h1>
        <h2 className="text-4xl font-normal leading-tight sm:text-5xl">Un mur de mots.</h2>
        <p className="text-xl italic leading-snug text-encre/90 sm:text-2xl">
          Des mots à écrire. Des histoires à lire. Des émotions à partager.
        </p>
        <p className="max-w-[52ch] pt-2 text-[17px] leading-relaxed text-encre">
          Un espace littéraire ouvert à tous, où chacun peut déposer quelques lignes,
          découvrir les pensées des autres et conserver les mots qui résonnent en lui.
        </p>
      </div>
      <div className="space-y-5 border-t border-bord pt-6 text-[17px] leading-[1.7]">
        <p>
          Quelques mots est une maison d&apos;édition ouverte aux textes courts, aux fragments
          et aux pensées posées avec soin. Ici, le bruit s&apos;efface pour laisser place à la lecture.
        </p>
        <p className="text-base font-sans text-muted">
          Plateforme littéraire indépendante — Quelques mots n&apos;est pas un service d&apos;aide.
        </p>
      </div>
    </article>
  );
}
