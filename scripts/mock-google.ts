/**
 * Bouchon Google OAuth pour les tests e2e (jamais utilisé ailleurs).
 * Émule https://oauth2.googleapis.com/token et /oauth2/v3/userinfo sur 127.0.0.1:3999.
 * Démarrage : bun run scripts/mock-google.ts
 *
 * Deux modes :
 * - code `mock-e2e-code` (auth.spec.ts) → profil fixe historique
 *   `e2e.test@example.com` / sub `e2e-mock-google-sub-0001` ;
 * - code `mock-e2e-<tag>` → profil dérivé déterministe
 *   `e2e-<tag>@example.com` / sub `mock-sub-<tag>` (permet de créer
 *   plusieurs utilisateurs distincts dans la base de test, avec nettoyage en cascade).
 */
import { createServer } from "node:http";

const LEGACY_PROFILE = {
  sub: "e2e-mock-google-sub-0001",
  email: "e2e.test@example.com",
  given_name: "E2E",
  family_name: "Testeur",
  picture: "https://example.com/e2e-avatar.png",
};

function parseCode(body: string): string | null {
  const match = body.match(/(?:^|&)code=([^&]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function profileFromToken(token: string): typeof LEGACY_PROFILE {
  // Format `mock-e2e-<tag>` ; le tag `code` seul reste sur le profil historique.
  const match = token.match(/^mock-e2e-([a-z0-9-]{1,64})$/i);
  const tag = match?.[1];
  if (!tag || tag.toLowerCase() === "code") return LEGACY_PROFILE;
  const normalized = tag.toLowerCase();
  return {
    sub: `mock-sub-${normalized}`,
    email: `e2e-${normalized}@example.com`,
    given_name: `E2E-${normalized}`,
    family_name: "Testeur",
    picture: "https://example.com/e2e-avatar.png",
  };
}

createServer((req, res) => {
  if (req.method === "POST" && req.url === "/token") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      const code = parseCode(body);
      if (!code) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "invalid_request" }));
        return;
      }
      // Jeton de passage : /userinfo en dérive le profil (déterministe par code).
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ access_token: code, token_type: "Bearer", expires_in: 3600 }));
    });
    return;
  }
  if (req.method === "GET" && req.url === "/userinfo") {
    const authorization = req.headers.authorization ?? "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(profileFromToken(token)));
    return;
  }
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not_found" }));
}).listen(3999, "127.0.0.1", () => {
  console.log("mock-google listening on 127.0.0.1:3999");
});
