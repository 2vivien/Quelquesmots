/** Section prose en deux colonnes — l'intention : écriture brève, sans spectacle. */
export function AboutProgrammer() {
  return (
    <section className="border-x-[3px] border-encre bg-[#EFE7D5] px-4 py-10 sm:px-8">
      <p className="font-display text-lg uppercase leading-none tracking-wide text-encre">Je voulais être écrivain.</p>
      <div className="mt-4 grid gap-6 text-[16px] leading-[1.7] text-encre/90 sm:grid-cols-2">
        <p>
          Quelques mots est né de l&apos;idée que la littérature n&apos;attend pas — elle se dépose,
          dans un moment volé, sur un écran ou un coin de table, entre deux cafés.
        </p>
        <p>
          La plateforme existe parce qu&apos;il y a des textes dont on n&apos;osera jamais parler
          au-delà du journal intime. Ici, ils trouvent leur mur. Ou simplement, leur refuge.
        </p>
        <p>
          Personne ne vous demande d&apos;être cohérent, poli ou vendeur. L&apos;écriture n&apos;est
          pas un métier avant d&apos;être, simplement, un acte.
        </p>
        <p>
          Quelques mots s&apos;engage à rester libre : sans publicité, sans paywall éditorial, et
          jamais en arrière d&apos;un algorithme.
        </p>
      </div>
    </section>
  );
}
