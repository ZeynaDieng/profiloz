<script setup lang="ts">
// Clean & Professional HeroSection Component
</script>

<template>
  <div class="space-y-6 sm:space-y-8 text-center max-w-4xl mx-auto">
    <!-- TOP HEADER TEXT & BADGE -->
    <div class="space-y-3 px-2">
      <!-- Pill Badge -->
      <div class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#EEF4FF] text-[#2F5BFF] text-xs font-bold tracking-wide border border-[#2F5BFF]/15">
        <span>✨ IA • Simple • Rapide</span>
      </div>

      <!-- Title -->
      <h1 class="text-2xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] leading-[1.18] tracking-tight">
        Créez un CV et une lettre qui <span class="text-[#2F5BFF] underline underline-offset-4 decoration-[#2F5BFF]/30">vous ouvrent des portes.</span>
      </h1>

      <!-- Subtitle -->
      <p class="text-sm sm:text-base text-[#64748B] font-normal leading-relaxed max-w-xl mx-auto">
        Créez un CV professionnel en quelques minutes grâce à l'IA.
      </p>
    </div>

    <!-- ELEGANT HD HERO BANNER -->
    <div class="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-[24px] sm:rounded-[28px] overflow-hidden bg-white border border-[rgba(37,99,235,0.08)] shadow-[0_20px_60px_rgba(30,64,175,0.06)]">
      <img
        src="/landing/hero-bg-full.jpg"
        alt="Profilo'Z Candidate"
        class="w-full h-full object-cover object-center"
      />
    </div>
  </div>
</template>
