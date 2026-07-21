<script setup lang="ts">
defineProps<{
  icon: string
  title: string
  subtitle: string
}>()
</script>

<template>
  <div class="p-5 sm:p-6 rounded-[24px] bg-white border border-[rgba(37,99,235,0.08)] shadow-[0_10px_30px_rgba(30,64,175,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#2F5BFF]/30 flex items-center gap-4">
    <div class="w-12 h-12 rounded-2xl bg-[#EEF4FF] text-[#2F5BFF] flex items-center justify-center font-bold text-xl shrink-0">
      <UiPzIcon :name="icon" class="text-2xl" />
    </div>
    <div class="text-left overflow-hidden">
      <h4 class="font-extrabold text-sm sm:text-base text-[#0F172A] truncate">{{ title }}</h4>
      <p class="text-xs text-[#64748B] font-medium truncate mt-0.5">{{ subtitle }}</p>
    </div>
  </div>
</template>
