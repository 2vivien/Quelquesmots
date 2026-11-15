/**
 * Page statique (ISR : régénère toutes les heures, aucun coût de rendu par requête).
 */
export const revalidate = 3600;

/** Page d'aide et ressources d'écoute. */
export default function HelpPage() {
  return (
    <article className="mx-auto max-w-[680px] space-y-5 text-[15px] leading-relaxed text-encre">
      <h1 className="font-serif text-4xl font-normal">Aide &amp; accompagnement</h1>
      <p>
        Quelques mots est un espace littéraire et n&apos;est pas un service d&apos;aide médicale ou
        psychologique d&apos;urgence.
      </p>
      <p className="text-muted">
        Si vous traversez un moment difficile, rapprochez-vous d&apos;un proche ou d&apos;un service
        d&apos;écoute local qualifié.
      </p>
    </article>
  );
}
