<template>
  <div class="max-w-[480px] mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop py-stack-lg pb-28 text-center">
    <div class="mb-stack-lg">
      <h1 class="text-2xl sm:text-3xl font-bold text-on-surface mb-3">{{ MSG.guide.createCvTitle }}</h1>
      <p class="text-on-surface-variant">{{ MSG.guide.createCvSubtitle }}</p>
    </div>

    <NuxtLink to="/creer/assistant/informations" class="btn-secondary w-full inline-flex items-center justify-center gap-2 min-h-[52px]">
      {{ MSG.guide.createCvCta }}
      <UiPzIcon name="arrow_forward" class="text-[20px]" />
    </NuxtLink>

    <div class="mt-8 space-y-3 text-sm">
      <p>
        <NuxtLink to="/creer/importer/cv" class="text-secondary font-semibold hover:underline">
          {{ MSG.guide.importCvLink }}
        </NuxtLink>
      </p>
      <p>
        <NuxtLink to="/creer/lettre" class="text-on-surface-variant hover:text-secondary hover:underline">
          {{ MSG.guide.createLetterLink }}
        </NuxtLink>
      </p>
      <p>
        <NuxtLink to="/creer/importer/lettre" class="text-on-surface-variant hover:text-secondary hover:underline">
          {{ MSG.guide.importLetterLink }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MSG } from '@profiloz/shared'

definePageMeta({ layout: 'wizard' })

useGuestSession()
const resumeStore = useResumeStore()

onMounted(() => {
  resumeStore.ensureDemoPersonaIfEmpty()
})
</script>
