# Quelques mots — Conventions de code (règles non négociables)

Ces règles s'appliquent à tout le dépôt, sans exception. Elles priment sur les exemples de code des fichiers 03 et 04 (ceux-ci sont illustratifs et plus longs que les limites ci-dessous).

Marquage : **[règle]** = règle fixe de tes conventions. **[proposé]** = limite que j'ajoute pour compléter, à ajuster.

## 1. Limites de taille

| Type de fichier | Limite | Statut |
|---|---|---|
| Composant React | **50 lignes maximum** | [règle] |
| Page (`page.tsx`) | **120 lignes maximum** | [règle, strict] |
| Layout, `loading.tsx`, `error.tsx` | 60 lignes | [proposé] |
| Hook | 60 lignes | [proposé] |
| Service, query, action | 120 lignes (un fichier par groupe cohérent) | [proposé] |
| Store | 80 lignes | [proposé] |
| Fichier de types | 100 lignes (un fichier par entité) | [proposé] |
| Schéma Zod | 80 lignes | [proposé] |
| Fonction | 30 lignes, 3 paramètres max (sinon objet) | [proposé] |

Comment tenir 50 lignes : un composant = une responsabilité. La logique va dans un hook, les données dans un service, les types dans `types/`, les sous-parties dans des sous-composants. Une page ne fait que composer des composants de features et appeler les queries serveur. Si une limite est dépassée, on découpe avant de continuer ; on ne la relève jamais.

Décompte [proposé] : toutes les lignes du fichier comptent, imports et lignes vides compris, vérifiées par script. Si tu comptes autrement (par exemple sans les imports), ajuste le script `check-conventions.ts`.

## 2. Typage

- **Zéro `any`** [règle]. Interdit aussi : `as any`, `// @ts-ignore`, `// @ts-expect-error` sans justification, `Function`, `Object`.
- `tsconfig` : `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true`, `"exactOptionalPropertyTypes": true`.
- Données inconnues (JSON, réponses externes) : `unknown` puis validation Zod, jamais un cast.
- Les types dérivent des schémas Zod (`z.infer`) et des tables Drizzle (`$inferSelect`, `$inferInsert`) : une seule source de vérité.
- Pas de `enum` TypeScript : unions de chaînes littérales ou objets `as const`.
- Types de retour explicites sur les fonctions exportées.
- Règle ESLint/Biome : `noExplicitAny` en erreur, `noNonNullAssertion` en erreur (pas de `!` sauf validé par `env.ts`).

## 3. Séparation stricte hooks / services / stores / types

Chaque feature a ces dossiers, et un fichier ne mélange jamais deux rôles.

| Dossier | Rôle | Interdit |
|---|---|---|
| `components/` | Affichage uniquement, props typées | Appels réseau, accès base, logique métier |
| `hooks/` | Lien entre l'interface et les services (TanStack Query, état local, effets) | JSX, accès base |
| `services/` | Accès aux données et règles métier (réel ou mock) | JSX, hooks React |
| `stores/` | État global d'interface (Zustand), petit et ciblé | Données serveur (elles vont dans TanStack Query) |
| `types/` | Types et interfaces de la feature | Logique |
| `schemas/` | Schémas Zod et types déduits | Logique |
| `utils/` | Fonctions pures sans effet de bord | Imports de React ou de la base |

Sens des dépendances : `components → hooks → services → db`. Jamais l'inverse. Un composant n'importe jamais `db` ni un service directement : il passe par un hook (composants client) ou par une query serveur appelée dans la page.

## 4. Pattern `USE_MOCK`

Même schéma que dans tes autres projets.

- Variable : `NEXT_PUBLIC_USE_MOCK=true|false` validée dans `lib/env.ts`.
- Chaque service a une **interface** (`types/`), une implémentation **réelle** et une implémentation **mock** ; un fichier `index.ts` choisit selon la variable.

```
features/posts/services/
  posts.service.ts       # interface PostsService + sélection mock/réel
  posts.real.ts          # Drizzle / Server Actions
  posts.mock.ts          # données factices typées
  posts.mock-data.ts     # jeux de données (textes, auteurs, thèmes de la maquette)
```

```ts
// posts.service.ts
import type { PostsService } from "../types/posts.types";
import { postsMock } from "./posts.mock";
import { postsReal } from "./posts.real";

/** Sélectionne l'implémentation du service selon `USE_MOCK`. */
export const postsService: PostsService = env.USE_MOCK ? postsMock : postsReal;
```

- Les données mock reprennent les contenus de la maquette (plume.libre, une.plume, « On ne guérit pas de tout. », etc.) pour permettre de développer tout le frontend sans base.
- Le code de production n'importe jamais directement un fichier `.mock.ts` hors du sélecteur.
- Un test vérifie que les deux implémentations respectent la même interface.

## 5. Architecture par feature (remplace l'arborescence par couches)

```
src/
├─ app/                    # routes uniquement : pages ≤ 120 lignes, layouts, route handlers fins
├─ features/
│  └─ <feature>/
│     ├─ README.md         # court : rôle, API publique, dépendances
│     ├─ components/       # ≤ 50 lignes chacun, un composant par fichier
│     ├─ hooks/
│     ├─ services/
│     ├─ stores/
│     ├─ types/
│     ├─ schemas/
│     ├─ utils/
│     └─ index.ts          # API publique : seuls exports importables par d'autres features
├─ components/ui/          # shadcn (restylé) — transverse
├─ components/layout/      # en-tête, pied de page — transverse
├─ lib/                    # auth, env, ratelimit, sanitize, time, format, errors
├─ db/                     # schéma Drizzle, connexion
├─ messages/fr.json
└─ types/                  # types globaux transverses
```

Features : `auth`, `onboarding`, `feed`, `reader`, `posts`, `studio`, `interactions` (likes, favoris, partage, vues), `comments`, `tags`, `themes`, `authors`, `search`, `explore`, `library`, `notifications`, `settings`, `moderation`, `admin`.

Règles :
- Une feature n'importe une autre feature que via son `index.ts`.
- Pas d'import circulaire (vérifié par `madge` ou `dependency-cruiser` dans la boucle de vérification).
- Le détail des fichiers de chaque feature est donné dans le fichier 03 §2.

## 6. Documentation

- **TSDoc en français**, dans le code, sur chaque fonction, hook, composant et type exportés : rôle, paramètres, valeur retournée, exceptions.

```ts
/**
 * Bascule le like d'un texte pour l'utilisateur connecté.
 * @param postId Identifiant du texte.
 * @returns Le nouvel état du like et le compteur à jour.
 * @throws AppError `RATE_LIMITED` si plus de 60 likes par minute.
 */
```

- **Un `README.md` court par dossier de feature** (≤ 30 lignes) : à quoi sert la feature, son API publique, ses dépendances, comment la tester.
- Commentaires uniquement pour expliquer le « pourquoi », jamais le « quoi » évident.

## 7. Stack front (conforme à tes préférences)

| Besoin | Choix |
|---|---|
| Styles | Tailwind CSS |
| Composants | shadcn/ui (restylé avec les tokens du fichier 01) |
| Animations | **Framer Motion** (`framer-motion`) |
| Icônes | **Tabler Icons** (`@tabler/icons-react`), trait fin (stroke 1.5) |
| Images | `next/image` |
| Polices | `next/font` |
| État serveur | TanStack Query |
| État d'interface | Zustand |

Mise à jour du fichier 01 §6 : la liste d'icônes devient Tabler : `IconHeart`, `IconMessageCircle`, `IconEye`, `IconShare`, `IconBookmark`, `IconSearch`, `IconPlus`, `IconBell`, `IconMenu2`, `IconArrowLeft`, `IconArrowRight`, `IconDots`, `IconFeather`, `IconChevronDown`, `IconSettings`, `IconLogout`, `IconHash`.

## 8. Qualité avant vitesse, puis vitesse

Priorité : 1. qualité du code, 2. rapidité ressentie (navigation fluide, sans chargement visible).

Pour la fluidité :
- Rendu serveur et cache (`"use cache"`) sur les pages publiques ; `loading.tsx` avec squelettes sur chaque route.
- Préchargement des liens (`<Link prefetch>`), transitions de page courtes.
- Mises à jour optimistes (like, favori) ; aucune attente visible sur une action simple.
- Images dimensionnées, `priority` sur l'image de tête, pas de décalage de mise en page.
- Découpage du code : Tiptap, panneau admin et Framer Motion complexes chargés à la demande.

## 9. Code prêt pour 1 million d'utilisateurs (sécurité et maintenabilité)

**Données et performance**
- Pagination par curseur partout, jamais de `OFFSET` sur le mur.
- Index sur chaque colonne de filtre et de tri (déjà prévus au fichier 03 §5) ; pas de requête N+1 ; sélection des seules colonnes nécessaires.
- Compteurs dénormalisés (`like_count`, `comment_count`, `view_count`) mis à jour de façon transactionnelle ou agrégés par tâche planifiée.
- Connexions Neon via le pooler ; lectures lourdes (recherche) sur un réplica en lecture si besoin.
- Cache partagé pour les pages publiques, jamais pour les données liées à l'utilisateur.
- Limitation de débit sur toute route d'écriture et sur la recherche.
- Aucune opération longue dans une requête : file d'attente ou tâche planifiée.

**Sécurité**
- Contrôle d'accès côté serveur à chaque requête (session, propriétaire, rôle, visibilité).
- Validation Zod de toute entrée ; sanitisation du JSON Tiptap ; aucun HTML utilisateur brut.
- Secrets dans les variables d'environnement validées au démarrage.
- En-têtes de sécurité, CSRF, cookies `HttpOnly`/`Secure`/`SameSite`.
- Journal d'audit des actions sensibles ; aucune donnée personnelle dans les logs.

**Maintenabilité**
- Petits fichiers, une responsabilité, dépendances à sens unique (§3, §5).
- Un seul endroit pour chaque règle métier (ex. `displayAuthor()`, règles de visibilité).
- Tests sur les règles métier et les parcours critiques.

## 10. La « boucle » de vérification (générateur / vérificateurs)

À appliquer après chaque prompt du fichier 04, sans exception. L'agent génère, puis passe trois vérificateurs, corrige, et recommence jusqu'à zéro anomalie.

**Vérificateur 1 — Audit technique**
- `pnpm typecheck`, `pnpm lint`, `pnpm build`, tests.
- Script `scripts/check-conventions.ts` qui échoue si : un composant > 50 lignes, une page > 120 lignes, un `any`, un import entre features hors `index.ts`, un composant qui importe `db` ou un service, un `console.log`, un fichier mock importé hors sélecteur, une fonction exportée sans TSDoc, un dossier de feature sans README.
- Détection de cycles d'import et de code mort.

**Vérificateur 2 — Sécurité (liste de contrôle de 20 points)**
Base proposée, à remplacer ou compléter par ton skill de sécurité habituel :
1. Authentification sur chaque action protégée. 2. Autorisation par rôle. 3. Propriété des ressources (IDOR). 4. Visibilité des textes (PRIVATE / MEMBERS). 5. Validation Zod de toute entrée. 6. Injection SQL (requêtes paramétrées uniquement). 7. XSS (aucun HTML brut, sanitisation Tiptap). 8. CSRF. 9. Limitation de débit. 10. Énumération d'utilisateurs. 11. Secrets absents du code et du client. 12. Variables `NEXT_PUBLIC_` ne contenant aucun secret. 13. Cookies de session sécurisés. 14. En-têtes de sécurité (CSP...). 15. Redirections ouvertes (`?retour=`). 16. Téléversements (type, taille, nom). 17. Fuite de données privées (e-mail, nom) dans les réponses et les pages. 18. Journalisation sans données personnelles. 19. Dépendances vulnérables (`pnpm audit`). 20. Messages d'erreur sans détail interne.

**Vérificateur 3 — QA frontend / UX par parcours de clics (Playwright MCP)**
- Parcourir chaque écran en desktop (1440 px) et mobile (390 px) et comparer avec `maquettes/ecran-XX.png`.
- Cliquer chaque bouton, chaque lien, chaque chip, chaque menu ; vérifier états de chargement, vides et erreurs.
- Parcours complets du fichier 02 §19, navigation clavier, `axe` sans violation.
- Capturer les écarts visuels et les corriger.

Sortie de la boucle : un court rapport (ce qui a été vérifié, ce qui a été corrigé, ce qui reste), puis passage au prompt suivant seulement si tout est vert.

## 11. Règle sur le design

Design gelé : aucune modification visuelle hors demande explicite. Les couleurs, polices et espacements viennent uniquement des tokens du fichier 01. Lors d'un refactoring, comparer le rendu avec les maquettes et avec le dernier commit stable.

## 12. Git et refactoring

- Commits petits et fréquents, un par tâche ; message en français à l'impératif.
- Avant de modifier un fichier trop gros ou non conforme : le refactoriser d'abord (sans changer le comportement ni le visuel), vérifier, puis appliquer la modification.
- Après chaque modification : comparer avec le commit stable le plus proche, vérifier que tous les imports sont corrects, re-vérifier les règles de taille sur chaque fichier touché.
