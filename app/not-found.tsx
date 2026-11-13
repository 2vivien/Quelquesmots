import Link from "next/link";

/** Page 404 sobre et littéraire. */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center space-y-4">
      <h1 className="font-serif text-4xl text-encre">Page introuvable</h1>
      <p className="text-[15px] text-muted">
        Ce texte ou cette page n&apos;existe pas ou n&apos;est plus accessible.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-[44px] items-center rounded-full bg-encre-fort px-6 text-sm text-ivoire"
      >
        Revenir au mur
      </Link>
    </div>
  );
}
