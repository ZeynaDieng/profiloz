<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'

const props = defineProps<{ resume: ResumeSnapshot }>()
const { accent, p, contactItems, snapshot, hasExperiences, hasSkills, hasInterests } = useResumeSections(
  () => props.resume,
)
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Créatif">
    <div class="relative">
      <div class="absolute -top-4 -left-4 w-24 h-24 rounded-full opacity-20" :style="{ backgroundColor: accent }" />
      <div class="absolute top-12 right-0 w-16 h-16 rotate-45 opacity-10" :style="{ backgroundColor: accent }" />

      <header class="relative mb-8">
        <h1 class="text-4xl font-black leading-none" :style="{ color: accent }">{{ p.fullName || 'Votre nom' }}</h1>
        <p class="text-lg font-medium mt-2">{{ p.jobTitle || 'Créatif' }}</p>
        <div class="flex flex-wrap gap-2 mt-4">
          <span
            v-for="item in contactItems"
            :key="item"
            class="text-xs px-3 py-1 rounded-full border"
            :style="{ borderColor: accent, color: accent }"
          >
            {{ item }}
          </span>
        </div>
      </header>

      <section v-if="hasSkills" class="mb-6">
        <h2 class="inline-block text-xs font-bold uppercase px-3 py-1 text-white mb-4" :style="{ backgroundColor: accent }">
          Compétences
        </h2>
        <div class="flex flex-wrap gap-2">
          <span v-for="(skill, i) in snapshot.skills" :key="i" class="text-sm font-medium">{{ skill.name }}</span>
        </div>
      </section>

      <section v-if="hasExperiences" class="mb-6">
        <h2 class="inline-block text-xs font-bold uppercase px-3 py-1 text-white mb-4" :style="{ backgroundColor: accent }">
          Expérience
        </h2>
        <div v-for="(exp, i) in snapshot.experiences" :key="i" class="mb-3 pl-4 border-l-4" :style="{ borderColor: accent }">
          <p class="font-bold text-sm">{{ exp.position }}</p>
          <p class="text-xs text-on-surface-variant">{{ exp.company }}</p>
        </div>
      </section>

      <section v-if="hasInterests">
        <h2 class="text-xs font-bold uppercase mb-2" :style="{ color: accent }">Centres d'intérêt</h2>
        <p class="text-sm">{{ snapshot.interests.map((i) => i.name).join(' · ') }}</p>
      </section>
    </div>
  </TemplatesTemplateShell>
</template>
