"use client";

import { useRouter } from "next/navigation";
import { OnboardingCard, useOnboarding } from "@/features/onboarding";

/** Page de choix du pseudonyme après la première connexion. */
export default function OnboardingPage() {
  const router = useRouter();
  const ob = useOnboarding();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await ob.submit();
    if (ok) router.push("/");
  };

  return (
    <div className="py-10">
      <OnboardingCard
        username={ob.username}
        onUsernameChange={ob.setUsername}
        available={ob.available}
        bio={ob.bio}
        onBioChange={ob.setBio}
        acceptTerms={ob.acceptTerms}
        onTermsChange={ob.setAcceptTerms}
        error={ob.error}
        onSubmit={(e) => void onSubmit(e)}
      />
    </div>
  );
}
