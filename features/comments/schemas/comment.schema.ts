import { z } from "zod";

/** Schéma Zod de validation d'un commentaire (2 à 500 caractères). */
export const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(2, "Le commentaire doit contenir au moins 2 caractères.")
    .max(500, "Le commentaire est limité à 500 caractères."),
});
