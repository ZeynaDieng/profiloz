# Validation production — Import OCR Profilo'Z

Ce document complète [OCR-VALIDATION-TERRAIN.md](./OCR-VALIDATION-TERRAIN.md) pour la phase **fichiers réels**.

## Deux corpus distincts

| Corpus | Chemin | Contenu | Usage |
|--------|--------|---------|-------|
| Terrain (texte) | `cv-samples/` | 10 `.txt` simulés + ground truth | Régression rapide extracteurs |
| **Production** | `cv-samples/production/` | PDF, DOCX, JPG, PNG réels | Validation pipeline complet |

Un bon score sur le corpus texte **ne suffit pas**. Le moteur est considéré prêt lorsque le corpus production atteint les seuils ci-dessous.

## Pipeline testé

```
Fichier binaire
    → OCR (Tesseract / pdf-parse / mammoth)
    → Normalisation lignes
    → Détection sections / colonnes
    → Extraction heuristique
    → Fusion + confiance
    → Contrôles UX (préremplissage simulé)
    → Comparaison ground truth (si annoté)
```

Commande :

```bash
pnpm ocr:validate-production
# ou
cd apps/api && pnpm ocr:validate-production ../../cv-samples/production
```

Rapport : `cv-samples/production/reports/latest.md`

## Checklist UX automatisée

Pour chaque document, le script vérifie :

| Contrôle | Description |
|----------|-------------|
| Coordonnées présentes | Nom, email ou téléphone |
| Ordre des expériences | Du plus récent au plus ancien |
| Formations séparées | Pas de diplôme dupliqué en expérience |
| Compétences sans doublon | Insensible à la casse |
| Langues détectées | Au moins une langue nommée |
| Profil / résumé | Texte ≥ 20 caractères |

## Validation interface (manuelle)

Après dépôt des fichiers, tester dans l'app (`pnpm dev`) :

1. **Import** — `/creer/importer/cv?template=MODERNE` (ou autre modèle)
2. **ImportReview** — vérifier surlignage faible confiance, bandeau import partiel
3. **Confirmation** — données fusionnées dans le brouillon
4. **Modèle** — le template choisi est conservé jusqu'à la génération PDF
5. **Éditeur** — ordre expériences, formations, compétences, langues

Les corrections à l'étape 3 sont enregistrées via `POST /api/v1/documents/import-feedback` (sans bloquer l'utilisateur).

## Mode Debug administrateur

Conservé : **Admin → OCR & Import → Mode Debug OCR**

7 onglets : Document, Texte brut, Blocs, Sections, Données extraites, Confiance, Avertissements.

## Amélioration continue

### Enregistrement automatique

Lors de la confirmation ImportReview :

- `originalParsed` — extraction machine
- `correctedData` — données validées par l'utilisateur
- `fieldDiffs` — différences calculées côté API

### Consultation admin

**Admin → OCR & Import → Amélioration continue**

- total des retours ;
- catégories les plus corrigées (contact, expérience, compétences…) ;
- imports récents avec nombre de modifications.

### Enrichir le corpus

1. Exporter un cas problématique (anonymisé) depuis la prod.
2. L'ajouter à `cv-samples/production/files/`.
3. Annoter le ground truth.
4. Relancer `pnpm ocr:validate-production`.

## Critères « moteur prêt »

- Exactitude ground truth ≥ **85 %** sur corpus production **binaire** annoté
- Score UX ≥ **90 %**
- Aucun format majeur (PDF Word, DOCX, scan) sous **75 %**
- Parcours utilisateur validé manuellement sur ≥ 10 documents variés
- Retours ImportFeedback analysés — pas de catégorie dominante non traitée

## Prochaine étape pour vous

Déposez vos premiers CV anonymisés dans `cv-samples/production/files/` en suivant [cv-samples/production/README.md](../cv-samples/production/README.md).

Sans fichiers binaires, le script s'arrête avec un message explicite — c'est normal.
