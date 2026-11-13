import { z } from "zod";

/** Schéma Zod des règles de choix du pseudonyme et de la biographie. */
export const onboardingSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Le pseudonyme doit contenir au moins 3 caractères.")
    .max(24, "Le pseudonyme ne peut pas dépasser 24 caractères.")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Lettres, chiffres, points, tirets et underscores uniquement.",
    ),
  bio: z
    .string()
    .trim()
    .max(160, "La biographie est limitée à 160 caractères.")
    .optional(),
  acceptTerms: z.literal(true, {
    message: "Veuillez accepter les conditions.",
  }),
});

/** Valeurs du formulaire d'onboarding validées par Zod. */
export type OnboardingInput = z.infer<typeof onboardingSchema>;
