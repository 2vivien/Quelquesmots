/**
 * Page statique (ISR : régénère toutes les heures, aucun coût de rendu par requête).
 */
export const revalidate = 3600;

/** Page de politique de confidentialité. */
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-[680px] space-y-5 text-[15px] leading-relaxed text-encre">
      <h1 className="font-serif text-4xl font-normal">Confidentialité</h1>
      <p>
        Vos données personnelles (adresse e-mail, prénom et nom privés) ne sont jamais rendues
        publiques sans votre choix explicite dans les paramètres de publication.
      </p>
      <p className="text-muted">
        Vous pouvez exporter vos données au format JSON ou demander la suppression de votre
        compte à tout moment depuis Paramètres.
      </p>
    </article>
  );
}
