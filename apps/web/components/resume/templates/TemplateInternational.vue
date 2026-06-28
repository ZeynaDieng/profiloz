<script setup lang="ts">
import type { ResumeSnapshot } from "@profiloz/shared";

const props = defineProps<{ resume: ResumeSnapshot }>();
const {
  accent,
  p,
  contactItems,
  snapshot,
  hasExperiences,
  hasLanguages,
  hasEducations,
} = useResumeSections(() => props.resume);

const initials = computed(() =>
  (p.value?.fullName || "")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase(),
);
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="International">
    <div class="grid grid-cols-[1fr_165px] gap-8">
      <!-- Colonne principale -->
      <div>
        <!-- En-tête -->
        <header class="mb-8">
          <div class="flex items-center gap-4 mb-5">
            <!-- Avatar -->
            <div
              v-if="p.photoUrl"
              class="w-14 h-14 rounded-full overflow-hidden border-2 shrink-0"
              :style="{ borderColor: accent }"
            >
              <img
                :src="p.photoUrl"
                alt=""
                class="w-full h-full object-cover"
              />
            </div>
            <div
              v-else
              class="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
              :style="{ backgroundColor: accent }"
            >
              {{ initials }}
            </div>

            <div>
              <h1
                class="text-[17pt] font-bold tracking-tight leading-tight text-[#0f172a]"
              >
                {{ p.fullName || "Votre nom" }}
              </h1>
              <p
                class="text-[10pt] font-semibold mt-1"
                :style="{ color: accent }"
              >
                {{ p.jobTitle || "Votre poste" }}
              </p>
            </div>
          </div>

          <!-- Double filet -->
          <div class="space-y-[3px]">
            <div class="h-[2px]" :style="{ backgroundColor: accent }" />
            <div class="h-px bg-[#e2e8f0]" />
          </div>
        </header>

        <!-- Expérience internationale -->
        <section v-if="hasExperiences" class="mb-7">
          <h2
            class="text-[7.5pt] font-black uppercase tracking-[0.18em] mb-4 flex items-center gap-2"
            :style="{ color: accent }"
          >
            <span>Expérience internationale</span>
            <span
              class="h-px flex-1 opacity-20"
              :style="{ backgroundColor: accent }"
            />
          </h2>
          <div
            v-for="(exp, i) in snapshot.experiences"
            :key="i"
            class="mb-5 pl-4 relative"
            :style="{ borderLeft: `2px solid ${accent}30` }"
          >
            <span
              class="absolute -left-[5px] top-[6px] w-2 h-2 rounded-full bg-white border-2 shrink-0"
              :style="{ borderColor: accent }"
            />
            <ExperienceEntry :exp="exp" :accent="accent" />
          </div>
        </section>

        <!-- Formation -->
        <section v-if="hasEducations">
          <h2
            class="text-[7.5pt] font-black uppercase tracking-[0.18em] mb-4 flex items-center gap-2"
            :style="{ color: accent }"
          >
            <span>Formation</span>
            <span
              class="h-px flex-1 opacity-20"
              :style="{ backgroundColor: accent }"
            />
          </h2>
          <div
            v-for="(edu, i) in snapshot.educations"
            :key="i"
            class="mb-3 pl-4"
            :style="{ borderLeft: `2px solid ${accent}20` }"
          >
            <EducationEntry :edu="edu" :accent="accent" />
          </div>
        </section>
      </div>

      <!-- Sidebar droite : contact + langues -->
      <aside class="space-y-6">
        <!-- Contact -->
        <div class="rounded-lg p-4" :style="{ backgroundColor: `${accent}08` }">
          <h2
            class="text-[7pt] font-black uppercase tracking-[0.18em] mb-3 pb-1.5"
            :style="{ color: accent, borderBottom: `1.5px solid ${accent}30` }"
          >
            Contact
          </h2>
          <ul class="space-y-1.5">
            <li
              v-for="item in contactItems"
              :key="item"
              class="text-[8pt] text-[#475569] leading-snug break-all"
            >
              {{ item }}
            </li>
          </ul>
        </div>

        <!-- Langues -->
        <div
          v-if="hasLanguages"
          class="rounded-lg p-4"
          :style="{ backgroundColor: `${accent}08` }"
        >
          <h2
            class="text-[7pt] font-black uppercase tracking-[0.18em] mb-3 pb-1.5"
            :style="{ color: accent, borderBottom: `1.5px solid ${accent}30` }"
          >
            Langues
          </h2>
          <ul class="space-y-3">
            <li
              v-for="(lang, i) in snapshot.languages"
              :key="i"
              class="text-[8.5pt]"
            >
              <div class="flex justify-between items-baseline mb-1">
                <span class="font-semibold text-[#0f172a]">{{
                  lang.name
                }}</span>
                <span class="text-[7.5pt] text-[#64748b]">{{
                  lang.level
                }}</span>
              </div>
              <!-- Barre de niveau -->
              <div
                class="h-[3px] w-full rounded-full bg-[#e2e8f0] overflow-hidden"
              >
                <div
                  class="h-full rounded-full"
                  :style="{
                    backgroundColor: accent,
                    width:
                      lang.level === 'Natif' || lang.level === 'C2'
                        ? '100%'
                        : lang.level === 'C1' || lang.level === 'Courant'
                          ? '85%'
                          : lang.level === 'B2' || lang.level === 'Avancé'
                            ? '70%'
                            : lang.level === 'B1' ||
                                lang.level === 'Intermédiaire'
                              ? '55%'
                              : lang.level === 'A2' || lang.level === 'Débutant'
                                ? '35%'
                                : '50%',
                  }"
                />
              </div>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </TemplatesTemplateShell>
</template>
