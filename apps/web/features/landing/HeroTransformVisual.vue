<template>
  <div class="hero-visual relative">
    <div
      class="absolute -inset-2 md:-inset-4 rounded-[32px] bg-gradient-to-br from-secondary/8 via-transparent to-primary/5 blur-2xl pointer-events-none"
      aria-hidden="true"
    />

    <div
      class="relative rounded-2xl border border-outline-variant/25 bg-surface-container-lowest/90 backdrop-blur-sm p-3 sm:p-4 shadow-[0_16px_48px_rgba(15,23,42,0.06)] overflow-hidden"
    >
      <!-- Desktop -->
      <div class="hidden sm:block">
        <div
          class="grid grid-cols-[1fr_auto_1fr] gap-2.5 md:gap-3 items-stretch"
        >
          <!-- Ancien CV — daté, Word/PDF -->
          <div
            class="hero-card hero-card-1 rounded-lg border border-[#bbb] bg-[#f2ece0] shadow-sm overflow-hidden flex flex-col hero-old-doc"
          >
            <div
              class="flex items-center gap-1 px-2 py-1 bg-[#d24726] text-white text-[8px] font-medium shrink-0"
            >
              <UiPzIcon name="picture_as_pdf" class="text-[11px]" />
              <span class="truncate">CV_2019.pdf</span>
            </div>
            <div
              class="p-3 font-[Georgia,Times,'Times_New_Roman',serif] text-[#3a3a3a] leading-[1.35] space-y-1 flex-1"
            >
              <p class="text-[13px] font-bold text-[#222] tracking-tight">
                CURRICULUM VITAE
              </p>
              <p class="text-[12px] font-bold underline text-[#333]">
                aminata diallo
              </p>
              <p class="text-[8px] text-[#666] leading-tight">
                Email: aminata@gmail.com &nbsp;|&nbsp; Tel: 770000000
              </p>
              <p class="text-[9px] font-bold pt-1 text-[#444] tracking-wider">
                EXPERIENCE PROFESSIONNELLE
              </p>
              <p class="text-[8px] pl-2 text-[#555] leading-snug">
                - Orange Senegal, chef de projet (2021)<br />
                gestion campagnes digital et reseaux sociaux
              </p>
              <p class="text-[9px] font-bold pt-0.5 text-[#444]">FORMATION</p>
              <p class="text-[8px] pl-2 text-[#555]">
                Master Marketing, UCAD (2019)
              </p>
              <p class="text-[9px] font-bold pt-0.5 text-[#444]">COMPETENCES</p>
              <p class="text-[8px] pl-2 text-[#555]">
                Word, Excel, communication, marketing
              </p>
            </div>
          </div>

          <!-- Flèche -->
          <div
            class="flex flex-col items-center justify-center gap-0.5 px-0.5 hero-arrow"
            aria-hidden="true"
          >
            <UiPzIcon name="arrow_forward" class="text-secondary text-[20px]" />
          </div>

          <!-- Nouveau CV Profilo'Z -->
          <div
            class="hero-card hero-card-2 rounded-xl bg-white border-2 border-secondary/30 shadow-[0_8px_30px_rgba(0,81,213,0.12)] overflow-hidden flex flex-col z-10 hero-new-doc"
          >
            <div
              class="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-[#0051d5]/8 to-transparent border-b border-[#0051d5]/15 shrink-0"
            >
              <UiOptimizedImage
                src="/logo.png"
                alt="Profilo'Z"
                loading="lazy"
                img-class="h-5 w-auto object-contain"
              />
              <span
                class="text-[8px] px-1.5 py-0.5 rounded-full bg-secondary/10 text-secondary font-semibold"
                >Pro</span
              >
            </div>
            <div class="p-3 flex-1 text-left">
              <div class="border-b-2 border-[#0051d5] pb-2 mb-2.5">
                <p
                  class="text-[13px] font-bold uppercase tracking-tight text-on-surface"
                >
                  Aminata Diallo
                </p>
                <p
                  class="text-[10px] font-semibold uppercase text-[#0051d5] mt-0.5 tracking-wide"
                >
                  Responsable marketing
                </p>
                <p
                  class="text-[8px] text-on-surface-variant mt-1.5 leading-relaxed"
                >
                  aminata@exemple.com · +221 77 000 00 00 · Dakar
                </p>
              </div>
              <p
                class="text-[9px] font-bold uppercase text-on-surface mb-1 tracking-wide"
              >
                Expérience
              </p>
              <div class="mb-2">
                <p class="text-[9px] font-bold text-on-surface">
                  Chef de projet digital — Orange Sénégal
                </p>
                <p class="text-[8px] text-on-surface-variant">2021 – Présent</p>
              </div>
              <p
                class="text-[9px] font-bold uppercase text-on-surface mb-1 tracking-wide"
              >
                Formation
              </p>
              <p class="text-[9px] text-on-surface mb-2">
                Master Marketing — UCAD
              </p>
              <p
                class="text-[9px] font-bold uppercase text-on-surface mb-1 tracking-wide"
              >
                Compétences
              </p>
              <div class="flex flex-wrap gap-1">
                <span
                  class="text-[7px] px-1.5 py-0.5 rounded-md bg-[#0051d5]/12 text-[#0051d5] font-semibold"
                  >Communication</span
                >
                <span
                  class="text-[7px] px-1.5 py-0.5 rounded-md bg-[#0051d5]/12 text-[#0051d5] font-semibold"
                  >Marketing</span
                >
                <span
                  class="text-[7px] px-1.5 py-0.5 rounded-md bg-[#0051d5]/12 text-[#0051d5] font-semibold"
                  >Gestion</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile -->
      <div class="sm:hidden flex flex-col gap-2">
        <div
          class="hero-card hero-card-1 rounded-lg border border-[#bbb] bg-[#f2ece0] shadow-sm overflow-hidden hero-old-doc"
        >
          <div
            class="flex items-center gap-1 px-2 py-1 bg-[#d24726] text-white text-[8px] font-medium"
          >
            <UiPzIcon name="picture_as_pdf" class="text-[11px]" />
            <span>CV_2019.pdf</span>
          </div>
          <div
            class="p-3 font-[Georgia,serif] text-[#444] leading-snug space-y-0.5"
          >
            <p class="text-[12px] font-bold underline">aminata diallo</p>
            <p class="text-[8px] text-[#666]">aminata@gmail.com · dakar</p>
            <p class="text-[8px] text-[#555] pt-0.5">
              Mise en page basique, sections mal alignées...
            </p>
          </div>
        </div>

        <div class="flex justify-center hero-arrow py-1" aria-hidden="true">
          <UiPzIcon name="arrow_downward" class="text-secondary text-[20px]" />
        </div>

        <div
          class="hero-card hero-card-2 rounded-xl bg-white border-2 border-secondary/30 shadow-[0_6px_24px_rgba(0,81,213,0.1)] overflow-hidden hero-new-doc"
        >
          <div
            class="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-[#0051d5]/8 to-transparent border-b border-[#0051d5]/15"
          >
            <UiOptimizedImage
              src="/logo.png"
              alt="Profilo'Z"
              loading="lazy"
              img-class="h-5 w-auto object-contain"
            />
            <span
              class="text-[8px] px-1.5 py-0.5 rounded-full bg-secondary/10 text-secondary font-semibold"
              >Pro</span
            >
          </div>
          <div class="p-3 text-left">
            <div class="border-b-2 border-[#0051d5] pb-2 mb-2">
              <p class="text-[13px] font-bold uppercase text-on-surface">
                Aminata Diallo
              </p>
              <p
                class="text-[10px] font-semibold uppercase text-[#0051d5] mt-0.5"
              >
                Responsable marketing
              </p>
            </div>
            <p class="text-[9px] font-bold uppercase mb-1">Expérience</p>
            <p class="text-[9px] text-on-surface mb-2">
              Chef de projet digital — Orange Sénégal
            </p>
            <div class="flex flex-wrap gap-1">
              <span
                class="text-[7px] px-1.5 py-0.5 rounded-md bg-[#0051d5]/12 text-[#0051d5] font-semibold"
                >Communication</span
              >
              <span
                class="text-[7px] px-1.5 py-0.5 rounded-md bg-[#0051d5]/12 text-[#0051d5] font-semibold"
                >Marketing</span
              >
            </div>
          </div>
        </div>
      </div>

      <p
        class="text-center text-xs sm:text-sm text-on-surface-variant mt-2.5 sm:mt-3 font-medium"
      >
        Importez vos documents ou créez CV et lettre nous faisons le reste.
      </p>
    </div>
  </div>
</template>

<style scoped>
.hero-old-doc {
  filter: saturate(0.75) contrast(0.95);
}

.hero-new-doc {
  filter: saturate(1.05);
}

.hero-card {
  opacity: 0;
  animation: hero-card-in 0.65s ease forwards;
}

.hero-card-1 {
  animation-delay: 0.4s;
}
.hero-card-2 {
  animation-delay: 0.55s;
}

@keyframes hero-card-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-card-1.hero-card {
  animation-name: hero-card-in-old;
}

@keyframes hero-card-in-old {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 0.92;
    transform: translateY(2px);
  }
}

.hero-card-2.hero-card {
  animation-name: hero-card-in-new;
}

@keyframes hero-card-in-new {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(-2px);
  }
}

.hero-arrow {
  animation: hero-arrow-pulse 2.5s ease-in-out infinite;
}

@keyframes hero-arrow-pulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}
</style>
