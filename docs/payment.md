# Paiement (PayTech) — V1

> Voir `docs/00-vision.md` (référence). Ce document décrit l'implémentation V1.

## Principe

Le paiement intervient **au téléchargement du dossier**. Créer, modifier,
prévisualiser et importer restent gratuits.

Parcours : `Créer → Modifier → Prévisualiser → Télécharger → (paywall) → Offre → PayTech → Téléchargement`.

## Modèle de crédits

- `User.creditsBalance` (entier) et `User.unlimitedUntil` (abonnement).
- `Resume.unlockedAt` : un dossier débloqué se télécharge ensuite **sans limite**.
- **Débloquer un dossier consomme 1 crédit** (transaction anti double-consommation).
  Un abonnement illimité actif débloque **sans** consommer de crédit.
- **Un téléchargement ne consomme jamais de crédit** (règle de la vision).

| Offre | Slug | Prix | Effet |
|---|---|---|---|
| Dossier Unique | `dossier_unique` | 300 FCFA | +1 crédit |
| Pack 10 | `pack_10` | 1500 FCFA | +10 crédits |
| Illimité | `illimite` | 3900 FCFA/mois | abonnement 30 j |
| Business | `business` | 9900 FCFA/mois | abonnement 30 j |

Catalogue source : `packages/shared/src/payment.ts` (`PLANS`).

## Architecture (extensible)

- `PaymentProvider` (interface) — `apps/api/src/modules/payment/payment.provider.ts`.
- `PayTechProvider` (V1) — `paytech.provider.ts`. Brancher Stripe/Wave/Orange Money/etc.
  ne nécessite qu'une nouvelle implémentation de l'interface, sans toucher au métier.
- `PaymentService` — `payment.service.ts` : `createCheckout`, `handleIpn`, `getEntitlements`, `unlockResume`.

## Endpoints API

- `GET /api/v1/plans` — catalogue public (Infinity → `null`).
- `POST /api/v1/payments/checkout` (auth) — `{ planSlug }` → `{ ref, redirectUrl }`.
- `POST /api/v1/payments/ipn` — notification PayTech (auth via hash sha256 des clés).
- `GET /api/v1/payments/me` (auth) — `{ creditsBalance, unlimitedUntil, unlimitedActive }`.
- Paywall : `POST /api/v1/resumes/[id]/dossier/pdf` appelle `unlockResume` (→ 402 si aucun crédit).

## PayTech

- Requête : `POST https://paytech.sn/api/payment/request-payment`, en-têtes `API_KEY` / `API_SECRET`.
- IPN : vérifié en comparant `sha256(API_KEY)` et `sha256(API_SECRET)` aux champs
  `api_key_sha256` / `api_secret_sha256` du payload. Idempotent + contrôle du montant.

### Configuration (`apps/api/.env`)

```
PAYTECH_API_KEY=...
PAYTECH_API_SECRET=...
PAYTECH_ENV=test            # ou prod
PAYTECH_IPN_URL=https://.../api/v1/payments/ipn   # HTTPS joignable (ngrok en local)
```

Sans `PAYTECH_IPN_URL`, la notification automatique est désactivée : les crédits
ne seront pas ajoutés (utiliser un tunnel HTTPS en développement).

## Paiement invité (fondation backend — incrément 1)

Le modèle de droits accepte désormais un **propriétaire** : utilisateur connecté **ou**
session invitée (`EntitlementOwner = { userId? , guestSessionDbId? }`).

- `GuestSession` porte `creditsBalance` / `unlimitedUntil` (comme `User`).
- `Payment.userId` est optionnel ; un `Payment.guestSessionId` permet d'attribuer une
  commande à un invité. L'IPN crédite l'utilisateur **ou** la session selon le payload.
- `Resume.guestSessionId` a maintenant une vraie relation (FK `SET NULL`) → `unlockResume`
  peut débloquer un dossier appartenant à un invité.
- `checkout` et `payments/me` passent par `requireGuestOrAuth` (paiement sans compte).
- **Migration au moment de l'inscription** (`auth.service.register` →
  `paymentService.migrateGuestToUser`) : réassigne les dossiers et paiements invités à
  l'utilisateur, additionne les crédits et conserve l'abonnement le plus avantageux.

### Reste à faire (incrément 2 — web)

Aujourd'hui le CV invité vit en `localStorage` (jamais persisté côté serveur), donc la
fondation ci-dessus n'est pas encore exercée de bout en bout pour un invité. Incrément 2 :

- L'assistant persiste le dossier invité (`POST /resumes` avec en-tête de session invitée).
- Page dossier + téléchargement accessibles à l'invité (`requireGuestOrAuth` sur les routes
  de génération, lecture du dossier scoped par session).
- À l'inscription, basculer de la recréation par snapshot vers la réassignation des lignes
  (préserver `unlockedAt`), pour éviter tout doublon de dossier.

## Décisions V1 (et pistes futures)

- **Paywall uniquement sur le dossier** (`/resumes/[id]/dossier/pdf` + `/resumes/[id]/pdf`).
  Le téléchargement CV seul via snapshot (parcours assistant/invité) reste libre en V1.
  Pour fermer ce contournement, gater aussi `generate-from-snapshot` / la lettre seule.
- Multi-tenant (organisations, rôles) et back-office admin : axes séparés non couverts ici.
