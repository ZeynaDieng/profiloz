# 01 — Analyse Produit Profilo'Z

> **Statut :** Document d'architecture — à valider avant implémentation  
> **Version :** 1.0  
> **Date :** 23 juin 2025

---

## 1. Synthèse exécutive

Profilo'Z est un générateur de CV professionnel orienté **simplicité**, **rapidité** et **conformité ATS**. La V1 permet de créer un CV sans compte obligatoire, avec inscription proposée uniquement après génération.

**Proposition de valeur :**
- Création manuelle guidée (wizard 6 étapes)
- Import de documents existants (CV, diplômes, attestations) avec extraction OCR
- 10 modèles de CV extensibles
- Prévisualisation temps réel et export PDF
- Compte optionnel pour sauvegarde et historique

---

## 2. Analyse des maquettes Stitch

### 2.1 Écrans fournis

| Écran | Fichier source | État | Commentaire |
|-------|----------------|------|-------------|
| Landing page | Stitch | ✅ Complet | Base UX validée |
| Sélection modèle | Stitch | ⚠️ Partiel | Images placeholder, `document.write` |
| Succès post-génération | Stitch | ✅ Complet | Flow compte optionnel OK |
| Import CV | Stitch | ⚠️ Partiel | Simulation upload, pas diplôme/attestation |
| Wizard CV — Étape 1 | Stitch | ⚠️ Partiel | 5 étapes manquantes (2–6) |
| Inscription | Stitch | ✅ Complet | Pas de connexion |
| Dashboard | Stitch | ✅ Complet | Sidebar cohérente |
| Générateur lettre de motivation | Stitch | ✅ Complet | Références IA à retirer V1 |
| Éditeur / Preview CV | Stitch | ✅ Complet | A4 live preview OK |

### 2.2 Écrans manquants (à créer)

| Écran | Priorité | Description |
|-------|----------|-------------|
| Connexion (Sign In) | P0 | Référencé landing + signup, absent |
| Wizard — Éducation (étape 2) | P0 | Suite logique étape 1 |
| Wizard — Expérience (étape 3) | P0 | Cœur métier |
| Wizard — Compétences (étape 4) | P0 | Tags + niveaux |
| Wizard — Certifications (étape 5) | P1 | Optionnel mais prévu PRD |
| Wizard — Centres d'intérêt (étape 6) | P2 | Optionnel |
| Import diplôme | P0 | PRD explicite |
| Import attestation | P0 | PRD explicite |
| Correction post-OCR | P0 | Écran dédié ou réutilisation import |
| Choix parcours initial | P1 | Créer vs Importer vs Importer doc |
| Paramètres utilisateur | P2 | Référencé sidebar |
| Analytics | P3 | Placeholder dashboard, hors V1 |
| Pricing | P3 | Landing only, hors V1 fonctionnelle |
| Mot de passe oublié | P2 | Post-compte |
| Liste documents (historique) | P1 | PRD explicite |
| Édition contenu CV (formulaire) | P0 | Distinct de l'éditeur visuel |

---

## 3. Incohérences identifiées dans les maquettes

### 3.1 Navigation et shells

| Problème | Impact | Recommandation |
|----------|--------|----------------|
| 3 types de shell (marketing, dashboard sidebar, transactional) | Cohérence UX | Définir 3 layouts Nuxt : `default`, `dashboard`, `wizard` |
| Sidebar dashboard : items Analytics/Settings sans écrans | Confusion | Masquer ou badge « Bientôt » en V1 |
| Cover Letter : sidebar offset `top-16` vs dashboard `top-0` | Bug visuel | Unifier composant `AppSidebar` |
| Footer dupliqué 4 variantes | Maintenance | Composant `AppFooter` avec props `variant` |

### 3.2 Contenu et marché

| Problème | Correction V1 |
|----------|---------------|
| Textes 100 % anglais | Franciser UI (fr-FR par défaut, i18n ready) |
| « AI-Powered Extraction », « AI Optimization » | Remplacer par « Import intelligent », « Analyse de conformité » |
| « Trusted by 50,000+ » sans preuve | Retirer ou remplacer par bénéfice factuel |
| Dates © 2024 | Mettre à jour dynamiquement |
| Catégories templates anglaises | Mapper vers les 10 modèles PRD |

### 3.3 Technique des maquettes

| Problème | Risque prod | Solution |
|----------|-------------|----------|
| Tailwind CDN + config inline | Non maintenable | Tokens → CSS variables Tailwind v4 |
| `document.write` pour templates | XSS, perf | Rendu Vue + data-driven |
| Images Googleusercontent (AIDA) | Dépendance externe | Assets locaux + placeholders SVG |
| Pas de `<input type="file">` réel | Upload non fonctionnel | Composable `useFileUpload` |
| Wizard « Continue » = `reload()` | Flow cassé | Router + store Pinia |
| Double chargement Material Symbols | Perf | Import unique via Nuxt UI |

### 3.4 Parcours utilisateur

| Incohérence | Détail |
|-------------|--------|
| Landing → Wizard vs Import | Boutons sans routes définies |
| Import → Wizard | « Confirm & Continue to Step 2 » mais wizard commence à Personal Info |
| Succès → Dashboard | « Continue as Guest » sans persistance claire |
| Éditeur vs Wizard | Deux modes d'édition non reliés dans les maquettes |

**Décision architecture :** Un seul modèle de données `Resume` alimente wizard, import OCR, éditeur et preview.

---

## 4. Critique de la stack imposée

### 4.1 Nuxt 4 (frontend) + Next.js 15 (backend)

**Points positifs :**
- Séparation claire présentation / API
- Next.js Route Handlers adaptés aux uploads, OCR, PDF
- Nuxt excellent pour SSR landing + SPA dashboard

**Points de vigilance :**

| Risque | Mitigation |
|--------|------------|
| Double écosystème JS (2 bundlers, 2 configs) | Monorepo Turborepo + packages partagés `types`, `validators` |
| Auth cross-domain | JWT httpOnly + refresh token, même domaine prod via reverse proxy |
| Duplication DTO/validators | Package `@profiloz/shared` (Zod schemas) |
| Coût cognitive équipe | Documentation stricte, conventions nommées |

**Alternative évaluée (non retenue — contrainte projet) :** Nuxt full-stack avec server routes. Rejetée car stack backend imposée.

### 4.2 Local Storage MVP + PostgreSQL

**Cohérence :** Le MVP sans compte stocke le brouillon CV en `localStorage` côté client. À l'inscription, migration vers API PostgreSQL.

**Risque :** Perte de données si l'utilisateur change d'appareil avant inscription.

**Mitigation :** Export JSON local + rappel visuel « Sauvegardez votre compte ».

### 4.3 Tesseract OCR

**Limites V1 :**
- Qualité variable sur PDF scannés
- Lent sur gros fichiers
- Pas de structuration sémantique native

**Architecture :** Interface `OcrProvider` avec implémentations `TesseractOcrProvider` et `ExternalOcrProvider` (stub V2).

### 4.4 Puppeteer PDF

**Limites :**
- Consommation mémoire élevée en conteneur
- Nécessite Chrome headless dans Docker

**Mitigation :** Pool de browsers, queue BullMQ (phase 2 si volume), timeout strict.

---

## 5. Améliorations proposées

### 5.1 Produit

1. **Parcours unifié « Créer mon CV »** — modal choix : Manuel / Importer CV / Importer diplôme / Importer attestation
2. **Score de complétude** — conserver l'indicateur des maquettes, calculé côté domaine (pas UI)
3. **Lettre de motivation** — templates statiques V1, pas de génération « IA »
4. **Modèles francisés** — libellés et sections adaptés (permis, langues, photo optionnelle selon modèle)

### 5.2 Technique

1. **Package `@profiloz/resume-schema`** — schéma Zod partagé FE/BE
2. **Template engine** — composants Vue par modèle + registry JSON
3. **Event sourcing léger** — historique versions CV (dashboard)
4. **Idempotency keys** — sur génération PDF et OCR

### 5.3 UX (sans refaire les maquettes)

1. Francisation textes uniquement
2. Suppression mentions IA V1
3. Catégories : Étudiant, Professionnel, Moderne, Développeur, Commercial, Manager, International, Minimaliste, Créatif, Premium
4. Ajout écrans manquants en respectant design tokens existants

---

## 6. Périmètre V1 vs V2

### V1 (MVP livrable)

- Landing, wizard complet, import CV/diplôme/attestation
- OCR Tesseract + correction manuelle
- 10 templates + preview + PDF
- Compte optionnel post-génération
- Dashboard basique (liste CV, duplication, téléchargement)
- Historique documents importés
- Lettres de motivation (templates remplissables)
- Docker + CI basique

### V2 (hors scope initial)

- Analytics, pricing, paiement
- OCR cloud (Google Vision, AWS Textract)
- IA rédactionnelle (si relancée)
- Collaboration / partage lien
- ATS scoring avancé
- Mobile app

---

## 7. Personas

| Persona | Besoin | Parcours principal |
|---------|--------|-------------------|
| Étudiant | Premier CV, peu d'expérience | Wizard + modèle Étudiant |
| Professionnel | Mise à jour rapide | Import CV + correction |
| Cadre | Multi-versions | Compte + dashboard |
| Candidat international | Photo, langues | Modèle International |

---

## 8. Métriques de succès V1

| Métrique | Cible |
|----------|-------|
| Time-to-PDF (parcours manuel) | < 15 min |
| Taux complétion wizard | > 60 % |
| Taux conversion guest → compte | > 25 % |
| OCR champs corrects (sans correction) | > 70 % |
| Génération PDF | < 10 s p95 |
| Disponibilité | 99.5 % |

---

## 9. Décisions en attente de validation

| # | Question | Recommandation |
|---|----------|----------------|
| D1 | Langue par défaut | fr-FR, en-US phase 2 |
| D2 | Photo sur CV | Optionnelle, modèle-dépendant |
| D3 | Limite CV sans compte | 1 CV actif, export illimité |
| D4 | Taille max upload | 10 Mo (aligné maquette) |
| D5 | Formats acceptés | PDF, DOCX, JPG, PNG |
| D6 | Sous-domaines prod | `app.profiloz.fr` + `api.profiloz.fr` ou path `/api` |

---

## 10. Conclusion

Les maquettes Stitch fournissent une **base UX solide et premium**. Les principaux travaux V1 sont :

1. Combler les écrans manquants sans redesign
2. Unifier navigation et design tokens
3. Retirer le discours IA et franciser
4. Relier tous les parcours à un modèle de données unique
5. Implémenter la stack imposée via monorepo discipliné

**Prochaine étape :** Valider ce document + `02-architecture.md` avant toute implémentation.
