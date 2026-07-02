# Rapport de validation terrain — Import OCR Profilo'Z

Généré le 2026-07-02T13:09:18.143Z

## Synthèse

- **Documents testés** : 10
- **Avec ground truth** : 10
- **Taux global** : 98.2 %

## Taux par catégorie

| Catégorie | Taux | Détail |
|-----------|------|--------|
| identité | 89.5 % | 17/19 |
| coordonnées | 96.0 % | 24/25 |
| expériences | 100.0 % | 53/53 |
| formations | 100.0 % | 9/9 |
| compétences | 100.0 % | 31/31 |
| langues | 100.0 % | 20/20 |
| centres d’intérêt | 100.0 % | 8/8 |

## Répartition par type de document

- **txt** : 6 CV — 97.4 %
- **pdf-text** : 3 CV — 100.0 %
- **pdf-scanned** : 1 CV — 100.0 %

## Catégories les plus difficiles

- identité : 89.5 %
- coordonnées : 96.0 %
- expériences : 100.0 %
- formations : 100.0 %
- compétences : 100.0 %
## Limites connues

- CV très graphiques (Canva / Adobe) avec peu de texte sélectionnable.
- PDF scannés de faible qualité, inclinés ou peu contrastés.
- Photos mobile avec reflets ou cadrage serré.
- Mises en page 3–4 colonnes atypiques.
- Intitulés de poste sans mot-clé métier reconnu.

## Pistes d’amélioration

- Enrichir le corpus réel annoté (cv-samples/) — priorité aux formats sous-représentés.
- Affiner l’extracteur expériences sur les CV date-first et tableaux Europass.
- Renforcer le prétraitement OCR (inclinaison, binarisation adaptative).
- Étendre les dictionnaires métiers / compétences sectorielles.
