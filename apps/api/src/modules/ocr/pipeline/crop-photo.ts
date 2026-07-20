import { createCanvas, loadImage } from '@napi-rs/canvas'

/**
 * Découpe la photo de profil du candidat à partir du buffer de l'image du CV
 * en utilisant la bounding box normalisée [ymin, xmin, ymax, xmax] (0 à 1000) renvoyée par Gemini.
 */
export async function cropPhotoFromBuffer(
  buffer: Buffer,
  box: [number, number, number, number],
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

    const cropX = Math.max(0, Math.floor((xmin / 1000) * width))
    const cropY = Math.max(0, Math.floor((ymin / 1000) * height))
    const cropW = Math.min(width - cropX, Math.floor(((xmax - xmin) / 1000) * width))
    const cropH = Math.min(height - cropY, Math.floor(((ymax - ymin) / 1000) * height))

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
