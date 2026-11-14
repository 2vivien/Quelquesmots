/**
 * Extrait un message métier sans exposer le corps brut d'une réponse serveur.
 * @param response Réponse HTTP.
 * @param fallback Message générique en français.
 * @returns Message renvoyable à l'utilisateur.
 */
export async function apiErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: { message?: string } };
    return payload.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Transforme une réponse HTTP en erreur explicite lorsqu'elle n'est pas réussie.
 * @param response Réponse HTTP à vérifier.
 * @param fallback Message générique en français.
 */
export async function ensureApiSuccess(response: Response, fallback: string): Promise<void> {
  if (!response.ok) throw new Error(await apiErrorMessage(response, fallback));
}
