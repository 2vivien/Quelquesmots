"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LoginCard, useAuth } from "@/features/auth";

function ConnexionInner() {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);

  const rawRetour = params.get("retour") ?? "/";
  const safeRetour = rawRetour.startsWith("/") && !rawRetour.startsWith("//") ? rawRetour : "/";

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const u = await signInWithGoogle(false);
      router.push(u.onboarded ? safeRetour : "/bienvenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12">
      <LoginCard retourHref={safeRetour} onGoogleLogin={() => void handleGoogle()} loading={loading} />
    </div>
  );
}

/** Page de connexion Google et retour invité (écran 12). */
export default function ConnexionPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-72 max-w-md animate-pulse rounded-[16px] bg-pilule" />}>
      <ConnexionInner />
    </Suspense>
  );
}
