<script setup lang="ts">
import { isBase64PhotoUrl, MSG } from '@profiloz/shared'

const model = defineModel<string | undefined>()

const avatarService = useAvatarService()
const previewUrl = ref<string | null>(null)
const isDragging = ref(false)
const uploading = ref(false)
const uploadError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const cropShape = ref<'circle' | 'square'>('circle')

function syncPreview(value?: string) {
  previewUrl.value = value ? avatarService.resolvePhoto(value) ?? null : null
}

async function processFile(file: File) {
  if (!file.type.startsWith('image/')) return
  if (file.size > 2 * 1024 * 1024) {
    uploadError.value = MSG.photo.size
    return
  }

  // Afficher l'aperçu local immédiatement
  const localPreview = URL.createObjectURL(file)
  previewUrl.value = localPreview

  uploading.value = true
  uploadError.value = ''

  try {
    await useGuestSession().ensureSession()
    const jpegBlob = await convertImageFileToJpegBlob(file)
    const previousKey = model.value && !isBase64PhotoUrl(model.value) ? model.value : undefined
    const result = await avatarService.uploadAvatar(jpegBlob)
    model.value = result.storageKey
    syncPreview(result.storageKey)
    // Libérer l'URL locale après upload réussi
    URL.revokeObjectURL(localPreview)

    if (previousKey?.startsWith('avatars/') && previousKey !== result.storageKey) {
      avatarService.deleteAvatar(previousKey).catch(() => {})
    }
  } catch {
    uploadError.value = MSG.photo.uploadError
    // En cas d'erreur, revenir à l'aperçu local
    previewUrl.value = localPreview
  } finally {
    uploading.value = false
  }
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) void processFile(file)
}

function onFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) void processFile(file)
}

async function removePhoto() {
  const currentKey = model.value
  previewUrl.value = null
  model.value = undefined
  if (fileInput.value) fileInput.value.value = ''

  if (currentKey?.startsWith('avatars/')) {
    avatarService.deleteAvatar(currentKey).catch(() => {})
  }
}

watch(
  model,
  (value) => {
    syncPreview(value)
  },
  { immediate: true },
)
</script>

<template>
  <UiFormField label="Photo de profil (facultatif)">
    <div
      class="relative border-2 border-dashed rounded-xl p-4 transition-colors"
      :class="isDragging ? 'border-secondary bg-secondary/5' : 'border-outline-variant'"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
    >
      <div v-if="uploading" class="text-center py-6 text-sm text-on-surface-variant">
        Envoi de la photo…
      </div>

      <div v-else-if="previewUrl" class="flex items-center gap-4">
        <div
          class="w-20 h-20 overflow-hidden bg-surface-container shrink-0"
          :class="cropShape === 'circle' ? 'rounded-full' : 'rounded-lg'"
        >
          <img :src="previewUrl" alt="Aperçu photo" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1 space-y-2">
          <div class="flex gap-2">
            <button
              type="button"
              class="text-xs px-2 py-1 rounded-md border border-outline-variant"
              :class="cropShape === 'circle' ? 'bg-secondary text-white border-secondary' : ''"
              @click="cropShape = 'circle'"
            >
              Ronde
            </button>
            <button
              type="button"
              class="text-xs px-2 py-1 rounded-md border border-outline-variant"
              :class="cropShape === 'square' ? 'bg-secondary text-white border-secondary' : ''"
              @click="cropShape = 'square'"
            >
              Carrée
            </button>
          </div>
          <div class="flex gap-3">
            <button type="button" class="text-sm text-secondary font-semibold" @click="fileInput?.click()">
              Changer
            </button>
            <button type="button" class="text-sm text-error" @click="removePhoto">Supprimer</button>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-4">
        <UiPzIcon name="add_a_photo" class="text-3xl text-on-surface-variant/40 mb-2" />
        <p class="text-sm text-on-surface-variant mb-2">Glissez une photo ou</p>
        <button
          type="button"
          class="text-sm text-secondary font-bold hover:underline"
          @click="fileInput?.click()"
        >
          parcourir vos fichiers
        </button>
        <p class="text-xs text-on-surface-variant/60 mt-2">JPG, PNG · max 2 Mo</p>
      </div>

      <UiMessageBanner v-if="uploadError" variant="error" :message="uploadError" class="mt-2" />

      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="hidden"
        @change="onFileSelect"
      />
    </div>
  </UiFormField>
</template>
