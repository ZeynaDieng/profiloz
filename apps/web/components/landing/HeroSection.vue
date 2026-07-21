<script setup lang="ts">
import LandingFloatingBadge from '~/components/landing/FloatingBadge.vue'
</script>

<template>
  <div class="relative w-full overflow-hidden pt-2 pb-6">
    <!-- HERO PHOTO & BADGES CONTAINER -->
    <div class="relative w-full h-[420px] sm:h-[520px] lg:h-[650px] rounded-[34px] overflow-hidden bg-white shadow-[0_30px_80px_rgba(37,99,235,0.08)] border border-[rgba(37,99,235,0.08)]">
      <!-- Background HD Photo -->
      <img
        src="/landing/hero-bg-full.jpg"
        alt="Candidate Profilo'Z"
        class="w-full h-full object-cover object-center"
      />

      <!-- FLOATING BADGES OVERLAY -->
      <LandingFloatingBadge
        title="CV prêt"
        icon="description"
        :checked="true"
        position-class="top-6 right-6 sm:top-8 sm:right-10"
        delay="0s"
      />

      <LandingFloatingBadge
        title="Prêt à postuler"
        icon="target"
        :checked="true"
        position-class="top-1/2 -translate-y-1/2 right-4 sm:right-12"
        delay="1s"
      />

      <LandingFloatingBadge
        title="Lettre"
        icon="mail"
        :checked="true"
        position-class="top-1/3 left-4 sm:left-10"
        delay="2s"
      />

      <LandingFloatingBadge
        title="IA Boost"
        icon="auto_awesome"
        :checked="false"
        position-class="bottom-28 left-6 sm:bottom-32 sm:left-16"
        delay="1.5s"
      />

      <!-- GRADIENT OVERLAY ON BOTTOM OF PHOTO -->
      <div class="absolute inset-x-0 bottom-0 h-48 sm:h-64 bg-gradient-to-t from-[#F8FAFF] via-[#F8FAFF]/70 to-transparent pointer-events-none" />
    </div>

    <!-- TITLES OVERLAPPING THE HERO BOTTOM -->
    <div class="relative -mt-24 sm:-mt-32 lg:-mt-40 z-20 text-center space-y-3 px-4 max-w-4xl mx-auto">
      <!-- Badge -->
      <div class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#EEF4FF] text-[#2F5BFF] text-xs font-extrabold tracking-wide shadow-xs border border-[#2F5BFF]/10">
        <span>✨ IA • Simple • Rapide</span>
      </div>

      <!-- Main Title -->
      <h1 class="text-[32px] sm:text-[40px] lg:text-[52px] font-black text-[#0F172A] leading-[1.15] tracking-tight drop-shadow-xs">
        Créez un CV et une lettre qui <span class="text-[#2F5BFF] underline underline-offset-4 decoration-[#2F5BFF]/30">vous ouvrent des portes.</span>
      </h1>

      <!-- Subtitle -->
      <p class="text-sm sm:text-base lg:text-lg text-[#64748B] font-normal leading-[1.7] max-w-xl mx-auto">
        Créez un CV professionnel en quelques minutes grâce à l'IA.
      </p>
    </div>
  </div>
</template>
