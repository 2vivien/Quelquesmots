import { z } from "zod";
import { countGraphemes } from "@/lib/sanitize";

/** Limites de publication éditoriale. */
export const STUDIO_LIMITS = {
  TITLE_MIN: 3,
  TITLE_MAX: 120,
  BODY_MIN: 20,
  BODY_MAX: 50000,
  THEMES_MIN: 1,
  THEMES_MAX: 5,
} as const;

/** Schéma Zod de validation stricte avant publication (comptage en graphèmes Unicode). */
export const publishSchema = z.object({
  title: z
    .string()
    .trim()
    .min(STUDIO_LIMITS.TITLE_MIN, "Le titre doit contenir au moins 3 caractères.")
    .superRefine((title, ctx) => {
      if (countGraphemes(title) > STUDIO_LIMITS.TITLE_MAX) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Le titre ne doit pas dépasser 120 caractères." });
      }
    }),
  contentText: z
    .string()
    .superRefine((text, ctx) => {
      const graphemes = countGraphemes(text);
      if (graphemes < STUDIO_LIMITS.BODY_MIN) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Votre texte doit contenir au moins 20 caractères." });
      }
      if (graphemes > STUDIO_LIMITS.BODY_MAX) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Votre texte dépasse la limite de 50 000 caractères." });
      }
    }),
  themeIds: z
    .array(z.string().uuid())
    .min(STUDIO_LIMITS.THEMES_MIN, "Choisissez au moins 1 thème.")
    .max(STUDIO_LIMITS.THEMES_MAX, "Maximum 5 thèmes."),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

/** Type inféré de validation de publication. */
export type PublishPayload = z.infer<typeof publishSchema>;
