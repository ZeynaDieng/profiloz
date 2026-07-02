# Validation terrain — Import OCR Profilo'Z

Ce document complète le [guide technique OCR](./OCR-IMPORT.md) avec la **validation sur corpus annoté**, distincte du benchmark sur corpus généré.

## Philosophie

| Corpus généré (`ocr:benchmark`) | Corpus terrain (`ocr:validate-real`) |
|--------------------------------|--------------------------------------|
| 100 CV synthétiques / simulés | CV réels anonymisés + cas manuels annotés |
| Score ~95,7 % — régression CI | Score **90,9 %** (10 docs, juin 2026) — réalité produit |
| Détecte les régressions | Mesure l'expérience utilisateur réelle |

Un score terrain plus bas mais représentatif vaut mieux qu'un excellent score sur des données artificielles.

> **Étape suivante** : validation sur fichiers binaires réels → voir [OCR-VALIDATION-PRODUCTION.md](./OCR-VALIDATION-PRODUCTION.md) et `cv-samples/production/`.

## Infrastructure

```
cv-samples/
├── files/              # Documents (PDF, DOCX, JPG, TXT…)
├── ground-truth/       # Annotations JSON champ par champ
├── manifest.json       # Index
└── reports/latest.md   # Rapport auto-généré
```

Voir [cv-samples/README.md](../cv-samples/README.md) pour ajouter des CV réels.

## Commandes

```bash
cd apps/api
pnpm ocr:generate-samples          # Regénère les 10 cas texte de départ
pnpm ocr:validate-real             # Validation terrain → cv-samples/reports/latest.md
pnpm ocr:validate-real ./cv-samples --report ./cv-samples/reports/custom.md
```

## Rapport actuel (10 documents)

**Taux global : 90,9 %** — comparaison manuelle champ par champ (correct / partiel / manquant / incorrect).

### Types testés

| Type | Nb | Taux moyen |
|------|----|------------|
| TXT (texte extrait) | 6 | 95,3 % |
| PDF texte (simulé) | 3 | 79,8 % |
| PDF scanné (simulé) | 1 | 100,0 % |

Formats couverts dans les annotations : Word, Canva, Europass, Adobe 4 colonnes, 1–4 colonnes, FR.

### Taux par catégorie

| Catégorie | Taux | Observations |
|-----------|------|--------------|
| Formations | 100 % | Stable |
| Langues | 100 % | Stable |
| Centres d'intérêt | 100 % | Peu de cas |
| Compétences | 93,5 % | Dictionnaire efficace sur listes |
| Identité | 89,5 % | Nom éclaté / pied de page encore sensibles |
| Expériences | 88,7 % | Point dur principal |
| **Coordonnées** | **80,0 %** | **Catégorie la plus difficile** |

### Cas problématique principal

**`reel-4-colonnes-experiences-en-fin`** (47 %) — mise en page Adobe 4 colonnes avec expériences en fin de document, postes et employeurs sur lignes séparées. Le moteur confond sections et rattache mal les blocs.

Erreurs typiques :
- Expériences non associées (poste / entreprise / dates éclatés)
- Compétences mélangées avec langues dans le flux multi-colonnes
- Localisation absente

### Limites connues

1. CV très graphiques (Canva / InDesign) avec peu de texte sélectionnable
2. PDF scannés inclinés, peu contrastés, photos mobile
3. Mises en page 3–4 colonnes atypiques (sections en fin de page)
4. Intitulés de poste sans mot-clé métier dans le dictionnaire
5. Corpus actuel : **10 fichiers texte** — les vrais PDF/DOCX/images doivent encore être déposés dans `cv-samples/files/`

### Pistes d'amélioration (priorisées)

1. **Expériences multi-colonnes** — heuristique poste/employeur/date sur lignes disjointes (cas Modou Fall)
2. **Coordonnées** — extraction renforcée en pied de page et colonnes latérales
3. **Corpus réel** — ajouter Canva, Word export PDF, Europass, scans mobile annotés
4. **Prétraitement OCR** — deskew, binarisation adaptative pour scans moyens
5. **Dictionnaires sectoriels** — métiers manuels, santé, BTP…

## Mode Debug admin

Endpoint : `POST /api/v1/admin/ocr/debug` (multipart, champ `file`)

Interface : **Admin → OCR & Import** — panneau Debug avec onglets :

- Document d'origine (aperçu PDF/image)
- Texte brut extrait
- Blocs / colonnes détectées
- Sections reconnues
- Données extraites (JSON)
- Scores de confiance par champ
- Avertissements, erreurs, infos non classées

## Relecture utilisateur (ImportReview)

- Champs sous le seuil **75 %** : bordure ambre + badge « à confirmer »
- Bandeau **import partiel** si OCR incomplet ou avertissements
- Sections éditables : identité, profil, expériences, formations, compétences, langues, certifications, centres d'intérêt
- Éléments non classés : panneau « Informations à vérifier »

## Import tolérant

Le parcours **ne bloque jamais** sur un document difficile :

- Texte vide → import partiel + avertissements, pas d'erreur 422
- Erreur OCR → enregistrée dans `_extraction.errors`, parcours continue
- Erreur parser → structure minimale + `partialImport: true`

L'utilisateur complète toujours via l'écran de relecture.

## Prochaines étapes recommandées

1. Déposer **20–30 CV réels anonymisés** (variété Canva, Word, Europass, scans, photos)
2. Annoter chaque fichier dans `ground-truth/`
3. Relancer `pnpm ocr:validate-real` et comparer les rapports
4. Prioriser les correctifs sur les catégories < 80 % (coordoonées, expériences)
