"use client";

import { UsernameField } from "./UsernameField";

interface OnboardingCardProps {
  username: string;
  onUsernameChange: (val: string) => void;
  available: boolean | null;
  bio: string;
  onBioChange: (val: string) => void;
  acceptTerms: boolean;
  onTermsChange: (val: boolean) => void;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * Formulaire d'accueil après première connexion Google (`/bienvenue`).
 * @param props État du formulaire et gestionnaire de soumission.
 */
export function OnboardingCard(props: OnboardingCardProps) {
  return (
    <form onSubmit={props.onSubmit} className="mx-auto w-full max-w-md space-y-5 rounded-[16px] border border-bord bg-carte p-8">
      <h1 className="font-serif text-3xl text-encre">Choisissez votre plume</h1>
      <UsernameField value={props.username} onChange={props.onUsernameChange} available={props.available} />
      <div className="space-y-1.5">
        <label htmlFor="onb-bio" className="block text-sm font-medium text-encre">Biographie (facultative)</label>
        <textarea id="onb-bio" rows={3} maxLength={160} value={props.bio} onChange={(e) => props.onBioChange(e.target.value)} placeholder="Quelques mots sur vous…" className="w-full rounded-[16px] border border-bord bg-pilule px-4 py-2.5 text-sm text-encre placeholder:text-muted focus:border-encre focus:outline-none" />
      </div>
      <label className="flex items-start gap-2.5 text-sm text-encre">
        <input type="checkbox" checked={props.acceptTerms} onChange={(e) => props.onTermsChange(e.target.checked)} className="mt-1 accent-encre-fort" />
        <span>J&apos;accepte les conditions d&apos;utilisation et la charte éditoriale.</span>
      </label>
      {props.error ? <p className="text-sm text-encre">{props.error}</p> : null}
      <button type="submit" className="min-h-[44px] w-full rounded-full bg-encre-fort px-5 py-2.5 text-sm font-medium text-ivoire transition-opacity hover:opacity-90">
        Entrer sur Quelques mots
      </button>
    </form>
  );
}
