/**
 * Prétraitement local des images avant OCR Tesseract.
 * Cible : scans faible contraste, photos mobile inclinées, résolution basse.
 */

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function toGrayscale(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!
    const g = data[i + 1]!
    const b = data[i + 2]!
    const gray = clampByte(0.299 * r + 0.587 * g + 0.114 * b)
    data[i] = gray
    data[i + 1] = gray
    data[i + 2] = gray
  }
}

function stretchContrast(data: Uint8ClampedArray, clipPercent = 0.02): void {
  const values: number[] = []
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3]! < 16) continue
    values.push(data[i]!)
  }
  if (values.length < 64) return

  values.sort((a, b) => a - b)
  const lo = values[Math.floor(values.length * clipPercent)] ?? 0
  const hi = values[Math.floor(values.length * (1 - clipPercent))] ?? 255
  if (hi <= lo + 8) return

  const scale = 255 / (hi - lo)
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3]! < 16) continue
    const v = clampByte((data[i]! - lo) * scale)
    data[i] = v
    data[i + 1] = v
    data[i + 2] = v
  }
}

/** Seuillage d'Otsu : binarisation adaptative pour scans grisâtres. */
function otsuBinarize(data: Uint8ClampedArray): void {
  const hist = new Array<number>(256).fill(0)
  let total = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3]! < 16) continue
    hist[data[i]!]!++
    total++
  }
  if (total < 256) return

  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * hist[i]!

  let sumB = 0
  let wB = 0
  let maxVar = 0
  let threshold = 128

  for (let t = 0; t < 256; t++) {
    wB += hist[t]!
    if (wB === 0) continue
    const wF = total - wB
    if (wF === 0) break

    sumB += t * hist[t]!
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    const varBetween = wB * wF * (mB - mF) ** 2
    if (varBetween > maxVar) {
      maxVar = varBetween
      threshold = t
    }
  }

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3]! < 16) continue
    const v = data[i]! >= threshold ? 255 : 0
    data[i] = v
    data[i + 1] = v
    data[i + 2] = v
  }
}

function sharpen(data: Uint8ClampedArray, width: number, height: number): void {
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]
  const copy = new Uint8ClampedArray(data)

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4
      if (copy[idx + 3]! < 16) continue

      let sum = 0
      let ki = 0
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pi = ((y + ky) * width + (x + kx)) * 4
          sum += copy[pi]! * kernel[ki]!
          ki++
        }
      }
      data[idx] = clampByte(sum)
      data[idx + 1] = data[idx]
      data[idx + 2] = data[idx]
    }
  }
}

function denoise(data: Uint8ClampedArray, width: number, height: number): void {
  const copy = new Uint8ClampedArray(data)

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4
      if (copy[idx + 3]! < 16) continue

      const neighbors: number[] = []
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pi = ((y + ky) * width + (x + kx)) * 4
          neighbors.push(copy[pi]!)
        }
      }
      neighbors.sort((a, b) => a - b)
      const median = neighbors[4]!
      const current = copy[idx]!
      if (Math.abs(current - median) > 48) {
        data[idx] = median
        data[idx + 1] = median
        data[idx + 2] = median
      }
    }
  }
}

/**
 * Prépare une image pour Tesseract : upscale si petite, gris, contraste, binarisation Otsu.
 */
export async function preprocessImageForOcr(buffer: Buffer): Promise<Buffer> {
  try {
    const { loadImage, createCanvas } = await import('@napi-rs/canvas')
    const image = await loadImage(buffer)
    const minTarget = 2200
    const maxSide = 3200
    const shortSide = Math.min(image.width, image.height)
    const upscale = shortSide < minTarget ? minTarget / shortSide : 1
    const scale = Math.min(upscale, maxSide / Math.max(image.width, image.height))
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(image, 0, 0, width, height)

    const imageData = ctx.getImageData(0, 0, width, height)
    toGrayscale(imageData.data)
    stretchContrast(imageData.data, 0.015)
    denoise(imageData.data, width, height)
    otsuBinarize(imageData.data)
    sharpen(imageData.data, width, height)
    ctx.putImageData(imageData, 0, 0)

    return canvas.toBuffer('image/png')
  } catch {
    return buffer
  }
}
