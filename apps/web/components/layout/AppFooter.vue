<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'full' | 'minimal' | 'transactional' }>(), {
  variant: 'full',
})

const year = new Date().getFullYear()
</script>

<template>
  <footer
    v-if="variant === 'full'"
    class="w-full py-stack-lg px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-4 gap-gutter bg-surface-container-highest border-t border-outline-variant/30"
  >
    <div class="space-y-4">
      <UiAppLogo size="lg" />
      <p class="text-on-surface-variant">
        La référence premium pour une documentation de carrière moderne.
      </p>
    </div>
    <div class="flex flex-col gap-4">
      <h5 class="font-bold text-on-surface">Produit</h5>
      <NuxtLink to="/creer" class="text-on-surface-variant hover:text-primary">Fonctionnalités</NuxtLink>
      <NuxtLink to="/creer/modele" class="text-on-surface-variant hover:text-primary">Modèles</NuxtLink>
    </div>
    <div class="flex flex-col gap-4">
      <h5 class="font-bold text-on-surface">Ressources</h5>
      <a href="#" class="text-on-surface-variant hover:text-primary">Guide CV</a>
      <a href="#" class="text-on-surface-variant hover:text-primary">Blog carrière</a>
    </div>
    <div class="flex flex-col gap-4">
      <h5 class="font-bold text-on-surface">Légal</h5>
      <NuxtLink to="/confidentialite" class="text-on-surface-variant hover:text-primary">Confidentialité</NuxtLink>
      <NuxtLink to="/conditions" class="text-on-surface-variant hover:text-primary">Conditions d'utilisation</NuxtLink>
      <NuxtLink to="/mentions-legales" class="text-on-surface-variant hover:text-primary">Mentions légales</NuxtLink>
    </div>
    <div class="col-span-1 md:col-span-4 pt-12 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between gap-4">
      <span class="text-label-xs text-on-surface-variant">
        © {{ year }} Profilo'Z. Tous droits réservés.
      </span>
      <div class="flex flex-wrap gap-x-4 gap-y-2 text-label-xs">
        <NuxtLink to="/confidentialite" class="text-on-surface-variant hover:text-primary">Confidentialité</NuxtLink>
        <NuxtLink to="/conditions" class="text-on-surface-variant hover:text-primary">CGU</NuxtLink>
        <NuxtLink to="/mentions-legales" class="text-on-surface-variant hover:text-primary">Mentions légales</NuxtLink>
      </div>
    </div>
  </footer>

  <footer v-else-if="variant === 'minimal'" class="w-full py-stack-md px-margin-mobile md:px-margin-desktop text-center">
    <p class="text-label-xs text-on-surface-variant opacity-60">
      © {{ year }} Profilo'Z. Tous droits réservés.
    </p>
  </footer>

  <footer v-else class="w-full py-stack-lg px-margin-mobile bg-surface-container-highest mt-stack-lg">
    <div class="max-w-[440px] mx-auto text-center flex flex-col gap-base">
      <p class="text-label-xs text-on-surface-variant">
        En créant un compte, vous acceptez nos
        <NuxtLink to="/conditions" class="text-secondary hover:underline">Conditions d'utilisation</NuxtLink>
        et notre
        <NuxtLink to="/confidentialite" class="text-secondary hover:underline">Politique de confidentialité</NuxtLink>.
      </p>
      <p class="text-label-xs text-on-surface-variant opacity-60">
        © {{ year }} Profilo'Z. Tous droits réservés.
      </p>
    </div>
  </footer>
</template>
