<script setup lang="ts">
import { isBase64PhotoUrl, MSG } from '@profiloz/shared'

const model = defineModel<string | undefined>()
const showOnCv = defineModel<boolean>('showOnCv', { default: true })

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

  showOnCv.value = true

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
    URL.revokeObjectURL(localPreview)

    if (previousKey?.startsWith('avatars/') && previousKey !== result.storageKey) {
      avatarService.deleteAvatar(previousKey).catch(() => {})
    }
  } catch {
    uploadError.value = MSG.photo.uploadError
    URL.revokeObjectURL(localPreview)
    previewUrl.value = model.value ? avatarService.resolvePhoto(model.value) ?? null : null
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

function hidePhotoOnCv() {
  showOnCv.value = false
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
    <div class="flex items-center justify-between gap-3 mb-3">
      <p class="text-sm text-on-surface-variant">{{ MSG.photo.showOnCv }}</p>
      <button
        type="button"
        role="switch"
        class="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors"
        :class="showOnCv ? 'bg-secondary' : 'bg-outline-variant'"
        :aria-checked="showOnCv"
        @click="showOnCv = !showOnCv"
      >
        <span
          class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
          :class="showOnCv ? 'translate-x-6' : 'translate-x-1'"
        />
      </button>
    </div>

    <div
      v-if="!showOnCv"
      class="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-5 text-center space-y-3"
    >
      <UiPzIcon name="hide_image" class="text-3xl text-on-surface-variant/50" />
      <p class="text-sm text-on-surface-variant">{{ MSG.photo.hiddenOnCv }}</p>
      <button
        type="button"
        class="text-sm text-secondary font-bold hover:underline"
        @click="showOnCv = true"
      >
        {{ MSG.photo.addPhoto }}
      </button>
    </div>

    <div
      v-else
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
          <div class="flex flex-wrap gap-3">
            <button type="button" class="text-sm text-secondary font-semibold" @click="fileInput?.click()">
              Changer
            </button>
            <button type="button" class="text-sm text-error" @click="removePhoto">Supprimer</button>
            <button type="button" class="text-sm text-on-surface-variant" @click="hidePhotoOnCv">
              Masquer sur le CV
            </button>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-4 space-y-3">
        <UiPzIcon name="add_a_photo" class="text-3xl text-on-surface-variant/40 mb-2" />
        <p class="text-sm text-on-surface-variant mb-2">Glissez une photo ou</p>
        <button
          type="button"
          class="text-sm text-secondary font-bold hover:underline"
          @click="fileInput?.click()"
        >
          parcourir vos fichiers
        </button>
        <p class="text-xs text-on-surface-variant/60">JPG, PNG · max 2 Mo</p>
        <button
          type="button"
          class="block w-full text-xs text-on-surface-variant hover:text-secondary pt-1"
          @click="hidePhotoOnCv"
        >
          Je ne veux pas de photo sur mon CV
        </button>
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
