"use client";

import { Minimize2 } from "lucide-react";
import { useRouter } from "next/navigation";

/** Bouton icône pour réduire la page détaillée et revenir au mur. */
export function ReducePostButton() {
  const router = useRouter();
  const handleReduce = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <button
      type="button"
      onClick={handleReduce}
      title="Réduire et revenir au mur"
      aria-label="Réduire ce texte et revenir au mur"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-bord bg-carte text-muted transition-colors hover:bg-pilule hover:text-encre"
    >
      <Minimize2 size={16} strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
