<script setup lang="ts">
/**
 * Filigrane des aperçus avant paiement : lisible pour travailler, mais une capture d'écran
 * n'est pas présentable à un recruteur. Jamais rendu par les pages /imprimer (PDF payé).
 *
 * Grille de mentions penchées (et non un motif d'image répété, qui coupait le texte au bord
 * de chaque motif). 3 colonnes × 30 lignes couvrent un CV de plusieurs pages.
 */
const MARKS = 90
</script>

<template>
  <div class="preview-watermark" aria-hidden="true">
    <div class="preview-watermark__grid">
      <span v-for="i in MARKS" :key="i">APERÇU · PROFILO’Z</span>
    </div>
  </div>
</template>

<style scoped>
.preview-watermark {
  position: absolute;
  inset: 0;
  z-index: 40;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
}

.preview-watermark__grid {
  position: absolute;
  top: -40px;
  left: -60px;
  right: -60px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 190px;
  align-items: center;
  justify-items: center;
}

.preview-watermark__grid span {
  transform: rotate(-30deg);
  white-space: nowrap;
  font-family: Inter, Arial, sans-serif;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: rgb(15 23 42 / 0.11);
  /* Gardé à l'impression du navigateur (Ctrl+P) */
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
</style>
