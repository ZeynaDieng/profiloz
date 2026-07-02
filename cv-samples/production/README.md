# Corpus production — validation réelle Profilo'Z

Ce dossier sert à valider le **pipeline complet** sur des fichiers d'origine (pas uniquement du texte extrait).

## Objectif

Mesurer la fiabilité réelle du parcours :

**Document → OCR → Parsing → Fusion → Préremplissage du CV**

avec une checklist UX (ordre des expériences, formations séparées, compétences sans doublon, langues détectées, etc.).

## Structure

```
production/
├── manifest.json          # Index des CV + métadonnées (format, langue, colonnes…)
├── files/                 # Fichiers binaires anonymisés
│   ├── pdf-canva/
│   ├── pdf-word/
│   ├── pdf-adobe/
│   ├── europass/
│   ├── docx/
│   ├── images-jpg/
│   ├── images-png/
│   ├── phone-photo/
│   └── scans/
├── ground-truth/          # Annotations champ par champ (un JSON par id)
└── reports/               # Rapports générés (latest.md)
```

## Formats à couvrir

| Catégorie | Exemples |
|-----------|----------|
| PDF Canva | Export graphique, 2 colonnes |
| PDF Word | Export « Enregistrer sous PDF » |
| PDF Adobe | InDesign / Acrobat |
| Europass | Modèle officiel FR/EN |
| DOCX | Word natif |
| JPG / PNG | Scan ou export image |
| Photo mobile | Cadrage serré, légère inclinaison |
| Scan moyen | Résolution faible, contraste réduit |

## Anonymisation obligatoire

Avant dépôt dans le repo :

1. Remplacer noms, emails, téléphones, adresses par des données fictives cohérentes.
2. Retirer photos identifiables ou les flouter.
3. Conserver la **mise en page** et la **structure** du document original.

## Ajouter un CV

1. Déposer le fichier dans `files/<catégorie>/mon-cv.pdf`.
2. Ajouter une entrée dans `manifest.json` :

```json
{
  "id": "canva-fr-2col-01",
  "file": "files/pdf-canva/mon-cv.pdf",
  "tags": {
    "tool": "canva",
    "columns": 2,
    "language": "fr",
    "source": "pdf-text",
    "style": "modern"
  },
  "identity": { "fullName": "…", "jobTitle": "…" },
  "contact": { "email": "…", "phone": "…" },
  "experiences": [ … ],
  "skills": [ … ],
  "languages": [ { "name": "Français" } ]
}
```

3. (Optionnel) Copier l'entrée dans `ground-truth/<id>.json` pour versionner l'annotation séparément.

## Lancer la validation

```bash
cd apps/api
pnpm ocr:validate-production ../../cv-samples/production
```

Le rapport est écrit dans `reports/latest.md` avec :

- taux d'exactitude (ground truth) ;
- score UX post-parsing ;
- répartition par format ;
- cas problématiques.

## Critère « moteur prêt »

- Exactitude ≥ **85 %** sur le corpus production **binaire** annoté ;
- Score UX ≥ **90 %** ;
- Aucun format majeur sous **75 %** ;
- Parcours utilisateur validé manuellement dans l'interface (ImportReview → éditeur → PDF).

## Amélioration continue

Les corrections utilisateur en production sont enregistrées via `POST /documents/import-feedback` et consultables dans **Admin → OCR & Import → Amélioration continue**.

Utilisez ces retours pour enrichir ce corpus et prioriser les extracteurs.
