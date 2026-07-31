<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'

const props = defineProps<{
  open: boolean
  currentSignature?: string
  senderName?: string
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'save', signatureUrl: string): void
}>()

const activeTab = ref<'draw' | 'upload' | 'type'>('draw')

// --- MODE 1: DESSINER SUR CANVAS ---
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isDrawing = ref(false)
const hasDrawn = ref(false)
let ctx: CanvasRenderingContext2D | null = null

function initCanvas() {
  nextTick(() => {
    const canvas = canvasRef.value
    if (!canvas) return
    ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Configurer la résolution Retina
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    clearCanvas()
  })
}

function startDrawing(e: MouseEvent | TouchEvent) {
  isDrawing.value = true
  const pos = getPos(e)
  if (!ctx) return
  ctx.beginPath()
  ctx.moveTo(pos.x, pos.y)
}

function draw(e: MouseEvent | TouchEvent) {
  if (!isDrawing.value || !ctx) return
  e.preventDefault()
  hasDrawn.value = true
  const pos = getPos(e)
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()
}

function stopDrawing() {
  isDrawing.value = false
}

function getPos(e: MouseEvent | TouchEvent) {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  }
}

function clearCanvas() {
  if (!ctx || !canvasRef.value) return
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  hasDrawn.value = false
}

function saveCanvasSignature() {
  if (!canvasRef.value || !hasDrawn.value) return
  const dataUrl = canvasRef.value.toDataURL('image/png')
  emit('save', dataUrl)
  closeModal()
}

// --- MODE 2: IMPORTER UNE IMAGE ---
const uploadedDataUrl = ref<string>('')

function handleFileUpload(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || !input.files[0]) return
  const file = input.files[0]
  if (!file.type.startsWith('image/')) return

  const reader = new FileReader()
  reader.onload = (evt) => {
    if (evt.target?.result) {
      uploadedDataUrl.value = evt.target.result as string
    }
  }
  reader.readAsDataURL(file)
}

function saveUploadedSignature() {
  if (!uploadedDataUrl.value) return
  emit('save', uploadedDataUrl.value)
  closeModal()
}

// --- MODE 3: STYLE CALLIGRAPHIQUE ---
const typedText = ref(props.senderName || '')
const selectedFont = ref<'dancing' | 'caveat' | 'pacifico' | 'greatvibes'>('dancing')

watch(
  () => props.senderName,
  (val) => {
    if (val && !typedText.value) {
      typedText.value = val
    }
  },
)

async function saveTypedSignature() {
  if (!typedText.value.trim()) return

  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch (_) {}
  }

  // Créer un canvas virtuel pour convertir la police calligraphique en image PNG Data URL
  const offscreen = document.createElement('canvas')
  offscreen.width = 600
  offscreen.height = 160
  const oCtx = offscreen.getContext('2d')
  if (!oCtx) return

  const fontFamilies: Record<string, string> = {
    dancing: "'Dancing Script', cursive, sans-serif",
    caveat: "'Caveat', cursive, sans-serif",
    pacifico: "'Pacifico', cursive, sans-serif",
    greatvibes: "'Great Vibes', cursive, sans-serif",
  }

  oCtx.font = `italic 42px ${fontFamilies[selectedFont.value]}`
  oCtx.fillStyle = '#0f172a'
  oCtx.textAlign = 'center'
  oCtx.textBaseline = 'middle'
  oCtx.fillText(typedText.value, offscreen.width / 2, offscreen.height / 2)

  const dataUrl = offscreen.toDataURL('image/png')
  emit('save', dataUrl)
  closeModal()
}

function closeModal() {
  emit('update:open', false)
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && activeTab.value === 'draw') {
      initCanvas()
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div
        class="bg-surface rounded-2xl border border-outline-variant shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <!-- En-tête du modal -->
        <div class="px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-on-surface flex items-center gap-2">
              <LucidePenTool class="w-5 h-5 text-primary" />
              Signature Électronique
            </h3>
            <p class="text-xs text-on-surface-variant mt-0.5">
              Ajoutez une signature manuscrite à votre lettre de motivation
            </p>
          </div>
          <button
            type="button"
            class="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
            @click="closeModal"
          >
            <LucideX class="w-5 h-5" />
          </button>
        </div>

        <!-- Onglets -->
        <div class="flex border-b border-outline-variant/60 bg-surface-container/30 p-1.5 gap-1.5">
          <button
            type="button"
            class="flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5"
            :class="
              activeTab === 'draw'
                ? 'bg-surface text-primary shadow-sm border border-outline-variant/40'
                : 'text-on-surface-variant hover:text-on-surface'
            "
            @click="
              activeTab = 'draw';
              initCanvas()
            "
          >
            <LucideEdit3 class="w-3.5 h-3.5" />
            Dessiner
          </button>
          <button
            type="button"
            class="flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5"
            :class="
              activeTab === 'upload'
                ? 'bg-surface text-primary shadow-sm border border-outline-variant/40'
                : 'text-on-surface-variant hover:text-on-surface'
            "
            @click="activeTab = 'upload'"
          >
            <LucideUploadCloud class="w-3.5 h-3.5" />
            Importer image
          </button>
          <button
            type="button"
            class="flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5"
            :class="
              activeTab === 'type'
                ? 'bg-surface text-primary shadow-sm border border-outline-variant/40'
                : 'text-on-surface-variant hover:text-on-surface'
            "
            @click="activeTab = 'type'"
          >
            <LucideType class="w-3.5 h-3.5" />
            Calligraphie
          </button>
        </div>

        <!-- Contenu des onglets -->
        <div class="p-6 space-y-4">
          <!-- ONGLET 1: DESSINER -->
          <div v-if="activeTab === 'draw'" class="space-y-3">
            <div class="relative bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl overflow-hidden touch-none group">
              <canvas
                ref="canvasRef"
                class="w-full h-44 cursor-crosshair block"
                @mousedown="startDrawing"
                @mousemove="draw"
                @mouseup="stopDrawing"
                @mouseleave="stopDrawing"
                @touchstart="startDrawing"
                @touchmove="draw"
                @touchend="stopDrawing"
              />
              <span v-if="!hasDrawn" class="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
                Dessinez votre signature ici au doigt ou à la souris
              </span>
            </div>
            <div class="flex items-center justify-between">
              <button
                type="button"
                class="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
                @click="clearCanvas"
              >
                <LucideRotateCcw class="w-3.5 h-3.5" />
                Effacer
              </button>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container rounded-lg"
                  @click="closeModal"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  class="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-sm disabled:opacity-50"
                  :disabled="!hasDrawn"
                  @click="saveCanvasSignature"
                >
                  Valider la signature
                </button>
              </div>
            </div>
          </div>

          <!-- ONGLET 2: IMPORTER IMAGE -->
          <div v-else-if="activeTab === 'upload'" class="space-y-4">
            <label
              class="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition-colors p-4"
            >
              <div v-if="!uploadedDataUrl" class="flex flex-col items-center justify-center space-y-2 text-center">
                <LucideImagePlus class="w-8 h-8 text-primary/70" />
                <p class="text-xs font-semibold text-slate-700">Cliquez pour importer votre signature</p>
                <p class="text-[11px] text-slate-500">Formats acceptés: PNG, JPG, WEBP (fond transparent recommandé)</p>
              </div>
              <div v-else class="flex flex-col items-center justify-center space-y-2">
                <img :src="uploadedDataUrl" alt="Signature importée" class="max-h-28 max-w-full object-contain" />
                <span class="text-[11px] text-primary font-medium underline">Changer d'image</span>
              </div>
              <input type="file" accept="image/*" class="hidden" @change="handleFileUpload" />
            </label>

            <div class="flex justify-end gap-2">
              <button
                type="button"
                class="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container rounded-lg"
                @click="closeModal"
              >
                Annuler
              </button>
              <button
                type="button"
                class="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-sm disabled:opacity-50"
                :disabled="!uploadedDataUrl"
                @click="saveUploadedSignature"
              >
                Valider l'image
              </button>
            </div>
          </div>

          <!-- ONGLET 3: CALLIGRAPHIE -->
          <div v-else-if="activeTab === 'type'" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1.5">Nom à signer</label>
              <input
                v-model="typedText"
                type="text"
                placeholder="Ex: Aminata Diallo"
                class="w-full px-3 py-2 text-sm border border-outline rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1.5">Style de calligraphie</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="p-3 border rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1"
                  :class="selectedFont === 'dancing' ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant hover:border-outline'"
                  @click="selectedFont = 'dancing'"
                >
                  <span class="font-bold text-base italic" style="font-family: 'Dancing Script', cursive;">
                    {{ typedText || 'Signature' }}
                  </span>
                  <span class="text-[10px] text-on-surface-variant">Classique</span>
                </button>
                <button
                  type="button"
                  class="p-3 border rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1"
                  :class="selectedFont === 'caveat' ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant hover:border-outline'"
                  @click="selectedFont = 'caveat'"
                >
                  <span class="font-bold text-base italic" style="font-family: 'Caveat', cursive;">
                    {{ typedText || 'Signature' }}
                  </span>
                  <span class="text-[10px] text-on-surface-variant">Fluide</span>
                </button>
                <button
                  type="button"
                  class="p-3 border rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1"
                  :class="selectedFont === 'pacifico' ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant hover:border-outline'"
                  @click="selectedFont = 'pacifico'"
                >
                  <span class="font-bold text-sm italic" style="font-family: 'Pacifico', cursive;">
                    {{ typedText || 'Signature' }}
                  </span>
                  <span class="text-[10px] text-on-surface-variant">Audacieux</span>
                </button>
                <button
                  type="button"
                  class="p-3 border rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1"
                  :class="selectedFont === 'greatvibes' ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant hover:border-outline'"
                  @click="selectedFont = 'greatvibes'"
                >
                  <span class="font-bold text-lg italic" style="font-family: 'Great Vibes', cursive;">
                    {{ typedText || 'Signature' }}
                  </span>
                  <span class="text-[10px] text-on-surface-variant">Élégant</span>
                </button>
              </div>
            </div>

            <div class="flex justify-end gap-2">
              <button
                type="button"
                class="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container rounded-lg"
                @click="closeModal"
              >
                Annuler
              </button>
              <button
                type="button"
                class="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-sm disabled:opacity-50"
                :disabled="!typedText.trim()"
                @click="saveTypedSignature"
              >
                Générer la signature
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style id="google-fonts-signature">
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Dancing+Script:wght@700&family=Great+Vibes&family=Pacifico&display=swap');
</style>
