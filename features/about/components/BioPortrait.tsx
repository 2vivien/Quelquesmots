import Image from "next/image";

/** Bio portrait façon magazine des années 80 : photo de l'affiche + texte au serif. */
export function BioPortrait() {
  return (
    <section aria-label="Portrait" className="border-b-[3px] border-encre bg-[#EBE4D4] px-4 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto grid max-w-[980px] items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-12">
        {/* Texte */}
        <div className="max-w-prose font-serif text-[15px] leading-[1.7] text-encre/90 sm:text-[16px]">
          <p className="font-display text-[22px] uppercase leading-[1.05] tracking-tight text-encre">
            « Je voulais être<br />écrivain. »
          </p>
          <p className="mt-6">
            Quelques mots est né de l&apos;idée que la littérature n&apos;attend pas — elle se dépose,
            dans un moment volé, sur un écran ou un coin de table, entre deux cafés. La plateforme existe
            parce qu&apos;il y a des textes dont on n&apos;osera jamais parler au-delà du journal intime ;
            ici, ils trouvent leur mur.
          </p>
          <p className="mt-4">
            Personne ne vous demande d&apos;être cohérent, poli ou vendeur. L&apos;écriture n&apos;est pas
            un métier avant d&apos;être, simplement, un acte. Et si Quelques mots s&apos;engage sur une seule
            chose, c&apos;est celle-ci : rester libre — sans publicité, sans paywall éditorial, et jamais
            en arrière d&apos;un algorithme.
          </p>
          <hr className="my-6 border-encre" />
          <dl className="grid grid-cols-2 gap-y-3 text-[12px] uppercase tracking-wider text-mute">
            <dt>Fondée</dt>
            <dd className="text-encre">MMXXVI</dd>
            <dt>Plateforme</dt>
            <dd className="text-encre">Next.js · PostgreSQL</dd>
            <dt>Cerveau</dt>
            <dd className="text-encre">Sans algorithme</dd>
            <dt>Éditeur</dt>
            <dd className="text-encre">Quelques mots</dd>
          </dl>
        </div>

        {/* Illustration de l'affiche officielle */}
        <figure className="mx-auto w-full max-w-[280px] sm:max-w-[340px]">
          <div className="overflow-hidden rounded-[18px] border-[3px] border-encre bg-[#FAF2EA] shadow-[8px_8px_0_0_#1F1B12]">
            <Image
              src="/images/editorial/auth.jpg"
              alt="Affiche officielle Quelques mots — enfant écrivant entouré de lettres flottantes"
              width={576}
              height={1024}
              className="h-full w-full object-cover"
            />
          </div>
          <figcaption className="mt-3 text-center font-mono text-[10px] uppercase tracking-wider text-mute">
            Quelques mots — affiche officielle
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
