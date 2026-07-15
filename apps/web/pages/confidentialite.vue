<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoPage({
  title: 'Politique de confidentialité',
  description: "Politique de confidentialité de Profilo'Z — collecte, utilisation et protection de vos données.",
})
</script>

<template>
  <UiLegalArticle title="Politique de confidentialité" updated="juin 2026">
    <section>
      <h2>1. Responsable du traitement</h2>
      <p>
        Profilo'Z est responsable du traitement des données personnelles collectées via la plateforme
        profiloz.fr et ses sous-domaines associés.
      </p>
    </section>

    <section>
      <h2>2. Données collectées</h2>
      <p>Nous pouvons collecter notamment :</p>
      <ul>
        <li>Informations de compte (nom, adresse e-mail) si vous vous inscrivez</li>
        <li>Contenu de votre CV et documents importés (CV, diplômes, attestations)</li>
        <li>Données techniques (logs, adresse IP, type de navigateur) à des fins de sécurité</li>
      </ul>
    </section>

    <section>
      <h2>3. Finalités</h2>
      <p>Vos données sont utilisées pour :</p>
      <ul>
        <li>Fournir le service de création et d'export de CV</li>
        <li>Extraire et structurer les informations de vos documents importés</li>
        <li>Assurer la sécurité, la maintenance et l'amélioration du service</li>
        <li>Répondre à vos demandes de support</li>
      </ul>
    </section>

    <section>
      <h2>4. Mode invité</h2>
      <p>
        En mode invité, une partie de vos données peut être conservée localement dans votre navigateur.
        Les documents importés et PDF générés sont stockés temporairement sur nos serveurs selon les
        durées de conservation applicables.
      </p>
    </section>

    <section>
      <h2>5. Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de
        limitation, d'opposition et de portabilité. Pour exercer vos droits :
        <a href="mailto:contact@profiloz.fr">contact@profiloz.fr</a>.
      </p>
    </section>

    <section>
      <h2>6. Conservation</h2>
      <p>
        Les données sont conservées le temps nécessaire à la fourniture du service et conformément aux
        obligations légales. Les fichiers temporaires (PDF invité, imports) sont supprimés automatiquement
        après expiration.
      </p>
    </section>
  </UiLegalArticle>
</template>
