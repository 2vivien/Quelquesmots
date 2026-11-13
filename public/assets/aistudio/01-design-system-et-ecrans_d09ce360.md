# Quelques mots — Design system & spécification des écrans

> *Un espace où les mots restent.* — *Parce que les mots comptent.*

Source : la maquette fournie (12 écrans desktop + mobile). Les images de référence sont dans `maquettes/` (`maquette-complete.png`, `header.png`, `ecran-01.png` … `ecran-13.png`).

**Légende** : tout ce qui n'est pas marqué `[Modif.]` est une reproduction fidèle de la maquette. Les `[Modif.]` sont des améliorations proposées, optionnelles : on peut les ignorer sans casser le design.

---

## 1. Identité

- **Nom** : Quelques mots (le cahier des charges initial parlait de « Mur de mots », remplacé partout).
- **Ton** : littéraire, chaleureux, calme. Un journal littéraire numérique, pas un réseau social.
- **Logo** : le texte « Quelques mots » en serif de grande taille, avec dessous la signature italique « Un espace où les mots restent. ». Pictogramme secondaire : une plume (écran d'authentification et pied de maquette).
- **Principe** : le texte est le héros. Rien dans l'interface ne doit concurrencer la lecture.

## 2. Couleurs (relevées sur la maquette)

| Token | Hex | Usage |
|---|---|---|
| `ivoire` | `#FAF2EA` | Fond de page |
| `carte` | `#FAF5ED` | Fond des cartes et écrans |
| `bord` | `#EBE5DD` | Bordures fines 1 px, séparateurs |
| `pilule` | `#F0E8DE` | Barre de recherche, chips inactifs, champs |
| `encre` | `#282524` | Texte principal, liens de navigation |
| `encre-fort` | `#1E1B1D` | Boutons primaires (« + », « Publier »), chip « Tout » actif |
| `muted` | `#706C69` | Métadonnées (« il y a 12 min »), compteurs, placeholders |
| `accent` | `#B2876D` | Liseré d'avatar, détails chauds (rare) |
| `sepia-overlay` | `rgba(60,48,38,0.45)` | Voile sur les photos de héros (brume) pour garder le texte blanc lisible |
| `blanc-texte` | `#FFFFFF` | Titres sur images de héros |

Règles : aucune couleur vive. Les seules zones sombres sont les boutons primaires et les photos de héros. Aucun dégradé décoratif.

`[Modif.]` Le gris `muted` sur ivoire donne un ratio d'environ 4,6:1, juste au-dessus du seuil AA pour le texte normal. Ne jamais l'éclaircir, et ne pas l'utiliser sous 12 px.

## 3. Typographie

| Rôle | Police recommandée | Détail |
|---|---|---|
| Titres, logo, titre d'un texte | **Newsreader** (alternative : Playfair Display) | Serif éditorial à fort contraste, poids 400/500 |
| Interface, navigation, métadonnées | **Inter** | Poids 400/500/600 |
| Corps du texte en lecture | Newsreader 19–20 px / interligne 1,7 (page de lecture) ; Inter 15 px dans les cartes du mur | |

La maquette est une image : les familles exactes ne sont pas identifiables, les polices ci-dessus sont les plus proches et sont libres (Google Fonts, via `next/font`).

Échelle (desktop / mobile) :

| Style | Desktop | Mobile |
|---|---|---|
| Logo | 44 px | 22 px |
| Titre de page (« Explorer », « Tous les thèmes ») | 40 px | 28 px |
| Titre de texte (page de lecture) | 44 px / 1,15 | 30 px |
| Titre de carte (mur) | 22 px | 20 px |
| Corps | 15–16 px | 15 px |
| Métadonnées | 13 px | 12 px |
| Tags | 13 px | 12 px |

## 4. Espacement, forme, élévation

- Grille de 4 px. Espacements usuels : 8, 12, 16, 24, 32, 48.
- Rayons : cartes 16 px, chips et champs en pilule (9999 px), images de héros 16 px, avatars cercle.
- Bordures : 1 px `bord`. Pas d'ombre forte ; au besoin `0 1px 2px rgba(40,37,36,0.06)`.
- Largeur de lecture : 680 px maximum (page de lecture), 720 px (mur). Page large : 1200 px.
- Marges page : 24 px (mobile 16 px).

## 5. Tokens prêts à l'emploi (Tailwind v4)

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-ivoire: #FAF2EA;
  --color-carte: #FAF5ED;
  --color-bord: #EBE5DD;
  --color-pilule: #F0E8DE;
  --color-encre: #282524;
  --color-encre-fort: #1E1B1D;
  --color-muted: #706C69;
  --color-accent: #B2876D;

  --font-serif: var(--font-newsreader), Georgia, serif;
  --font-sans: var(--font-inter), system-ui, sans-serif;

  --radius-carte: 16px;
  --radius-pilule: 9999px;
}

body { background: var(--color-ivoire); color: var(--color-encre); font-family: var(--font-sans); }
```

## 6. Iconographie

Bibliothèque : **Tabler Icons** (`@tabler/icons-react`), trait fin (stroke 1.5). Icônes utilisées : `IconHeart`, `IconMessageCircle`, `IconEye`, `IconShare`, `IconBookmark`, `IconSearch`, `IconPlus`, `IconBell`, `IconMenu2`, `IconArrowLeft`, `IconArrowRight`, `IconDots`, `IconFeather`, `IconChevronDown`, `IconSettings`, `IconLogout`, `IconHash`. Taille 16-20 px, couleur `muted` au repos, `encre` au survol. Le like actif passe en cœur plein `encre-fort` (pas de rouge, cohérent avec la sobriété).

## 7. Imagerie

- Photos de héros en ambiance brumeuse, sépia, naturelle (forêt, colline, arbre dans la brume, route, rose, feuilles). Elles ne servent qu'aux pages d'exploration, de thème et de lecture.
- Chaque thème a une image : Amour (cœur/rose rosée), Deuil (forêt brumeuse), Solitude (silhouette dans la brume), Vie, Espoir (aube), Société.
- Les images sont en `object-fit: cover`, voile `sepia-overlay` en haut-bas, texte blanc par-dessus.
- Avatars : photos rondes 32–40 px (liste), 96 px (profil). Fallback : initiales sur fond `pilule`.

## 8. Composants

### 8.1 En-tête (desktop)
- Gauche : logo + signature italique.
- Centre-droit : navigation `Le mur` (actif, gras) · `Explorer` · `Thèmes` · `Auteurs`.
- Droite : pilule de recherche « Rechercher… » avec loupe, bouton rond noir `+` (ouvre le Studio), avatar rond avec liseré.
- Visiteur non connecté : le `+` et l'avatar sont remplacés par un bouton « Se connecter ».

### 8.2 En-tête (mobile)
- Logo réduit à gauche ; à droite : icône loupe, icône menu, avatar. Retour `←` et titre sur les pages secondaires.

### 8.3 Chips de filtre
Pilules. Actif : fond `encre-fort`, texte ivoire. Inactif : fond `pilule`, texte `encre`. Suite : `Tout · Amour · Deuil · Solitude · Espoir · Vie` + lien « Voir tous → ». Défilement horizontal sur mobile.

### 8.4 Carte de texte (mur)
Disposition : avatar rond + `pseudo · il y a 12 min` (muted) → titre serif → extrait → tags → ligne de métriques.
- Tags : `#vie #résilience`, couleur `muted`, cliquables, pas de fond sur le mur (fond pilule dans les composants clés).
- Métriques : `♡ 86` · `💬 12` · `👁 2,4k`, et à droite l'icône partage/favori.
- Séparateur 1 px `bord` entre cartes. Pas de carte flottante ombrée : c'est un flux éditorial.

### 8.5 Barre de recherche
Pilule `pilule`, loupe à gauche, placeholder « Rechercher un mot, un thème, un auteur… ». Focus : bordure `encre` 1 px.

### 8.6 Boutons
- Primaire : fond `encre-fort`, texte ivoire, pilule (« Publier », « + »).
- Secondaire : fond transparent, bordure `bord` (« Enregistrer », « Aperçu »).
- Tertiaire : texte seul avec flèche (« Voir tous les thèmes → »).
- Google : fond blanc cassé, bordure `bord`, logo G, texte « Continuer avec Google ».

### 8.7 Menu utilisateur (composants clés)
Entrées : `Voir tous les thèmes`, `Voir tous les auteurs`, `Paramètres`, `Déconnexion`.

### 8.8 Ligne de liste
Miniature carrée 48 px (thème) ou avatar (auteur), titre, sous-ligne muted (« 12,4k textes », « 128 publications »), chevron.

### 8.9 États (à implémenter partout)
Chargement : squelettes `pilule` animés doucement. Vide : phrase douce en italique serif (« Rien ici pour l'instant. »). Erreur : message calme, bouton « Réessayer ». Focus clavier : anneau 2 px `encre` décalé de 2 px.

## 9. Écrans

Pour chaque écran : route, contenu exact de la maquette, comportement, états. Version mobile en une colonne.

### Écran 1 — Mur d'accueil (`/`) — `ecran-01.png`
- Barre de recherche pleine largeur « Rechercher un mot, un thème, un auteur… », chips `Tout · Amour · Deuil · Solitude · Espoir · Vie`, lien « Voir tous → ».
- Flux de cartes. Exemples de la maquette :
  1. `plume.libre · il y a 12 min` — **On ne guérit pas de tout.** — « Certaines choses ne disparaissent jamais vraiment. Elles changent simplement de place en nous. » — `#vie #résilience` — ♡ 86 · 💬 12 · 👁 2,4k
  2. `une.plume · hier` — **À toi que je n'ai jamais oublié.** — « Il y a des souvenirs qui ne demandent pas la permission pour revenir. » — `#souvenirs #absence` — ♡ 120 · 💬 24 · 👁 3,1k
- Comportement : clic sur une carte = page de lecture ; clic sur un tag = page du tag ; clic sur un chip = filtre sans rechargement (paramètre `?theme=amour`) ; défilement infini avec bouton « Charger plus » de repli.
- Mobile : liste compacte, miniature à gauche du titre, chips défilants.
- `[Modif.]` Ajouter un onglet `Récents | Populaires` sous les chips (déjà prévu au cahier des charges ; « Récents » par défaut).

### Écran 2 — Recherche globale (`/recherche?q=amour`) — `ecran-02.png`
- Champ avec la requête, onglets `Tout · Publications · Thèmes · Auteurs · Tags`.
- En-tête de résultat : `#amour — 1 248 résultats`.
- Résultats mélangés avec vignette : texte (« L'amour, encore. — Par plume.libre · 2 min »), thème (« Thème : Amour — 842 publications »), auteur (« Marie.D — Auteur · 128 publications »). Lien « Voir tous les résultats → ».
- Mobile : onglets `Tout · Thèmes · Auteurs` en haut.
- Comportement : suggestions pendant la frappe (debounce 250 ms), touche Entrée = page de résultats, Échap = ferme.

### Écran 3 — Exploration (`/explorer`) — `ecran-03.png`
- Héros photo brume + titre blanc **Explorer** + « Découvrez des textes, des auteurs et des thèmes qui résonnent avec vous. » + bouton clair « Voir tous les thèmes → ».
- Section **Suggestions** : chips `Solitude · Espoir · Mémoire · Littérature`.
- `[Modif.]` Ajouter sous les suggestions deux rails : « Auteurs à découvrir » et « Texte du jour » (prévus au cahier des charges, absents de l'image).

### Écran 4 — Tous les thèmes (`/themes`) — `ecran-04.png`
- Titre **Tous les thèmes**, sous-titre « Explorez les thématiques qui animent notre communauté. », champ « Rechercher un thème… ».
- Grille de tuiles image (3 colonnes desktop) : `Amour 12,4k textes`, `Deuil 8,7k`, `Solitude 9,1k`, `Vie`, `Espoir`, `Société`.
- Mobile : liste de lignes avec miniature (Amour 12,4k, Deuil 8,7k, Solitude 9,1k).
- Note : « Société » apparaît dans la maquette mais pas dans le cahier des charges ; elle est ajoutée aux thèmes initiaux (voir fichier 2).

### Écran 5 — Page de thème (`/themes/[slug]`) — `ecran-05.png`
- Héros image : **Amour**, « Des mots pour aimer, aimer encore. », « 12,4k publications · 24 tags ».
- Chips de tags associés : `#amour #passion #relation #cœur`.
- Onglets `Récents · Plus appréciés · Auteurs`. Le premier onglet liste des cartes de texte ; `Auteurs` liste les auteurs les plus actifs du thème.

### Écran 6 — Page de lecture (`/mots/[slug]`) — `ecran-06.png`
- Bandeau image en tête (forêt), puis colonne de lecture centrée.
- Titre serif **On ne guérit pas de tout.**, ligne « Par plume.libre · il y a 12 min », métriques `♡ 86 · 💬 12 · 👁 2,4k` et lien « Partager ».
- Corps du texte en serif confortable, puis tags `#vie #résilience`.
- Sous le texte : zone de commentaires (non visible sur l'image, voir fichier 2 §Commentaires), « Textes similaires ».
- Mobile : titre 30 px, métriques sur une ligne, partage en icône.

### Écran 7 — Annuaire des auteurs (`/auteurs`) — `ecran-07.png`
- Titre **Nos auteurs**, sous-titre « Découvrez les plumes qui écrivent ici. », champ de recherche d'auteur.
- Lignes : avatar + pseudo + « 128 publications » (`plume.libre` 128, `une.plume` 87, `lise.mots` 54).
- Clic = profil public `/auteurs/[pseudo]`.

### Écran 8 — Studio d'écriture (`/studio`) — `ecran-08.png`
- Barre haute : `← Retour` · `Enregistrer` · `Aperçu` · **Publier** (noir).
- Champ titre en grand « Titre de votre texte… », zone « Commencez à écrire… ».
- Bas : « Tags suggérés : `Amour` `Solitude` `Vie` `Espoir` », « Visible par : Tout le monde ▾ », compteur « 0 caractères ».
- Mobile : barre d'outils réduite ; tags suggérés en chips défilants.
- Comportement : sauvegarde automatique (indicateur discret « Enregistré »), tags suggérés automatiquement à partir du contenu, compteur sur 1 500 caractères (devient `muted` → `encre` à 90 %, bloque à 100 %), bouton Publier désactivé tant que titre/texte vides.
- `[Modif.]` « Visible par » propose : `Tout le monde` / `Connectés` / `Privé`. En complément, l'option « Publier sous » des paramètres est répétée dans ce menu (voir écran 11).

### Écran 9 — Brouillons & Bibliothèque (`/studio/brouillons`, `/bibliotheque`) — `ecran-09.png`
- Deux onglets : `Brouillons` · `Bibliothèque`.
- Lignes brouillon : « Sans titre — Modifié il y a 2 h », « Mes pensées d'hier — Modifié il y a 1 j », « Un jour peut-être — Modifié il y a 2 j », menu `…` (Modifier, Supprimer).
- Bibliothèque : mêmes lignes mais pour les textes enregistrés (favoris), privée.

### Écran 10 — Notifications (`/notifications`) — `ecran-10.png`
- `← Notifications`, onglets `Textes · Mentions · Interactions`.
- Lignes : « plume.libre a aimé votre texte — il y a 2 min », « une.plume a commenté — il y a 12 min », « lise.mots a partagé votre texte — il y a 1 h ».
- Pastille sur l'icône cloche dans l'en-tête si non lu. Clic = ouvre le texte concerné et marque comme lu.

### Écran 11 — Paramètres de profil (`/parametres`) — `ecran-11.png`
- **Mon profil**, avatar avec bouton « Changer la photo ».
- Champs : `Prénom` (Emma), `Nom` (Martin), `Pseudonyme` (em.mots), `Biographie` (« Une lectrice, une rêveuse. »).
- **Publier sous** : ( ) Mon nom ( ) Pseudonyme ( ) Anonyme.
- `[Modif.]` Par défaut : **Pseudonyme** (jamais « Mon nom » préselectionné). Le choix « Anonyme » masque le profil publiquement mais le texte reste rattaché au compte pour la modération ; un texte discret l'indique.
- `[Modif.]` Ajouter en bas : préférences de notifications, export des données, suppression du compte.

### Écran 12 — Authentification & onboarding (`/connexion`) — `ecran-12.png`
- Plume, **Bienvenue sur Quelques mots**, « Connectez-vous pour rejoindre la communauté », bouton **Continuer avec Google**, lien « Plus tard ».
- « Plus tard » ramène au mur en lecture seule.
- Après la première connexion : choix du pseudonyme, biographie facultative, acceptation des conditions (étape décrite dans le cahier des charges §7.3, absente de l'image).

### Composants clés & parcours — `ecran-13.png`
Parcours utilisateur : 1. Se connecter avec Google → 2. Découvrir et lire → 3. Écrire ou interagir → 4. Personnaliser son profil.

Bandeau de pied : « Une expérience littéraire et chaleureuse », « Une recherche globale (publis, thèmes, auteurs) », « Des tags intelligents (suggérés automatiquement) », « Une navigation fluide (desktop & mobile) », « Une accessibilité soignée (lecture, contraste, clavier) ».

## 10. Interactions & micro-animations

| Interaction | Comportement |
|---|---|
| Like | Cœur contour → plein, +1 immédiat (optimiste), rollback en cas d'erreur, 150 ms |
| Favori | Marque-page contour → plein, toast discret « Ajouté à votre bibliothèque » |
| Partage | Web Share API sur mobile ; sinon copie du lien + toast « Lien copié » |
| Chips | Changement de filtre avec fondu 150 ms du flux |
| Cartes | Apparition en fondu + léger glissement de 8 px au défilement, une seule fois |
| Héros | Parallaxe très légère (max 20 px), désactivée si `prefers-reduced-motion` |
| Studio | Indicateur d'enregistrement : « Enregistrement… » → « Enregistré » |
| Navigation | Transitions de page en fondu 120 ms |

Toutes les animations sont coupées avec `prefers-reduced-motion: reduce`.

## 11. Responsive

| Point de rupture | Comportement |
|---|---|
| < 640 px | Une colonne, en-tête compact, chips défilants, actions accessibles au pouce, barre d'onglets basse optionnelle |
| 640–1024 px | Colonne de lecture 680 px centrée, navigation complète |
| > 1024 px | Mur central 720 px, navigation haute complète, grille de thèmes en 3 colonnes |

La version mobile est conçue en premier ; le desktop en est l'extension.

## 12. Accessibilité

- Contraste AA minimum partout, vérifié sur ivoire.
- Navigation complète au clavier, ordre de tabulation logique, anneaux de focus visibles.
- Cibles tactiles ≥ 44 × 44 px.
- Les icônes seules ont un `aria-label` ; les compteurs sont lus « 86 j'aime ».
- Images décoratives avec `alt=""`, images informatives décrites.
- Zoom jusqu'à 200 % sans perte.
- Langue du document `fr`, balisage sémantique (`article`, `nav`, `main`, `h1` unique).

## 13. Modifications proposées par rapport à la maquette (récapitulatif)

1. Ajout de l'onglet Récents / Populaires sur le mur.
2. Ajout des rails « Auteurs à découvrir » et « Texte du jour » sur Explorer.
3. Option « Publier sous » : Pseudonyme par défaut, jamais le vrai nom par défaut.
4. Étape de choix du pseudonyme après la première connexion.
5. Menu « Visible par » du Studio précisé (Tout le monde / Connectés / Privé).
6. Zone de commentaires et « Textes similaires » sous la page de lecture.
7. Paramètres complétés (notifications, export, suppression de compte).
8. Thème « Société » ajouté aux thèmes initiaux.
9. Visiteurs non connectés : bouton « Se connecter » à la place de `+` et avatar.
