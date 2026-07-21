<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string
    icon?: string
    checked?: boolean
    positionClass?: string
    delay?: string
  }>(),
  {
    icon: 'description',
    checked: true,
    positionClass: '',
    delay: '0s',
  },
)
</script>

<template>
  <div
    class="absolute z-20 flex items-center gap-2 px-3.5 py-2 rounded-[22px] bg-white/90 backdrop-blur-md border border-[rgba(37,99,235,0.12)] shadow-[0_12px_30px_rgba(30,64,175,0.12)] transition-transform duration-500 hover:scale-105 animate-float"
    :class="positionClass"
    :style="{ animationDelay: delay }"
  >
    <div class="w-6 h-6 rounded-lg bg-[#EEF4FF] text-[#2F5BFF] flex items-center justify-center shrink-0">
      <UiPzIcon :name="icon" class="text-xs font-extrabold" />
    </div>
    <span class="text-xs font-extrabold text-[#0F172A] whitespace-nowrap">{{ title }}</span>
    <div v-if="checked" class="w-4 h-4 rounded-full bg-[#22C55E] text-white flex items-center justify-center text-[10px] font-black shrink-0">
      ✓
    </div>
  </div>
</template>

<style scoped>
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}
</style>
