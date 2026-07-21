<script setup lang="ts">
withDefaults(
  defineProps<{
    createLink: string
    importLink: string
    letterLink?: string
  }>(),
  {
    letterLink: '/creer/lettre',
  },
)
</script>

<template>
  <div class="space-y-3.5 max-w-lg mx-auto w-full">
    <!-- Main CTA Button -->
    <NuxtLink :to="createLink" class="block w-full">
      <button
        type="button"
        class="w-full h-[64px] rounded-[20px] bg-gradient-to-r from-[#2F5BFF] to-[#2452FF] text-white font-extrabold text-base sm:text-lg shadow-[0_12px_35px_rgba(47,91,255,0.35)] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(47,91,255,0.45)] transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer"
      >
        <span>Créer mon CV</span>
        <UiPzIcon name="arrow_forward" class="text-xl" />
      </button>
    </NuxtLink>

    <!-- Secondary Buttons Grid -->
    <div class="grid grid-cols-2 gap-3">
      <NuxtLink :to="importLink" class="block w-full">
        <button
          type="button"
          class="w-full h-[54px] rounded-[16px] bg-white text-[#0F172A] border border-[rgba(37,99,235,0.12)] font-bold text-xs sm:text-sm shadow-[0_4px_20px_rgba(30,64,175,0.05)] hover:-translate-y-0.5 hover:border-[#2F5BFF]/40 hover:bg-[#EEF4FF]/30 transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
        >
          <UiPzIcon name="upload" class="text-base text-[#2F5BFF]" />
          <span>Importer mon CV</span>
        </button>
      </NuxtLink>

      <NuxtLink :to="letterLink" class="block w-full">
        <button
          type="button"
          class="w-full h-[54px] rounded-[16px] bg-white text-[#0F172A] border border-[rgba(37,99,235,0.12)] font-bold text-xs sm:text-sm shadow-[0_4px_20px_rgba(30,64,175,0.05)] hover:-translate-y-0.5 hover:border-[#2F5BFF]/40 hover:bg-[#EEF4FF]/30 transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
        >
          <UiPzIcon name="edit" class="text-base text-[#2F5BFF]" />
          <span>Créer une lettre</span>
        </button>
      </NuxtLink>
    </div>
  </div>
</template>
