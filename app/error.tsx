"use client";

/** Écran de repli calme en cas d'erreur inattendue. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-20 text-center space-y-4">
      <h1 className="font-serif text-3xl text-encre">Une erreur est survenue</h1>
      <p className="text-sm text-muted">Le chargement a été interrompu un instant.</p>
      <button
        type="button"
        onClick={reset}
        className="min-h-[44px] rounded-full bg-encre-fort px-6 text-sm text-ivoire"
      >
        Réessayer
      </button>
    </div>
  );
}
