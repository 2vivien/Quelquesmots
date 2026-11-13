"use client";

import { useSyncExternalStore } from "react";
import { formatRelativeTime, formatStaticDate } from "@/lib/format";

const subscribe = () => () => {};

/**
 * Affiche un temps relatif côté client tout en gardant un rendu SSR déterministe sans erreur d'hydratation.
 * @param props Date ISO à afficher et préfixe éventuel.
 */
export function RelativeTime({ isoDate, prefix }: { isoDate: string; prefix?: string }) {
  const label = useSyncExternalStore(
    subscribe,
    () => formatRelativeTime(isoDate),
    () => formatStaticDate(isoDate),
  );
  return (
    <time dateTime={isoDate} className="shrink-0">
      {prefix ? `${prefix} ${label}` : label}
    </time>
  );
}
