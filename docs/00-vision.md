# Profilo'Z V1 — Vision Produit Officielle

> **Version : 1.0**
> Ce document est la **référence officielle** du projet. Toutes les décisions
> techniques doivent respecter cette vision. En cas de conflit avec les autres
> documents de `/docs`, **cette vision prime**.

---

## Vision

Profilo'Z n'est **PAS** un générateur de CV.

Profilo'Z est une plateforme permettant de créer un **dossier de candidature professionnel**.

**Mission :** permettre à n'importe quel candidat de créer un dossier professionnel
prêt à envoyer en **moins de 10 minutes**.

Le dossier comprend :

- CV
- Lettre de motivation
- Modèles
- Documents importés
- Historique
- Téléchargement PDF

Le produit doit inspirer : **confiance, simplicité, rapidité, professionnalisme**.

---

## Philosophie produit

- L'utilisateur ne doit jamais avoir l'impression d'utiliser un logiciel compliqué.
- Il doit avoir l'impression qu'un **assistant** l'accompagne dans la création de son dossier.
- Le parcours doit être fluide.
- **Chaque écran a un seul objectif.**

---

## Uniformisation du vocabulaire

Toute l'application parle du **« dossier de candidature »**.

Éviter autant que possible de présenter **CV**, **Lettre** et **Document** comme des
éléments séparés. Le **dossier** devient l'entité centrale.

Exemples : Créer un dossier · Mes dossiers · Modifier le dossier · Télécharger le
dossier · Partager le dossier · Historique des dossiers.

---

## Landing

La landing raconte une histoire. Elle ne vend pas un PDF, elle vend une **candidature professionnelle**.

Parcours marketing :

```
Je découvre → Je comprends → Je fais confiance → Je crée mon dossier → Je télécharge → Je reviens
```

---

## Offres

Créer une véritable section **Tarifs**.

### Gratuit
- Créer
- Modifier
- Prévisualiser
- Importer
- Tous les modèles

### Dossier Unique — 300 FCFA
- CV
- Lettre
- PDF
- Téléchargements illimités
- Modifications illimitées

### Pack 10 Dossiers — 1500 FCFA
- 10 dossiers

### Illimité — 3900 FCFA / mois — *Badge : Le plus populaire*
- Tout
- Historique
- OCR
- IA (future)

### Business — 9900 FCFA / mois
Prévoir : Entreprise · École · Université · Cabinet RH · Centre de formation.

---

## Paiement

Le paiement intervient **uniquement à la fin**, jamais avant.

```
Créer → Modifier → Prévisualiser → Télécharger → Choisir une offre → PayTech → Téléchargement → Compte (facultatif)
```

---

## Compte

- **Jamais obligatoire.**
- Proposé **après** le paiement.
- Pré-remplir : Nom, Prénom, Email, Téléphone.
- Ne demander que : **Mot de passe.**

---

## Paiements (architecture)

Architecture complète et extensible :

- `PaymentProvider` (interface)
- `PayTechProvider` (V1)

Prévoir, sans modifier le code métier : Stripe · Wave · Orange Money · Free Money · PayPal.

---

## Stockage

**Objectif : coût minimal.** Ne **jamais** stocker les PDF.

Sauvegarder uniquement : données · modèles · documents importés · paiements.

Chaque téléchargement :

```
génération → envoi → suppression
```

Le serveur ne doit jamais être rempli de PDF.

---

## Architecture multi-tenant

Penser dès aujourd'hui : Utilisateur individuel · Entreprise · Université · École ·
Centre de formation · Cabinet RH.

Une organisation possède : abonnement · administrateurs · collaborateurs · dossiers.

Rôles : **Owner · Admin · Manager · Member** (même si la V1 n'expose pas encore toute l'interface).

---

## Crédits (architecture interne)

Système de crédits, même invisible pour l'utilisateur :

| Offre | Crédits |
|---|---|
| Dossier Unique | 1 crédit |
| Pack 10 | 10 crédits |
| Illimité | ∞ |
| Business | ∞ |

- **Les dossiers consomment un crédit.**
- **Les téléchargements n'en consomment jamais.**

---

## Back-office administrateur

Un véritable SaaS Admin : Dashboard · Graphiques · Statistiques.

Gestion : Utilisateurs · Organisations · Paiements · Abonnements · Plans ·
Templates CV · Templates Lettres · OCR · Transactions · Support · Logs · CMS.

---

## CMS

Le back-office permet de modifier **sans redéploiement** : Landing · FAQ · Tarifs ·
Mentions légales · Conditions · Politique de confidentialité · Footer · Bannières ·
Textes marketing.

---

## Templates

Bibliothèque extensible. Ajouter un template ne doit **jamais** nécessiter une refonte.

- **CV** (exemples) : Étudiant · Professionnel · Moderne · Développeur · Créatif · Exécutif
- **Lettres** (exemples) : Classique · Moderne · Premium · Personnalisée

---

## Standards

**CV** : standards internationaux, compatibles **ATS**, bonne hiérarchie, typographie et
lisibilité. Éviter tableaux, colonnes complexes, éléments non compatibles ATS.

**Lettres** : conventions professionnelles — Coordonnées · Objet · Formule d'appel ·
Corps · Conclusion · Signature.

---

## OCR

Pipeline :

```
Import → OCR → Analyse → Normalisation → Fusion → Pré-remplissage → Validation utilisateur
```

Reconnaître : Nom · Adresse · Téléphone · Email · Formation · Expérience ·
Compétences · Langues · Certifications · Centres d'intérêt — **même si plusieurs
documents sont importés**.

---

## UX

Même ton · même vocabulaire · mêmes couleurs · mêmes composants · mêmes animations ·
mêmes marges · mêmes icônes. Créer un véritable **Design System**.

---

## Performance

Chargement rapide · Lazy loading · Cache · Compression · Optimisation images ·
Code splitting · SEO · Accessibilité.

---

## Sécurité

Validation serveur · Rate limiting · Protection upload · Validation MIME ·
Protection XSS · Protection CSRF · Protection double paiement · Logs · Audit.

---

## Documentation

Créer dans `/docs` : Architecture · BDD · API · Paiement · OCR · Stockage · UX · UI ·
Business Rules · Admin · Roadmap.

---

## Règle la plus importante

Chaque décision de développement doit répondre à cette question :

> **« Est-ce que cela aide un utilisateur à créer un dossier de candidature
> professionnel plus rapidement, plus simplement et avec plus de confiance ? »**

Si la réponse est non, alors cette fonctionnalité n'est probablement pas prioritaire pour la V1.
