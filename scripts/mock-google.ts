/**
 * Bouchon Google OAuth pour les tests e2e (jamais utilisé ailleurs).
 * Émule https://oauth2.googleapis.com/token et /oauth2/v3/userinfo sur 127.0.0.1:3999.
 * Démarrage : bun run scripts/mock-google.ts
 */
import { createServer } from "node:http";

const PROFILE = {
  sub: "e2e-mock-google-sub-0001",
  email: "e2e.test@example.com",
  given_name: "E2E",
  family_name: "Testeur",
  picture: "https://example.com/e2e-avatar.png",
};

createServer((req, res) => {
  if (req.method === "POST" && req.url === "/token") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      if (!body.includes("code=")) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "invalid_request" }));
        return;
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ access_token: "mock-access-token-e2e", token_type: "Bearer", expires_in: 3600 }));
    });
    return;
  }
  if (req.method === "GET" && req.url === "/userinfo") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(PROFILE));
    return;
  }
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not_found" }));
}).listen(3999, "127.0.0.1", () => {
  console.log("mock-google listening on 127.0.0.1:3999");
});
