# Corpus terrain — Import OCR Profilo'Z

Ce dossier sert à **valider le moteur d'import sur des CV réels**, avec comparaison manuelle champ par champ.

## Structure

```
cv-samples/
├── files/              # Documents (PDF, DOCX, JPG, PNG, TXT)
├── ground-truth/       # Annotations JSON (une par document)
├── manifest.json       # Index des entrées
└── reports/            # Rapports générés (latest.md)
```

## Ajouter un CV réel

1. **Anonymiser** le document (nom, email, téléphone, adresse, photo si besoin).
2. Déposer le fichier dans `files/` (ex. `files/cv-canva-marie.pdf`).
3. Créer `ground-truth/cv-canva-marie.json` :

```json
{
  "id": "cv-canva-marie",
  "file": "files/cv-canva-marie.pdf",
  "tags": {
    "tool": "canva",
    "columns": 2,
    "language": "fr",
    "source": "pdf-text",
    "style": "modern"
  },
  "identity": { "fullName": "Prénom Nom", "jobTitle": "Poste visé" },
  "contact": { "email": "...", "phone": "...", "location": "..." },
  "experiences": [{ "position": "...", "company": "...", "startDate": "2020", "endDate": "2023" }],
  "educations": [{ "degree": "...", "institution": "..." }],
  "skills": ["React", "Node.js"],
  "languages": [{ "name": "Français" }, { "name": "Anglais" }],
  "certifications": ["AWS Certified"],
  "interests": ["Sport", "Lecture"]
}
```

4. Ajouter l'entrée dans `manifest.json`.
5. Lancer la validation :

```bash
cd apps/api
pnpm ocr:validate-real
```

## Cas de départ (10 textes)

Les 10 fichiers `.txt` proviennent du corpus manuel (mises en page variées, données synthétiques). Regénérer :

```bash
cd apps/api
pnpm ocr:generate-samples
```

## Formats visés

| Type | Tag `source` / `tool` |
|------|------------------------|
| Canva | `canva` |
| Word | `word`, `docx` |
| Europass | `europass` |
| Adobe / InDesign | `adobe`, `indesign` |
| PDF texte | `pdf-text` |
| PDF scanné | `pdf-scanned` |
| Photo mobile | `phone-photo`, `jpg` |
| 1–4 colonnes | `columns` |

## Rapport

Le script produit `reports/latest.md` avec taux par catégorie, cas problématiques et limites connues.
