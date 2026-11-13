"use client";

import { useEffect, useState } from "react";
import { authorsService } from "@/features/authors";
import { useAuth } from "@/features/auth";
import { onboardingSchema, type OnboardingInput } from "../schemas/onboarding.schema";

/**
 * Hook d'onboarding vérifiant la disponibilité du pseudonyme et finalisant le profil.
 * @returns État de validation, disponibilité en direct et fonction de soumission.
 */
export function useOnboarding() {
  const { updateUser } = useAuth();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cleanUsername = username.trim();
  useEffect(() => {
    if (cleanUsername.length < 3) return;
    const timer = setTimeout(async () => {
      const ok = await authorsService.isUsernameAvailable(cleanUsername);
      setAvailable(ok);
    }, 250);
    return () => clearTimeout(timer);
  }, [cleanUsername]);

  const effectiveAvailable = cleanUsername.length < 3 ? null : available;

  const submit = async (): Promise<boolean> => {
    const payload: OnboardingInput = { username, bio, acceptTerms: acceptTerms as true };
    const parsed = onboardingSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Vérifiez vos informations.");
      return false;
    }
    if (effectiveAvailable === false) {
      setError("Ce pseudonyme est déjà utilisé.");
      return false;
    }
    await updateUser({ username: parsed.data.username, bio: parsed.data.bio ?? "", onboarded: true });
    setError(null);
    return true;
  };

  return { username, setUsername, bio, setBio, acceptTerms, setAcceptTerms, available: effectiveAvailable, error, submit };
}
