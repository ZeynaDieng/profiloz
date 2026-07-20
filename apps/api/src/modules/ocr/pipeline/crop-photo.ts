import { createCanvas, loadImage } from '@napi-rs/canvas'

/**
 * Découpe la photo de profil du candidat à partir du buffer de l'image du CV
 * en utilisant la bounding box normalisée [ymin, xmin, ymax, xmax] (0 à 1000) renvoyée par Gemini.
 * Applique un inset automatique pour supprimer les contours, anneaux et cadres décoratifs du CV d'origine.
 */
export async function cropPhotoFromBuffer(
  buffer: Buffer,
  box: [number, number, number, number],
  insetPercentage: number = 0.06,
): Promise<string | null> {
  try {
    if (!Array.isArray(box) || box.length !== 4) return null
    const [ymin, xmin, ymax, xmax] = box
    if (typeof ymin !== 'number' || typeof xmin !== 'number' || typeof ymax !== 'number' || typeof xmax !== 'number') {
      return null
    }
    if (ymin >= ymax || xmin >= xmax) return null

    const img = await loadImage(buffer)
    const width = img.width
    const height = img.height

    // Marge de sécurité (inset) pour éliminer les contours, anneaux circulaires et cadres décoratifs
    const boxW = xmax - xmin
    const boxH = ymax - ymin
    const insetX = boxW * insetPercentage
    const insetY = boxH * insetPercentage

    const adjYmin = ymin + insetY
    const adjYmax = ymax - insetY
    const adjXmin = xmin + insetX
    const adjXmax = xmax - insetX

    const cropX = Math.max(0, Math.floor((adjXmin / 1000) * width))
    const cropY = Math.max(0, Math.floor((adjYmin / 1000) * height))
    const cropW = Math.min(width - cropX, Math.floor(((adjXmax - adjXmin) / 1000) * width))
    const cropH = Math.min(height - cropY, Math.floor(((adjYmax - adjYmin) / 1000) * height))

    if (cropW <= 25 || cropH <= 25) return null

    const canvas = createCanvas(cropW, cropH)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

    const croppedBuffer = canvas.toBuffer('image/png')
    return `data:image/png;base64,${croppedBuffer.toString('base64')}`
  } catch (err) {
    console.warn('Failed to crop candidate photo:', err)
    return null
  }
}

/**
 * Redimensionne et compresse une image lourde avant de l'envoyer à Gemini API
 * pour diviser le temps de transfert réseau par 10 (passant de 10MB à 300KB).
 */
export async function compressImageForAi(
  buffer: Buffer,
  maxDimension = 1600,
): Promise<{ buffer: Buffer; mimeType: string }> {
  try {
    const img = await loadImage(buffer)
    const { width, height } = img

    if (width <= maxDimension && height <= maxDimension) {
      return { buffer, mimeType: 'image/jpeg' }
    }

    const scale = Math.min(maxDimension / width, maxDimension / height)
    const targetW = Math.round(width * scale)
    const targetH = Math.round(height * scale)

    const canvas = createCanvas(targetW, targetH)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, targetW, targetH)

    const compressed = canvas.toBuffer('image/jpeg')
    return { buffer: compressed, mimeType: 'image/jpeg' }
  } catch {
    return { buffer, mimeType: 'image/jpeg' }
  }
}
