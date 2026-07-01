<script setup lang="ts">
import type { CoverLetterTemplateSlug } from '~/types/cover-letter'
import { DEFAULT_CLOSING_TEXT } from '~/types/cover-letter'
import {
  COVER_LETTER_TEMPLATE_REGISTRY,
  DEFAULT_LETTER_CONTENT,
} from '~/features/cover-letter-templates/registry'

const templateId = defineModel<CoverLetterTemplateSlug>('templateId', { required: true })
const senderName = defineModel<string>('senderName', { default: '' })
const senderEmail = defineModel<string>('senderEmail', { default: '' })
const senderPhone = defineModel<string>('senderPhone', { default: '' })
const senderLocation = defineModel<string>('senderLocation', { default: '' })
const companyName = defineModel<string>('companyName', { default: '' })
const companyAddress = defineModel<string>('companyAddress', { default: '' })
const position = defineModel<string>('position', { default: '' })
const recruiterName = defineModel<string>('recruiterName', { default: '' })
const content = defineModel<string>('content', { default: DEFAULT_LETTER_CONTENT })
const closingText = defineModel<string>('closingText', { default: DEFAULT_CLOSING_TEXT })

defineProps<{
  showTemplatePicker?: boolean
  fieldErrors?: Record<string, string>
}>()

function fieldError(fieldErrors: Record<string, string> | undefined, key: string) {
  return fieldErrors?.[key] ?? ''
}
</script>

<template>
  <div class="space-y-stack-md">
    <section v-if="showTemplatePicker !== false" class="space-y-3">
      <h2 class="text-sm font-bold text-on-surface">Modèle</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button
          v-for="tpl in COVER_LETTER_TEMPLATE_REGISTRY"
          :key="tpl.slug"
          type="button"
          class="rounded-xl border p-3 text-left transition-all"
          :class="
            templateId === tpl.slug
              ? 'border-secondary bg-secondary/5 ring-2 ring-secondary/20'
              : 'border-outline-variant hover:border-secondary/50'
          "
          @click="templateId = tpl.slug"
        >
          <p class="font-bold text-sm text-on-surface">{{ tpl.name }}</p>
          <p class="text-[11px] text-on-surface-variant mt-1 line-clamp-2">{{ tpl.description }}</p>
        </button>
      </div>
    </section>

    <section class="space-y-stack-sm">
      <h2 class="text-sm font-bold text-on-surface">Expéditeur</h2>
      <UiFormField label="Nom complet" required :error="fieldError(fieldErrors, 'senderName')">
        <input v-model="senderName" type="text" class="form-input form-input--white w-full" placeholder="Jean Dupont" />
      </UiFormField>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <UiFormField label="E-mail" :error="fieldError(fieldErrors, 'senderEmail')">
          <input v-model="senderEmail" type="email" class="form-input form-input--white w-full" />
        </UiFormField>
        <UiFormField label="Téléphone">
          <input v-model="senderPhone" type="text" class="form-input form-input--white w-full" />
        </UiFormField>
      </div>
      <UiFormField label="Ville / Adresse">
        <input v-model="senderLocation" type="text" class="form-input form-input--white w-full" placeholder="Dakar, Sénégal" />
      </UiFormField>
    </section>

    <section class="space-y-stack-sm">
      <h2 class="text-sm font-bold text-on-surface">Destinataire</h2>
      <UiFormField label="Entreprise" required :error="fieldError(fieldErrors, 'companyName')">
        <input v-model="companyName" type="text" class="form-input form-input--white w-full" placeholder="Acme Corp" />
      </UiFormField>
      <UiFormField label="Adresse entreprise (optionnel)">
        <textarea v-model="companyAddress" rows="2" class="form-input form-input--white w-full resize-y" />
      </UiFormField>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <UiFormField label="Poste visé" required :error="fieldError(fieldErrors, 'position')">
          <input v-model="position" type="text" class="form-input form-input--white w-full" />
        </UiFormField>
        <UiFormField label="Nom du recruteur (optionnel)">
          <input v-model="recruiterName" type="text" class="form-input form-input--white w-full" />
        </UiFormField>
      </div>
    </section>

    <section class="space-y-stack-sm">
      <h2 class="text-sm font-bold text-on-surface">Contenu</h2>
      <UiFormField label="Corps de la lettre" required :error="fieldError(fieldErrors, 'content')">
        <textarea v-model="content" rows="10" class="form-input form-input--white w-full resize-y" />
      </UiFormField>
      <UiFormField label="Formule de politesse">
        <textarea v-model="closingText" rows="2" class="form-input form-input--white w-full resize-y" />
      </UiFormField>
    </section>
  </div>
</template>
