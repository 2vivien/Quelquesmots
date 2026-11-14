import { test } from "@playwright/test";

/**
 * Parcours authentifié (OAuth Google → onboarding → Studio → publication → like → signalement → modération).
 * Non exécutable sans un compte Google de test dédié (GOOGLE_TEST_EMAIL / GOOGLE_TEST_PASSWORD et un client OAuth de test).
 * À activer en renseignant ces variables et en levant test.skip.
 */
const hasTestAccount = Boolean(process.env.GOOGLE_TEST_EMAIL && process.env.GOOGLE_TEST_PASSWORD);

test.describe("parcours authentifié", () => {
  test.skip(!hasTestAccount, " nécessite GOOGLE_TEST_EMAIL et GOOGLE_TEST_PASSWORD (compte Google de test)");

  test("OAuth → onboarding → brouillon → publication → interaction", async () => {
    // Volontairement non implémenté : chaque étape ci-dessus serait mockée par de fausses valeurs sans compte réel.
    // L'activation se fera en complétant ce scénario avec un vrai compte de test Google.
  });
});
