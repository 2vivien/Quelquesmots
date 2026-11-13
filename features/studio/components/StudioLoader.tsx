"use client";

import dynamic from "next/dynamic";

const DynamicStudio = dynamic(
  () => import("./StudioScreen").then((m) => m.StudioScreen),
  {
    ssr: false,
    loading: () => <div className="mx-auto h-96 max-w-[720px] animate-pulse rounded-[16px] bg-pilule" />,
  },
);

/** Charge l'éditeur Studio uniquement côté client sans rendu serveur. */
export function StudioLoader({ draftId }: { draftId?: string }) {
  return <DynamicStudio draftId={draftId} />;
}
