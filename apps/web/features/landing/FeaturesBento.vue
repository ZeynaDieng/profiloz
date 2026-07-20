<script setup lang="ts">
const features = [
  {
    id: 'import',
    badge: 'Import par IA',
    title: 'Importez votre ancien CV',
    description: 'PDF, Word ou photo : l’intelligence artificielle extrait tout votre parcours et recadre automatiquement votre photo de profil.',
    icon: 'document_scanner',
    accent: '#0051d5',
    canvas: '#ebf7ff',
    cta: { label: 'Importer mon CV', to: '/creer/importer/cv' },
    cell: 'a',
  },
  {
    id: 'templates',
    badge: 'Compatibilité ATS',
    title: 'Des modèles qui impressionnent',
    description: 'Pensés pour les recruteurs et les logiciels de sélection.',
    icon: 'design_services',
    accent: '#059669',
    canvas: '#f0f9f4',
    cta: { label: 'Voir les modèles', to: '/creer/modele' },
    cell: 'b',
  },
  {
    id: 'letter',
    badge: 'Lettre par IA',
    title: 'Une lettre par candidature',
    description: 'Collez une offre d’emploi : l’IA rédige une lettre de motivation sur-mesure et ciblée pour le poste.',
    icon: 'edit_note',
    accent: '#7c3aed',
    canvas: '#f3f4ff',
    cta: { label: 'Créer une lettre', to: '/creer/lettre' },
    cell: 'c',
  },
  {
    id: 'pdf',
    badge: 'Export immédiat',
    title: 'Téléchargez et envoyez',
    description: 'PDF propre, prêt à envoyer depuis votre téléphone ou votre ordinateur.',
    icon: 'picture_as_pdf',
    accent: '#009485',
    canvas: '#ecfeff',
    cta: { label: 'Commencer gratuitement', to: '/creer' },
    cell: 'd',
  },
] as const

const importSteps = ['Informations', 'Expériences', 'Formation', 'Compétences'] as const

const { target, revealed } = useScrollReveal()
</script>

<template>
  <section id="features" class="landing-section bg-surface-container-lowest border-y border-outline-variant/20">
    <div
      ref="target"
      class="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop overflow-x-clip"
      :class="revealed ? 'scroll-reveal is-revealed' : 'scroll-reveal'"
    >
      <div class="landing-section-header landing-section-header--left">
        <p class="landing-eyebrow">Fonctionnalités</p>
        <UiTypewriterText
          tag="h2"
          class="landing-title"
          :active="revealed"
          :segments="[
            { text: 'Bien plus qu\'un simple' },
            { text: ' créateur de CV', class: 'text-secondary' },
          ]"
          loop
          loop-mode="tail"
        />
        <p class="landing-lead !max-w-2xl">
          Chaque bloc vous guide vers un dossier prêt à envoyer : import, modèles, lettre et PDF.
        </p>
      </div>

      <div class="bento-grid">
        <article
          v-for="(feature, index) in features"
          :key="feature.id"
          class="bento-cell"
          :class="[`bento-cell--${feature.cell}`, revealed && 'bento-cell--revealed']"
          :style="{
            '--bento-accent': feature.accent,
            '--bento-canvas': feature.canvas,
            '--bento-i': index,
          }"
        >
          <div class="bento-cell__content">
            <span class="bento-badge">
              {{ feature.badge }}
            </span>
            <h3 class="landing-subtitle bento-cell__title">{{ feature.title }}</h3>
            <p class="bento-cell__desc">{{ feature.description }}</p>
            <NuxtLink :to="feature.cta.to" class="bento-cta">
              {{ feature.cta.label }}
              <UiPzIcon name="chevron_right" class="text-[18px]" />
            </NuxtLink>
          </div>

          <!-- Visuel import -->
          <div v-if="feature.id === 'import'" class="bento-visual bento-visual--import" aria-hidden="true">
            <div class="bento-mock bento-mock--sheet">
              <p class="bento-mock__label">Étapes remplies</p>
              <ul class="bento-mock__list">
                <li v-for="(step, i) in importSteps" :key="step" class="bento-mock__row">
                  <span class="bento-mock__check">
                    <UiPzIcon name="check" class="text-[12px]" />
                  </span>
                  <span>{{ step }}</span>
                  <span v-if="i === 0" class="bento-mock__pill">Auto</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Visuel modèles -->
          <div v-else-if="feature.id === 'templates'" class="bento-visual bento-visual--templates" aria-hidden="true">
            <div class="bento-template-stack">
              <div v-for="n in 3" :key="n" class="bento-template-card" :style="{ '--i': n }">
                <div class="bento-template-card__bar" />
                <div class="bento-template-card__line" />
                <div class="bento-template-card__line bento-template-card__line--short" />
              </div>
            </div>
          </div>

          <!-- Visuel lettre -->
          <div v-else-if="feature.id === 'letter'" class="bento-visual bento-visual--letter" aria-hidden="true">
            <div class="bento-mock bento-mock--editor">
              <div class="bento-mock__toolbar">
                <span /><span /><span />
              </div>
              <div class="bento-mock__para" />
              <div class="bento-mock__para bento-mock__para--short" />
              <div class="bento-mock__cursor" />
            </div>
          </div>

          <!-- Visuel PDF -->
          <div v-else class="bento-visual bento-visual--pdf" aria-hidden="true">
            <div class="bento-pdf-card">
              <UiPzIcon name="picture_as_pdf" class="text-[2rem] text-secondary" />
              <p class="bento-pdf-card__name">CV_Aminata.pdf</p>
              <span class="bento-pdf-card__ready">
                <UiPzIcon name="check_circle" class="text-[14px]" />
                Prêt
              </span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.bento-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
  padding-bottom: 0.5rem;
}

@media (min-width: 768px) {
  .bento-grid {
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 1.25rem;
  }

  .bento-cell--a {
    grid-column: span 7;
    min-height: 20rem;
  }

  .bento-cell--b {
    grid-column: span 5;
    min-height: 20rem;
  }

  .bento-cell--c {
    grid-column: span 5;
    min-height: 18rem;
  }

  .bento-cell--d {
    grid-column: span 7;
    min-height: 18rem;
  }
}

.bento-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1.5rem;
  border-radius: 1.75rem;
  overflow: hidden;
  background: var(--bento-canvas);
  border: 1px solid color-mix(in srgb, var(--bento-accent) 12%, white);
  box-shadow: var(--shadow-elevated-sm);
  transition:
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.35s ease;
}

@media (min-width: 640px) {
  .bento-cell {
    padding: 1.75rem 1.75rem 1.5rem;
    border-radius: 2rem;
  }
}

.bento-cell--revealed {
  animation: bento-rise 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--bento-i, 0) * 90ms + 60ms);
}

@keyframes bento-rise {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bento-cell__content {
  position: relative;
  z-index: 2;
  max-width: 22rem;
}

.bento-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.65rem;
  margin-bottom: 0.75rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--bento-accent);
  background: color-mix(in srgb, var(--bento-accent) 10%, white);
  border: 1px solid color-mix(in srgb, var(--bento-accent) 18%, transparent);
}

.bento-cell__title {
  margin: 0;
}

.bento-cell__desc {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--color-on-surface-variant);
}

.bento-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  margin-top: 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-secondary);
  transition: gap 0.2s ease;
}

.bento-cta:hover {
  gap: 0.35rem;
}

.bento-visual {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 7.5rem;
  pointer-events: none;
}

@media (min-width: 768px) {
  .bento-visual--import,
  .bento-visual--pdf {
    position: absolute;
    right: -0.5rem;
    bottom: -0.5rem;
    width: 52%;
    max-width: 16rem;
  }

  .bento-visual--templates {
    position: absolute;
    right: 0.75rem;
    bottom: 0;
    width: 55%;
    height: 72%;
  }

  .bento-visual--letter {
    position: absolute;
    right: 0.5rem;
    bottom: -1rem;
    width: 58%;
    max-width: 14rem;
  }
}

.bento-mock {
  background: white;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--bento-accent) 15%, var(--color-outline-variant));
  box-shadow: 0 12px 32px color-mix(in srgb, var(--bento-accent) 12%, transparent);
}

.bento-mock--sheet {
  padding: 0.875rem 1rem;
  transform: rotate(2deg);
}

.bento-mock__label {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-on-surface-variant);
  margin-bottom: 0.5rem;
}

.bento-mock__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.bento-mock__row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-on-surface);
}

.bento-mock__check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.125rem;
  height: 1.125rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--bento-accent) 15%, white);
  color: var(--bento-accent);
}

.bento-mock__pill {
  margin-left: auto;
  padding: 0.1rem 0.4rem;
  border-radius: 9999px;
  font-size: 0.5625rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--bento-accent);
  background: color-mix(in srgb, var(--bento-accent) 12%, white);
}

.bento-template-stack {
  position: relative;
  height: 100%;
  min-height: 8rem;
}

.bento-template-card {
  position: absolute;
  right: 0;
  width: 78%;
  padding: 0.65rem 0.75rem;
  border-radius: 0.75rem;
  background: white;
  border: 1px solid color-mix(in srgb, var(--bento-accent) 18%, transparent);
  box-shadow: 0 8px 24px rgba(11, 28, 48, 0.08);
  transform: rotate(calc(var(--i) * 4deg - 6deg));
}

.bento-template-card:nth-child(1) {
  top: 8%;
  z-index: 3;
}

.bento-template-card:nth-child(2) {
  top: 32%;
  right: 8%;
  z-index: 2;
  opacity: 0.92;
}

.bento-template-card:nth-child(3) {
  top: 54%;
  right: 4%;
  z-index: 1;
  opacity: 0.85;
}

.bento-template-card__bar {
  height: 0.35rem;
  width: 40%;
  border-radius: 9999px;
  background: var(--bento-accent);
  margin-bottom: 0.5rem;
}

.bento-template-card__line {
  height: 0.25rem;
  border-radius: 9999px;
  background: var(--color-surface-container);
  margin-bottom: 0.35rem;
}

.bento-template-card__line--short {
  width: 65%;
}

.bento-mock--editor {
  padding: 0.75rem;
  transform: rotate(-3deg);
}

.bento-mock__toolbar {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.65rem;
}

.bento-mock__toolbar span {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 9999px;
  background: var(--color-surface-container-high);
}

.bento-mock__para {
  height: 0.35rem;
  border-radius: 9999px;
  background: var(--color-surface-container);
  margin-bottom: 0.4rem;
}

.bento-mock__para--short {
  width: 72%;
}

.bento-mock__cursor {
  width: 1px;
  height: 0.9rem;
  background: var(--bento-accent);
  animation: bento-blink 1.1s step-end infinite;
}

@keyframes bento-blink {
  50% {
    opacity: 0;
  }
}

.bento-pdf-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 1.25rem 1.5rem;
  border-radius: 1.25rem;
  background: white;
  border: 1px solid color-mix(in srgb, var(--bento-accent) 20%, transparent);
  box-shadow: 0 16px 40px color-mix(in srgb, var(--bento-accent) 14%, transparent);
  transform: rotate(3deg);
}

.bento-pdf-card__name {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--color-on-surface);
}

.bento-pdf-card__ready {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--bento-accent);
}

@media (hover: hover) {
  .bento-cell:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-elevated-md);
  }
}

@media (prefers-reduced-motion: reduce) {
  .bento-cell--revealed {
    animation: none;
  }

  .bento-mock__cursor {
    animation: none;
  }
}
</style>
