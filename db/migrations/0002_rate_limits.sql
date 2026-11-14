-- Limitation de débit partagée entre instances (compteur atomique par clé, fenêtre fixe).
-- Fail-open côté application si la table est indisponible ; nettoyage opportuniste des fenêtres expirées.
CREATE TABLE "rate_limits" (
  "key" text PRIMARY KEY,
  "window_start" timestamptz NOT NULL DEFAULT now(),
  "count" integer NOT NULL DEFAULT 1
);
