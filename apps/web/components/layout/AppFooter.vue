<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'full' | 'minimal' | 'transactional' }>(), {
  variant: 'full',
})

const year = new Date().getFullYear()

const productLinks = [
  { to: '/creer', label: 'Fonctionnalités' },
  { to: '/creer/modele', label: 'Modèles' },
  { to: '/tarifs', label: 'Tarifs' },
  { to: '/faq', label: 'Questions fréquentes' },
]

const legalLinks = [
  { to: '/confidentialite', label: 'Confidentialité' },
  { to: '/conditions', label: "Conditions d'utilisation" },
  { to: '/mentions-legales', label: 'Mentions légales' },
]
</script>

<template>
  <footer
    v-if="variant === 'full'"
    class="w-full py-stack-lg px-margin-mobile md:px-margin-tablet xl:px-margin-desktop bg-surface-container-highest border-t border-outline-variant/30 safe-bottom shrink-0"
  >
    <div class="max-w-container-max mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
      <div class="space-y-4 sm:col-span-2 lg:col-span-1">
        <UiAppLogo size="lg" />
        <p class="text-on-surface-variant text-sm leading-relaxed max-w-xs">
          Profilo'Z est un produit de <strong>MATKAM</strong>. Modèles professionnels de CV et de lettre de motivation au même endroit.
        </p>
        <NuxtLink to="/creer" class="btn-primary !inline-flex sm:hidden">
          Créer mon dossier
        </NuxtLink>
      </div>

      <nav class="flex flex-col gap-1">
        <h5 class="font-bold text-on-surface mb-2">Produit</h5>
        <NuxtLink
          v-for="link in productLinks"
          :key="link.label"
          :to="link.to"
          class="min-h-11 inline-flex items-center text-on-surface-variant hover:text-primary text-sm"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <nav class="flex flex-col gap-1">
        <h5 class="font-bold text-on-surface mb-2">Légal</h5>
        <NuxtLink
          v-for="link in legalLinks"
          :key="link.to"
          :to="link.to"
          class="min-h-11 inline-flex items-center text-on-surface-variant hover:text-primary text-sm"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="hidden sm:flex flex-col justify-end">
        <NuxtLink to="/creer" class="btn-primary w-full sm:w-auto">
          Créer mon dossier
        </NuxtLink>
      </div>
    </div>

    <div class="max-w-container-max mx-auto mt-stack-lg pt-stack-md border-t border-outline-variant/20 flex flex-col sm:flex-row justify-between gap-3 text-label-xs text-on-surface-variant">
      <span>© {{ year }} Profilo'Z — Un produit de MATKAM. Tous droits réservés.</span>
      <div class="flex flex-wrap gap-x-4 gap-y-2">
        <NuxtLink v-for="link in legalLinks" :key="link.to" :to="link.to" class="hover:text-primary min-h-11 inline-flex items-center">
          {{ link.label === "Conditions d'utilisation" ? 'CGU' : link.label }}
        </NuxtLink>
      </div>
    </div>
  </footer>

  <footer v-else-if="variant === 'minimal'" class="w-full py-stack-md px-margin-mobile md:px-margin-tablet text-center safe-bottom">
    <p class="text-label-xs text-on-surface-variant opacity-60">
      © {{ year }} Profilo'Z — Un produit de MATKAM. Tous droits réservés.
    </p>
  </footer>

  <footer v-else class="w-full py-stack-lg px-margin-mobile bg-surface-container-highest mt-stack-lg safe-bottom">
    <div class="max-w-[440px] mx-auto text-center flex flex-col gap-4">
      <p class="text-label-xs text-on-surface-variant leading-relaxed">
        En créant un compte, vous acceptez nos
        <NuxtLink to="/conditions" class="text-secondary hover:underline">Conditions d'utilisation</NuxtLink>
        et notre
        <NuxtLink to="/confidentialite" class="text-secondary hover:underline">Politique de confidentialité</NuxtLink>.
      </p>
      <p class="text-label-xs text-on-surface-variant opacity-60">
        © {{ year }} Profilo'Z — Un produit de MATKAM. Tous droits réservés.
      </p>
    </div>
  </footer>
</template>
