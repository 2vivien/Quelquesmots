/**
 * Page statique (ISR : régénère toutes les heures, aucun coût de rendu par requête).
 */
export const revalidate = 3600;

/** Page des conditions d'utilisation. */
export default function TermsPage() {
  return (
    <article className="mx-auto max-w-[680px] space-y-5 text-[15px] leading-relaxed text-encre">
      <h1 className="font-serif text-4xl font-normal">Conditions d&apos;utilisation</h1>
      <p>
        Chaque auteur demeure propriétaire de ses textes publiés sur Quelques mots et s&apos;engage
        à respecter la bienveillance, le droit d&apos;auteur et les lois en vigueur.
      </p>
      <p className="text-muted">
        Tout contenu manifestement illicite ou haineux peut être masqué par la modération.
      </p>
    </article>
  );
}
