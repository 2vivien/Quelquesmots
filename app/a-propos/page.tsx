/** Page éditoriale À propos. */
export default function AboutPage() {
  return (
    <article className="mx-auto max-w-[680px] space-y-5 font-serif text-[19px] leading-[1.7] text-encre">
      <h1 className="text-4xl font-normal">À propos de Quelques mots</h1>
      <p>
        Quelques mots est une maison d&apos;édition ouverte aux textes courts, aux fragments
        et aux pensées posées avec soin. Ici, le bruit s&apos;efface pour laisser place à la lecture.
      </p>
      <p className="text-base font-sans text-muted">
        Plateforme littéraire indépendante — Quelques mots n&apos;est pas un service d&apos;aide.
      </p>
    </article>
  );
}
