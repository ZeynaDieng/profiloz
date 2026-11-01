<script setup lang="ts">
import { parseApiAuthError } from '~/utils/api-error'

/**
 * Avis client après téléchargement. N'apparaît que pour un client ayant payé ; l'avis
 * est publié sur l'accueil seulement après validation par l'équipe.
 */
const props = defineProps<{ defaultName?: string }>()

const reviewService = useReviewService()
const canReview = ref(false)
const sent = ref(false)
const sending = ref(false)
const error = ref('')

const rating = ref(0)
const hover = ref(0)
const comment = ref('')
const displayName = ref('')
const city = ref('')
const consent = ref(false)

/** « Awa Diop » → « Awa D. » : par défaut, le nom de famille n'est pas affiché en entier. */
function shortName(full?: string) {
  const parts = (full ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]!
  return `${parts[0]} ${parts[parts.length - 1]!.charAt(0).toUpperCase()}.`
}

onMounted(async () => {
  try {
    const mine = await reviewService.getMine()
    canReview.value = mine.canReview
    if (mine.review) {
      rating.value = mine.review.rating
      comment.value = mine.review.comment
      displayName.value = mine.review.displayName
      city.value = mine.review.city ?? ''
      sent.value = true
    } else {
      displayName.value = shortName(props.defaultName)
    }
  } catch {
    canReview.value = false
  }
})

const canSubmit = computed(
  () => rating.value > 0 && comment.value.trim().length >= 10 && displayName.value.trim().length >= 2 && consent.value,
)

/** Un avis modifié repart en validation : on redemande le consentement. */
function edit() {
  consent.value = false
  sent.value = false
}

async function submit() {
  if (!canSubmit.value) return
  sending.value = true
  error.value = ''
  try {
    await reviewService.submit({
      rating: rating.value,
      comment: comment.value.trim(),
      displayName: displayName.value.trim(),
      city: city.value.trim() || undefined,
      consent: consent.value,
    })
    sent.value = true
  } catch (err) {
    error.value = parseApiAuthError(err, 'Envoi impossible. Réessayez dans un instant.')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div v-if="canReview" class="w-full max-w-xl mt-8 p-5 rounded-2xl border border-slate-200 bg-white text-left">
    <div v-if="sent" class="flex items-start gap-3">
      <UiPzIcon name="check_circle" class="text-emerald-600 text-2xl shrink-0" />
      <div>
        <p class="font-bold text-sm text-slate-800">Merci pour votre avis !</p>
        <p class="text-xs text-slate-500 mt-1">
          Il sera publié sur Profilo’Z après une rapide vérification par notre équipe.
          <button type="button" class="text-secondary font-semibold hover:underline" @click="edit">Modifier</button>
        </p>
      </div>
    </div>

    <form v-else class="space-y-4" @submit.prevent="submit">
      <div>
        <p class="font-bold text-sm text-slate-800">Votre avis compte</p>
        <p class="text-xs text-slate-500 mt-0.5">Aidez les prochains candidats : comment s’est passée la création de votre dossier ?</p>
      </div>

      <div class="flex items-center gap-1" role="radiogroup" aria-label="Note sur 5" @mouseleave="hover = 0">
        <button
          v-for="star in 5"
          :key="star"
          type="button"
          role="radio"
          :aria-checked="rating === star"
          :aria-label="`${star} étoile${star > 1 ? 's' : ''}`"
          class="p-0.5"
          @mouseenter="hover = star"
          @click="rating = star"
        >
          <UiPzIcon name="star" filled class="text-[28px]" :class="star <= (hover || rating) ? 'text-amber-400' : 'text-slate-200'" />
        </button>
      </div>

      <textarea
        v-model="comment"
        rows="3"
        maxlength="600"
        class="form-input w-full resize-none text-base sm:text-sm"
        placeholder="Ex : Mon CV était prêt en 10 minutes, le PDF est très propre."
      />

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input v-model="displayName" maxlength="40" class="form-input w-full text-base sm:text-sm" placeholder="Nom affiché (ex : Awa D.)" />
        <input v-model="city" maxlength="40" class="form-input w-full text-base sm:text-sm" placeholder="Ville (facultatif)" />
      </div>

      <label class="flex items-start gap-2 text-xs text-slate-600">
        <input v-model="consent" type="checkbox" class="mt-0.5" />
        <span>J’accepte que mon avis, ce nom et cette ville soient publiés sur le site Profilo’Z.</span>
      </label>

      <p v-if="error" class="text-xs text-error font-semibold" role="alert">{{ error }}</p>

      <button
        type="submit"
        class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm disabled:opacity-50"
        :disabled="!canSubmit || sending"
      >
        {{ sending ? 'Envoi…' : 'Envoyer mon avis' }}
      </button>
    </form>
  </div>
</template>
