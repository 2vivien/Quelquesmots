import { z } from "zod";

/** Limites de publication éditoriale. */
export const STUDIO_LIMITS = {
  TITLE_MIN: 3,
  TITLE_MAX: 120,
  BODY_MIN: 20,
  BODY_MAX: 1500,
  THEMES_MIN: 1,
  THEMES_MAX: 5,
} as const;

/** Schéma Zod de validation stricte avant publication (1 à 5 thèmes obligatoires, visibilité Tout le monde ou Privé). */
export const publishSchema = z.object({
  title: z
    .string()
    .trim()
    .min(STUDIO_LIMITS.TITLE_MIN, "Le titre doit contenir au moins 3 caractères.")
    .max(STUDIO_LIMITS.TITLE_MAX, "Le titre ne doit pas dépasser 120 caractères."),
  contentText: z
    .string()
    .trim()
    .min(STUDIO_LIMITS.BODY_MIN, "Votre texte doit contenir au moins 20 caractères.")
    .max(STUDIO_LIMITS.BODY_MAX, "Votre texte dépasse la limite de 1 500 caractères."),
  themeSlugs: z
    .array(z.string())
    .min(STUDIO_LIMITS.THEMES_MIN, "Choisissez au moins 1 thème.")
    .max(STUDIO_LIMITS.THEMES_MAX, "Maximum 5 thèmes."),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

/** Type inféré de validation de publication. */
export type PublishPayload = z.infer<typeof publishSchema>;
