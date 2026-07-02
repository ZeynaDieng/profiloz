# Import intelligent OCR — Profilo'Z

Moteur **100 % local** : Tesseract + heuristiques + dictionnaires métier. Aucune IA externe, aucune API payante.

## Pipeline

```
Document (PDF / DOCX / image)
    ↓
Extraction texte (pdf.js layout multi-colonnes, mammoth, Tesseract)
    ↓
Prétraitement image (contraste, débruitage, netteté)
    ↓
Parser heuristique (sections, dates, expériences, formations…)
    ↓
Extracteurs par section (blocs isolés)
    ↓
Fusion intelligente (déduplication, dictionnaire compétences)
    ↓
Scores de confiance + file « à vérifier »
    ↓
Écran de relecture (ImportReview)
```

## Améliorations récentes

**Score corpus (100 CV)** : **95,7 %** global — objectif 90 % atteint.

| Domaine | Détail |
|---------|--------|
| OCR image | Prétraitement canvas : gris, contraste, débruitage, netteté |
| Multi-colonnes | Détection jusqu'à 3 gouttières ; lecture gauche→droite (3+) ou colonne dense d'abord (2) |
| Dates | `Depuis 2022`, `01/2020 - 06/2023`, `Présent`, `Aujourd'hui` |
| Sections | Synonymes : Historique, Parcours, Expérience… |
| Compétences | Dictionnaire 50+ technos, détection dans les phrases |
| Fusion | Anti-doublons, conservation de la donnée la plus fiable |
| UI | ImportReview réactivé, barre de progression 5 étapes |

## Évaluation

### Corpus généré (régression CI)

Corpus de **100 CV** (10 cas manuels + 90 générés) : formats Canva, Word, Europass, 1–2 colonnes, FR/EN.

```bash
cd apps/api
pnpm ocr:metrics              # fidélité par champ
pnpm ocr:benchmark            # rapport par catégorie (~95,7 %)
pnpm ocr:benchmark --save     # sauvegarde baseline
pnpm ocr:benchmark --compare  # avant / après
pnpm test                     # tests unitaires + corpus
```

### Validation terrain (corpus réel annoté)

Voir **[OCR-VALIDATION-TERRAIN.md](./OCR-VALIDATION-TERRAIN.md)** — score honnête sur CV anonymisés (`cv-samples/`).

```bash
cd apps/api
pnpm ocr:generate-samples     # 10 cas texte annotés de départ
pnpm ocr:validate-real        # rapport cv-samples/reports/latest.md
```

Mode debug admin : **Admin → OCR & Import** ou `POST /api/v1/admin/ocr/debug`.

## Configuration

Aucune clé API requise. Tesseract (`fra`) est le moteur OCR principal, intégré via `tesseract.js`.

Variables utiles en production : timeouts OCR existants dans `ocr.service.ts` (`OCR_TIMEOUT_MS = 90s`).
