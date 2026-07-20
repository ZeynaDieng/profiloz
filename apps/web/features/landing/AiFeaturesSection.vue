<script setup lang="ts">
const { target, revealed } = useScrollReveal()

const aiFeatures = [
  {
    id: 'vision',
    sticker: '📸',
    badge: 'Vision IA & Photo',
    title: 'Extraction & Découpage Photo 👁️',
    description:
      'Importez votre ancien CV en PDF, Word ou photo. L\'IA lit l\'intégralité de votre parcours et extrait automatiquement votre photo de profil pour l\'adapter à tous les modèles.',
    accent: '#0051d5',
    gradient: 'from-blue-500/10 via-indigo-500/5 to-transparent',
    borderColor: 'group-hover:border-blue-500/40',
    demo: {
      type: 'photo',
      badge: 'Photo isolée & intégrée ✨',
    },
  },
  {
    id: 'copilot',
    sticker: '✨',
    badge: 'Co-Pilote de Rédaction',
    title: 'Reformulation Pro & Puces Métier 💡',
    description:
      'Fini la peur de la page blanche. Un clic sur « ✨ Embellir » transforme vos descriptions en phrases percutantes avec des verbes d\'action à fort impact.',
    accent: '#7c3aed',
    gradient: 'from-purple-500/10 via-fuchsia-500/5 to-transparent',
    borderColor: 'group-hover:border-purple-500/40',
    demo: {
      type: 'before-after',
      before: 'J\'ai géré la caisse et la clientèle',
      after: 'Gestion rigoureuse des opérations de caisse & optimisation de la relation client',
    },
  },
  {
    id: 'letter',
    sticker: '🎯',
    badge: 'Générateur Sur-Mesure',
    title: 'Lettre adaptée à l\'Offre en 5s 📝',
    description:
      'Collez l\'annonce de recrutement à laquelle vous postulez. L\'IA analyse l\'offre et votre profil pour rédiger une lettre captivante et 100 % ciblée.',
    accent: '#059669',
    gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
    borderColor: 'group-hover:border-emerald-500/40',
    demo: {
      type: 'job-offer',
      offer: 'Responsable Marketing chez Wave...',
      status: 'Lettre générée sur-mesure 🚀',
    },
  },
] as const
</script>

<template>
  <section class="landing-section relative overflow-hidden py-16 lg:py-24 bg-surface-container-lowest border-t border-outline-variant/20">
    <!-- Fond décoratif avec lueurs lumineuses -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
    </div>

    <div
      ref="target"
      class="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop relative z-10"
      :class="revealed ? 'scroll-reveal is-revealed' : 'scroll-reveal'"
    >
      <!-- En-tête de section -->
      <div class="text-center max-w-3xl mx-auto space-y-4 mb-12 lg:mb-16">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shadow-sm animate-pulse">
          <span>✨ Puissant & Intelligent</span>
        </div>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
          Préparez un dossier parfait avec l'
          <span class="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Assistant IA Profilo'Z
          </span> 🚀
        </h2>
        <p class="text-on-surface-variant text-base sm:text-lg max-w-2xl mx-auto">
          De la lecture visuelle de votre CV à la rédaction de lettres ciblées d'après des offres d'emploi : profitez d'outils intelligents conçus pour déclencher des entretiens.
        </p>
      </div>

      <!-- Grille des 3 Cartes IA -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        <div
          v-for="item in aiFeatures"
          :key="item.id"
          class="group relative rounded-3xl p-6 lg:p-8 bg-surface/70 backdrop-blur-md border border-outline-variant/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          :class="item.borderColor"
        >
          <!-- Dégradé de fond au survol -->
          <div
            class="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            :class="item.gradient"
          />

          <div class="relative z-10 space-y-5">
            <!-- Badge & Sticker Header -->
            <div class="flex items-center justify-between">
              <span class="text-3xl select-none transform group-hover:scale-125 transition-transform duration-300">
                {{ item.sticker }}
              </span>
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-surface-container border border-outline-variant/30 text-on-surface">
                {{ item.badge }}
              </span>
            </div>

            <!-- Titre & Description -->
            <div class="space-y-2">
              <h3 class="text-xl font-bold text-on-surface group-hover:text-primary transition-colors">
                {{ item.title }}
              </h3>
              <p class="text-sm text-on-surface-variant leading-relaxed">
                {{ item.description }}
              </p>
            </div>
          </div>

          <!-- Démo Visuelle Interactive (Simulée) -->
          <div class="relative z-10 mt-6 pt-5 border-t border-outline-variant/30">
            <!-- Type 1: Photo -->
            <div v-if="item.demo.type === 'photo'" class="bg-surface-container-low rounded-2xl p-3.5 border border-outline-variant/30 flex items-center gap-3 shadow-inner">
              <div class="relative w-11 h-11 rounded-full bg-primary/20 border-2 border-primary overflow-hidden shrink-0 flex items-center justify-center font-bold text-primary text-sm shadow-sm">
                <span>📸</span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold text-on-surface truncate">Photo extraite & cadrée</p>
                <p class="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                  <span>{{ item.demo.badge }}</span>
                </p>
              </div>
            </div>

            <!-- Type 2: Before After -->
            <div v-else-if="item.demo.type === 'before-after'" class="space-y-2 text-xs">
              <div class="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/20 text-on-surface-variant line-through opacity-70">
                "{{ item.demo.before }}"
              </div>
              <div class="bg-primary/10 p-2.5 rounded-xl border border-primary/30 text-primary font-medium flex items-start gap-1.5 shadow-sm">
                <span class="shrink-0 mt-0.5">✨</span>
                <span>"{{ item.demo.after }}"</span>
              </div>
            </div>

            <!-- Type 3: Job Offer -->
            <div v-else-if="item.demo.type === 'job-offer'" class="bg-surface-container-low rounded-2xl p-3.5 border border-outline-variant/30 space-y-2">
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-on-surface-variant truncate">{{ item.demo.offer }}</span>
                <span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold text-[10px] shrink-0">Offre</span>
              </div>
              <div class="text-xs font-bold text-primary flex items-center gap-1.5 pt-1 border-t border-outline-variant/20">
                <span>{{ item.demo.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bouton d'action CTA rapide -->
      <div class="text-center mt-12">
        <NuxtLink
          to="/creer/importer/cv"
          class="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-primary text-on-primary font-bold text-sm sm:text-base hover:bg-primary-hover shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
        >
          <span>Essayer l'Assistant IA maintenant</span>
          <span class="text-lg">🚀</span>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
