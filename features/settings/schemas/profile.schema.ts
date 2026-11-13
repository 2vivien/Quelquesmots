import { z } from "zod";

/** Schéma Zod des paramètres modifiables du profil utilisateur. */
export const profileSchema = z.object({
  firstName: z.string().trim().max(40, "Maximum 40 caractères."),
  lastName: z.string().trim().max(40, "Maximum 40 caractères."),
  username: z
    .string()
    .trim()
    .min(3, "Au moins 3 caractères.")
    .max(24, "Maximum 24 caractères.")
    .regex(/^[a-zA-Z0-9._-]+$/, "Format de pseudonyme invalide."),
  bio: z.string().trim().max(160, "Maximum 160 caractères."),
  defaultPublishAs: z.enum(["USERNAME", "REAL_NAME", "ANONYMOUS"]),
  listedInDirectory: z.boolean(),
  showJoinDate: z.boolean(),
});

/** Type inféré du formulaire de profil. */
export type ProfileFormValues = z.infer<typeof profileSchema>;
