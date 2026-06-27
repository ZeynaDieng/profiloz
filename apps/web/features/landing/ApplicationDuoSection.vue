<template>
  <section id="duo-candidature" class="py-12 md:py-20 bg-white border-t border-outline-variant/30">
    <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <div class="space-y-4 order-2 lg:order-1">
          <h2 class="text-xl sm:text-2xl lg:text-3xl font-bold text-on-surface leading-tight">
            CV + Lettre de motivation : le duo gagnant
          </h2>
          <p class="text-on-surface-variant text-sm sm:text-base leading-relaxed max-w-lg">
            Créez l'ensemble de votre dossier de candidature depuis une seule plateforme. Un CV percutant
            et une lettre personnalisée, harmonisés et exportables en PDF.
          </p>
          <ul class="space-y-3 pt-2">
            <li class="flex items-start gap-3 text-sm text-on-surface-variant">
              <UiPzIcon name="check_circle" class="text-secondary shrink-0 mt-0.5" />
              CV structuré, compatible ATS et prêt à envoyer
            </li>
            <li class="flex items-start gap-3 text-sm text-on-surface-variant">
              <UiPzIcon name="check_circle" class="text-secondary shrink-0 mt-0.5" />
              Lettres de motivation adaptées à chaque candidature
            </li>
            <li class="flex items-start gap-3 text-sm text-on-surface-variant">
              <UiPzIcon name="check_circle" class="text-secondary shrink-0 mt-0.5" />
              Export PDF immédiat pour les deux documents
            </li>
          </ul>
          <div class="flex flex-col sm:flex-row gap-3 pt-2">
            <NuxtLink
              to="/creer"
              class="inline-flex items-center justify-center gap-1.5 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-shadow"
            >
              Créer ma candidature
              <UiPzIcon name="arrow_forward" class="text-[17px]" />
            </NuxtLink>
            <NuxtLink
              to="/inscription?redirect=/tableau-de-bord/lettres/nouvelle"
              class="inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl border border-outline-variant text-on-surface font-semibold text-sm hover:border-secondary hover:text-secondary transition-colors"
            >
              <UiPzIcon name="mail" class="text-[17px]" />
              Rédiger une lettre
            </NuxtLink>
          </div>
        </div>

        <div class="order-1 lg:order-2">
          <div
            class="relative rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4 sm:p-6 shadow-[0_16px_48px_rgba(15,23,42,0.06)]"
          >
            <div class="grid grid-cols-2 gap-3 sm:gap-4 items-end">
              <!-- Mini CV -->
              <div class="rounded-xl border-2 border-secondary/25 bg-white shadow-md overflow-hidden aspect-[3/4]">
                <div class="h-8 bg-gradient-to-r from-secondary/10 to-transparent border-b border-secondary/15 flex items-center px-2">
                  <span class="text-[8px] font-bold text-secondary uppercase tracking-wide">CV</span>
                </div>
                <div class="p-2.5 sm:p-3 text-left">
                  <div class="border-b-2 border-secondary pb-1.5 mb-2">
                    <p class="text-[9px] sm:text-[10px] font-bold uppercase text-on-surface">Aminata Diallo</p>
                    <p class="text-[7px] sm:text-[8px] font-semibold text-secondary mt-0.5">Responsable marketing</p>
                  </div>
                  <p class="text-[6px] sm:text-[7px] font-bold uppercase text-on-surface mb-1">Expérience</p>
                  <p class="text-[6px] sm:text-[7px] text-on-surface-variant mb-2">Chef de projet — Orange Sénégal</p>
                  <p class="text-[6px] sm:text-[7px] font-bold uppercase text-on-surface mb-1">Compétences</p>
                  <div class="flex flex-wrap gap-0.5">
                    <span class="text-[5px] px-1 py-0.5 rounded bg-secondary/10 text-secondary">Marketing</span>
                    <span class="text-[5px] px-1 py-0.5 rounded bg-secondary/10 text-secondary">Digital</span>
                  </div>
                </div>
              </div>

              <!-- Mini lettre -->
              <div class="rounded-xl border border-outline-variant bg-white shadow-sm overflow-hidden aspect-[3/4] translate-y-2 sm:translate-y-3">
                <div class="h-8 bg-surface-container-low border-b border-outline-variant/30 flex items-center px-2">
                  <span class="text-[8px] font-bold text-on-surface-variant uppercase tracking-wide">Lettre</span>
                </div>
                <div class="p-2.5 sm:p-3 text-left font-[Georgia,Times,serif]">
                  <p class="text-[6px] sm:text-[7px] text-on-surface-variant text-right mb-2">15 juin 2026</p>
                  <p class="text-[7px] sm:text-[8px] text-on-surface mb-1.5">Madame, Monsieur,</p>
                  <p class="text-[6px] sm:text-[7px] text-on-surface-variant leading-relaxed">
                    Objet : Candidature au poste de Responsable marketing.
                  </p>
                  <p class="text-[6px] sm:text-[7px] text-on-surface-variant leading-relaxed mt-1.5">
                    Forte de mon expérience en gestion de projet digital, je souhaite rejoindre votre équipe...
                  </p>
                </div>
              </div>
            </div>

            <div
              class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-lg"
              aria-hidden="true"
            >
              <UiPzIcon name="add" class="text-[20px]" />
            </div>

            <p class="text-center text-xs text-on-surface-variant mt-4 font-medium">
              Un dossier complet, cohérent et professionnel
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
