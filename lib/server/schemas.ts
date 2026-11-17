/** Schémas Zod des entrées des routes API (messages d'erreur en français). */
import "./zod-fr";
import { z } from "zod";
import { countGraphemes } from "@/lib/sanitize";
import { profileSchema } from "@/features/settings/schemas/profile.schema";

const shortId = z.string().uuid("Identifiant invalide.");

/** Corps de sauvegarde d'un brouillon (les champs d'auteur sont dérivés de la session). */
export const draftUpsertSchema = z.object({
  id: shortId.optional(),
  title: z.string().trim().max(120).optional(),
  excerpt: z.string().trim().max(280).optional(),
  contentJson: z.unknown().optional(),
  contentText: z
    .string()
    .superRefine((text, ctx) => {
      if (countGraphemes(text) > 50_000) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Votre texte dépasse la limite de 50 000 caractères." });
      }
    })
    .optional(),
  publishAs: z.enum(["USERNAME", "REAL_NAME", "ANONYMOUS"]).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  themeIds: z.array(z.string().uuid()).max(5).optional(),
  tagIds: z.array(z.string().uuid()).max(8).optional(),
  heroImageUrl: z
    .string()
    .trim()
    .max(512)
    .regex(/^(\/|https:\/\/)/, "URL d'image invalide.")
    .optional(),
  commentsEnabled: z.boolean().optional(),
});

/** Commentaire : corps validé, auteur dérivé de la session. */
export const commentCreateSchema = z.object({
  body: z.string().trim().min(2, "Le commentaire doit contenir au moins 2 caractères.").max(500, "Le commentaire est limité à 500 caractères."),
  parentId: shortId.nullable().optional(),
});

/** Signalement utilisateur. */
export const reportCreateSchema = z.object({
  targetType: z.enum(["POST", "COMMENT", "USER"]),
  targetId: shortId,
  targetLabel: z.string().trim().min(1).max(200),
  reason: z.enum(["SPAM", "HARASSMENT", "HATE", "DANGER", "OTHER"]),
  details: z.string().trim().max(1000).default(""),
});

/** Décision de modération (administrateur). */
export const moderateSchema = z.object({
  reportId: shortId,
  targetId: shortId,
  targetLabel: z.string().trim().min(1).max(200),
  action: z.enum(["HIDE", "RESTORE", "DISMISS"]),
  reason: z.string().trim().min(1).max(500),
});

/** Changement de statut d'un signalement. */
export const reportStatusSchema = z.object({
  status: z.enum(["RESOLVED", "DISMISSED"]),
});

/** Verrouillage/masquage administratif d'un texte. */
export const adminPostPatchSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "UNDER_REVIEW", "HIDDEN", "DELETED"]),
  locked: z.boolean(),
});

/** Paramètres globaux du site. */
export const siteSettingsSchema = z.object({
  maxChars: z.number().int().min(100).max(50_000),
  minChars: z.number().int().min(1).max(500),
  maxTags: z.number().int().min(1).max(10),
  dailyPublishLimit: z.number().int().min(1).max(100),
});

/** Marquage notifications lues (ids de l'utilisateur courant uniquement). */
export const notificationsReadSchema = z.object({
  ids: z.array(shortId).min(1).max(100),
});

/** Suggestion de tags à partir d'un texte. */
export const tagsSuggestSchema = z.object({
  text: z.string().trim().min(1).max(5_000),
});

/** Profil utilisateur (édition des paramètres). */
export { profileSchema };

/** Mise à jour partielle du profil (au moins un champ), onboarding inclus. */
export const profilePatchSchema = profileSchema
  .partial()
  .extend({
    onboarded: z.boolean().optional(),
    avatarUrl: z
      .string()
      .trim()
      .max(512)
      .refine((v) => v.startsWith("/") || v.startsWith("https://"), "URL de photo invalide.")
      .optional(),
  })
  .refine((value) => Object.values(value).some((v) => v !== undefined), {
    message: "Aucun champ à mettre à jour.",
  });
