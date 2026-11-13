# Quelques mots — Prompts séquentiels pour agents de code (Claude Code, Cursor, Kimi)

Usage : placer les fichiers `01` à `05` et le dossier `maquettes/` dans un dossier `docs/` du dépôt. Donner à l'agent un prompt à la fois, dans l'ordre. Ne passer au suivant qu'une fois le précédent vérifié (`pnpm typecheck`, `pnpm lint`, `pnpm build`).

## Prompt 0 — Contexte commun (à coller en tête de chaque session, ou dans `CLAUDE.md` / `.cursorrules`)

```
Tu construis « Quelques mots », une plateforme web littéraire de textes courts, en français.
Documents de référence dans docs/ :
- 01-design-system-et-ecrans.md : design, tokens, composants, écrans (à respecter à la lettre)
- 02-cahier-des-charges-suite-et-fin.md : règles métier et fonctionnalités
- 03-architecture-frontend-backend.md : stack, arborescence par feature, schéma, actions
- 05-conventions-de-code.md : règles de code NON NÉGOCIABLES (taille, types, séparation, USE_MOCK, TSDoc, boucle de vérification)
- docs/maquettes/*.png : captures de référence de chaque écran

Règles absolues (détail dans le fichier 05) :
1. Composant : 50 lignes maximum. Page : 120 lignes maximum (strict). Hook, service, store, types : limites du fichier 05 §1. Si une limite est dépassée, découpe avant de continuer.
2. Zéro `any` (ni `as any`, ni @ts-ignore). Types dérivés de Zod et Drizzle. Pas d'enum TypeScript.
3. Séparation stricte : components / hooks / services / stores / types / schemas / utils dans chaque feature. Dépendances à sens unique : composants -> hooks -> services -> db. Jamais d'accès à la base depuis un composant ou un hook.
4. Architecture par feature (src/features/<feature>/...). Import entre features uniquement via index.ts.
5. Pattern USE_MOCK : chaque service a une interface, une implémentation réelle et une implémentation mock, choisies par NEXT_PUBLIC_USE_MOCK. Les mocks reprennent les contenus de la maquette.
6. TSDoc en français sur tout ce qui est exporté + un README.md court par dossier de feature.
7. Stack : Next.js 16 (App Router, proxy.ts, params asynchrones), TypeScript strict, Tailwind v4, shadcn/ui, Tabler Icons, Framer Motion, next/image, next/font, Better Auth (Google), Drizzle + PostgreSQL (Neon), Zod, Tiptap, TanStack Query, Zustand.
8. Respecte exactement les couleurs, la typographie et les espacements du fichier 01. Design gelé : aucun changement visuel non demandé.
9. Code prévu pour 1 million d'utilisateurs : sécurisé, pagination par curseur, index, pas de N+1, limitation de débit, contrôle d'accès côté serveur.
10. Qualité d'abord, puis rapidité ressentie (navigation fluide, squelettes, mises à jour optimistes).
11. En cas de doute sur une bibliothèque ou une pratique, consulte la documentation officielle à jour et choisis la meilleure pratique actuelle.
12. Textes d'interface en français dans src/messages/fr.json.
13. À la fin de CHAQUE tâche, exécute la boucle du fichier 05 §10 (audit technique + check-conventions, sécurité 20 points, QA Playwright comparée aux maquettes). Corrige jusqu'à zéro anomalie, puis résume ce qui est fait et ce qui reste.
Ne laisse aucun TODO, aucune donnée factice hors des fichiers .mock, aucun fichier vide.
```

## Prompt 1 — Initialisation du projet

```
Initialise le projet selon docs/03 §2, §3, §11.
- Next.js 16 + TypeScript strict + Tailwind v4 + Biome (ou ESLint).
- Installe : drizzle-orm, drizzle-kit, @neondatabase/serverless, better-auth, zod, @tanstack/react-query, react-hook-form, @hookform/resolvers, @tiptap/react, @tiptap/starter-kit, @tiptap/extension-placeholder, @tiptap/extension-character-count, @tabler/icons-react, sonner, date-fns, framer-motion, zustand, @upstash/ratelimit, @upstash/redis, vitest, @playwright/test, @axe-core/playwright, dependency-cruiser.
- Initialise shadcn/ui puis restyle-le avec les tokens de docs/01 §5 (globals.css).
- Polices Newsreader et Inter via next/font, exposées en variables CSS.
- Crée l'arborescence par feature de docs/03 §2 (chaque feature avec components/, hooks/, services/, stores/, types/, schemas/, utils/, index.ts et un README.md court) et des pages minimales valides (pas de fichiers vides : chaque page affiche son titre en serif).
- Écris scripts/check-conventions.ts (docs/05 §10) : échoue si composant > 50 lignes, page > 120 lignes, `any`, import entre features hors index.ts, composant important db ou un service, console.log, mock importé hors sélecteur, export sans TSDoc, feature sans README. Ajoute-le aux scripts (`pnpm check`).
- Configure tsconfig strict (noUncheckedIndexedAccess, exactOptionalPropertyTypes) et Biome avec noExplicitAny et noNonNullAssertion en erreur.
- Ajoute NEXT_PUBLIC_USE_MOCK dans lib/env.ts et .env.example.
- Crée lib/env.ts (validation Zod), .env.example, scripts package.json.
Critère : pnpm build et pnpm check passent, la page / affiche « Quelques mots » avec le fond ivoire.
```

## Prompt 2 — Base de données

```
Implémente le schéma Drizzle de docs/03 §5 dans src/db/schema/*.ts avec index et contraintes.
- Corrige ce qui doit l'être : imports manquants (integer), colonne tsvector de recherche (utilise un customType tsvector ou ajoute-la par SQL dans la migration avec un index GIN), index trigram.
- Génère la migration, ajoute au début : CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS unaccent;
- Génère les tables Better Auth avec la CLI (auth:generate) et ajoute les champs role (défaut "user") et onboarded (défaut false).
- Écris scripts/seed.ts : 9 thèmes (Amour, Deuil, Solitude, Vie, Espoir, Santé émotionnelle, Amitié, Pensées, Société) avec accroches (ex. Amour : « Des mots pour aimer, aimer encore. »), tags de départ, paramètres par défaut (max_chars 1500, min_chars 20, max_tags 5).
Critère : migrate + seed fonctionnent sur une base vierge.
```

## Prompt 3 — Authentification et onboarding

```
Implémente l'authentification selon docs/03 §4 et docs/01 écran 12.
- lib/auth.ts, lib/auth-client.ts, route /api/auth/[...all], lib/session.ts, proxy.ts.
- Page /connexion identique à la maquette (plume, « Bienvenue sur Quelques mots », bouton Google, « Plus tard »). Gère le paramètre ?retour= pour revenir sur la page d'origine.
- Page /bienvenue : pseudonyme (règles docs/02 §7.4 : alphanumérique, tiret, underscore, sans espace, unique sans tenir compte de la casse, disponibilité en direct), biographie 160 max, acceptation des conditions. Crée author_profile et passe onboarded à true.
- Menu utilisateur et déconnexion.
- Aucune donnée privée (e-mail, nom Google) ne doit apparaître publiquement.
Critère : parcours complet Google → pseudonyme → mur, testé avec Playwright (mock du fournisseur si nécessaire).
```

## Prompt 4 — Shell visuel et composants communs

```
Construis les composants communs de docs/01 §8 en respectant les maquettes (header.png, ecran-01.png, ecran-13.png) :
- En-tête desktop et mobile, navigation Le mur / Explorer / Thèmes / Auteurs, pilule de recherche, bouton rond « + », avatar, menu utilisateur, pied de page avec la mention « Quelques mots n'est pas un service d'aide. ».
- Chips de filtre, carte de texte (PostCard), métriques, tags, boutons, lignes de liste, champs, états de chargement, états vides, erreurs.
- Visiteur non connecté : bouton « Se connecter » à la place du « + » et de l'avatar.
Fais un fichier de revue visuelle temporaire /dev/composants (supprimé à la fin) pour comparer avec la maquette.
Critère : rendu identique à la maquette à 1440 px et 390 px.
```

## Prompt 5 — Lecture : mur, lecture, thèmes, tags, auteurs, explorer

```
Implémente les écrans 1, 3, 4, 5, 6, 7 de docs/01 avec leurs routes (docs/03 §12).
- features/feed/services : listFeed (curseur, filtres thème/tag/auteur, visibilité PUBLIC/MEMBERS, exclusion des blocages), getPostBySlug, getRelatedPosts.
- displayAuthor() unique pour l'affichage de l'auteur (Anonyme / nom réel / pseudonyme).
- Défilement infini via /api/posts.
- Page de lecture : colonne 680 px, titre serif, corps serif 19-20 px / interligne 1,7, métriques, partage, tags, bandeau image selon le thème, métadonnées SEO et Open Graph (opengraph-image.tsx : carte typographique ivoire).
- Pages thèmes, tags, auteurs (annuaire + profil public), explorer avec suggestions.
- Cache : "use cache" + cacheTag + revalidateTag(tag, profil).
- sitemap.ts, robots.ts.
Chaque feature livre d'abord son service mock (données de la maquette) puis son service réel ; l'interface doit fonctionner avec NEXT_PUBLIC_USE_MOCK=true sans base.
Critère : LCP page de lecture ≤ 2,5 s (Lighthouse mobile), tous les textes MEMBERS en noindex.
```

## Prompt 6 — Recherche globale

```
Implémente docs/02 §11.1 et docs/01 écran 2.
- features/search/services : recherche plein texte française (tsvector + unaccent) + trigram, sur textes, thèmes, auteurs, tags ; onglets Tout / Publications / Thèmes / Auteurs / Tags ; compteur de résultats ; pagination par curseur.
- /api/search/suggest : 5 suggestions mixtes, requête minimale de 2 caractères, debounce 250 ms côté client.
- Les textes PRIVATE et non publiés sont exclus, MEMBERS seulement pour les connectés.
Critère : « amour » trouve « L'amour, encore. » et le thème Amour ; une faute d'une lettre est tolérée.
```

## Prompt 7 — Studio

```
Implémente le Studio (docs/01 écrans 8 et 9, docs/02 §9).
- Tiptap avec Document, Paragraph, Text, Bold, Italic, Blockquote, HardBreak, History, Placeholder, CharacterCount ; immediatelyRender: false ; composant client chargé dynamiquement.
- Champ titre, compteur, tags suggérés (features/tags/services : normalisation, anti-doublons), choix de 1 à 3 thèmes, menu « Visible par », aperçu identique à la page de lecture.
- Sauvegarde automatique 1,5 s, indicateur, copie locale hors ligne, gestion de conflit entre onglets.
- Actions saveDraft, publishPost, unpublishPost, deletePost avec les règles de docs/02 §9.4 (1 500 caractères, 3-120 pour le titre, 1-5 tags, 10 publications / 24 h).
- Slug stable généré à la publication (titre + suffixe court).
- Sanitisation serveur du JSON Tiptap (lib/sanitize.ts).
- Page Brouillons / Bibliothèque avec onglets, menu « … » (Modifier, Supprimer).
- Fenêtre de confirmation de publication.
Critère : un texte de 1 500 caractères est restauré après fermeture de l'onglet, refusé au-delà de la limite, et publié avec une URL stable.
```

## Prompt 8 — Interactions et notifications

```
Implémente docs/02 §10.
- Likes (optimiste, contrainte d'unicité, compteur transactionnel), favoris, commentaires (1 niveau de réponse, 2-500 caractères, masquage par l'auteur du texte, modification 15 min, mentions @pseudo), partage (Web Share API, copie du lien, toast), vues (POST /api/posts/[id]/view, empreinte salée, une par 24 h, après 5 s, exclusion des robots et de l'auteur).
- Notifications (écran 10) : création, regroupement sur 1 h, pastille de non-lus, onglets Textes / Mentions / Interactions, marquage comme lu.
- Limitation de débit sur toutes les écritures.
- Blocage d'utilisateur.
Critère : deux clics rapides sur le like ne créent jamais deux likes ; 10 rafraîchissements = 1 vue.
```

## Prompt 9 — Paramètres et confidentialité

```
Implémente l'écran 11 et docs/02 §12.
- Prénom, nom, pseudonyme, biographie, photo (upload R2), « Publier sous » (Pseudonyme par défaut ; « Anonyme » affiché désactivé avec la mention « Bientôt »), annuaire, date d'inscription.
- Export JSON des données, suppression de compte avec délai de grâce de 14 jours (tâche /api/cron/purge).
- Vérifie qu'aucune API ni aucune page ne divulgue e-mail, prénom ou nom hors choix explicite.
Critère : test d'autorisation prouvant qu'un autre utilisateur ne peut lire ni les brouillons ni les données privées.
```

## Prompt 10 — Modération et administration

```
Implémente docs/02 §13 et §14, et docs/03 pour /admin.
- Signalement sur textes, commentaires et profils (motifs, unicité, 20/jour, priorité automatique pour « danger pour la personne »).
- File de modération, décisions (masquer, rétablir, supprimer, avertir, suspendre, bannir), notification motivée de l'auteur, contestation, journal d'audit.
- Un texte masqué (moderationLocked) ne redevient jamais public par modification de l'auteur.
- Auto-modération à la publication : spam, doublons, mots interdits, détection de détresse (sans suppression, envoi en priorité haute + encart bienveillant avec ressources d'aide configurables par pays).
- Administration : thèmes (CRUD, ordre, image), tags (fusion, blocage, approbation), utilisateurs, texte du jour, paramètres, tableau de bord des indicateurs.
- Accès par requireRole ; tests d'autorisation.
Critère : un modérateur masque un texte, l'auteur est notifié, la page répond 404 au public, l'action apparaît dans l'audit.
```

## Prompt 11 — Qualité, accessibilité, performance, sécurité

```
Finalise :
- Tests Vitest (validations, normalisations, visibilité, scores), Playwright (parcours docs/02 §19, desktop et mobile) avec axe sur chaque page.
- Navigation 100 % clavier, focus visibles, aria-label sur les icônes, cibles ≥ 44 px, prefers-reduced-motion.
- Performance : Lighthouse CI, poids JS du mur ≤ 150 Ko compressés, images WebP/AVIF.
- Sécurité : en-têtes (CSP, nosniff, Referrer-Policy, Permissions-Policy), limitation de débit centralisée, revue des accès (OWASP), absence de secrets dans le code.
- Sentry, pages 404/410/erreur, pages légales (conditions, confidentialité, aide) avec contenu à valider par un juriste.
- Retire /dev/composants et tout code mort.
- Passe complète de la boucle (docs/05 §10) sur tout le dépôt : audit technique, sécurité 20 points, QA Playwright de tous les écrans comparés aux maquettes.
Critère : tous les contrôles passent, `pnpm check` vert, aucun fichier hors limites, aucun TODO dans le code.
```

## Prompt 12 — Déploiement

```
Prépare la mise en production selon docs/03 §10 : variables d'environnement, migrations en phase de release, cron Vercel pour /api/cron/*, domaine et HTTPS, vérification du sitemap et de l'Open Graph, procédure de sauvegarde et de restauration documentée dans docs/RUNBOOK.md.
```

## Notes pour toi

- Chaque prompt se termine par la boucle de vérification du fichier 05 §10 : ne passe pas au suivant tant qu'elle n'est pas verte.

- Après chaque prompt, compare le rendu avec `maquettes/ecran-XX.png` ; si l'agent s'écarte, redonne-lui l'image et la section correspondante du fichier 01.
- Points qui demandent une décision humaine avant lancement : ressources d'aide en santé mentale pour le Bénin, textes juridiques, qui modère (fichier 02 §22).
