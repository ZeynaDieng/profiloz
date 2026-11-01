/**
 * Noms des icônes Material Symbols utilisées dans le code, lus au moment du build.
 * Google Fonts ne sert alors que ces icônes (~10 Ko au lieu de ~1,1 Mo pour la police complète).
 * Les noms inconnus de Google sont ignorés : mieux vaut un nom de trop qu'une icône manquante.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Le package partagé définit aussi des icônes (menu de l'administration, offres…)
const SCANNED_DIRS = ['app', 'components', 'composables', 'features', 'layouts', 'pages', 'utils', '../../packages/shared/src']
const SCANNED_FILES = ['app.vue', 'app.config.ts']

const ICON_NAME = /^[a-z][a-z0-9_]*$/
const LITERAL = /'([a-z][a-z0-9_]*)'/g

function listSourceFiles(dir: string): string[] {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }
  return entries.flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return listSourceFiles(path)
    return /\.(vue|ts)$/.test(entry.name) ? [path] : []
  })
}

function collectFromSource(source: string, names: Set<string>) {
  const addLiterals = (text: string) => {
    for (const [, name] of text.matchAll(LITERAL)) names.add(name!)
  }

  // <UiPzIcon name="mail" /> et <UiPzIcon :name="ok ? 'check' : 'close'" />
  for (const match of source.matchAll(/<[\w-]*PzIcon\b[^>]*?(:?)name="([^"]*)"/g)) {
    if (match[1]) addLiterals(match[2]!)
    else if (ICON_NAME.test(match[2]!)) names.add(match[2]!)
  }
  // Données passées aux composants : icon: 'mail', icon="mail", :icon="a ? 'x' : 'y'"
  for (const match of source.matchAll(/\b\w*[iI]con\w*\s*[:=]\s*(?:"([^"]*)"|([^,\n}]*))/g)) {
    const value = match[1] ?? match[2] ?? ''
    if (ICON_NAME.test(value)) names.add(value)
    addLiterals(value)
  }
  // <span class="material-symbols-outlined">mail</span>
  for (const match of source.matchAll(/material-symbols-outlined[^>]*>\s*([a-z][a-z0-9_]*)\s*</g)) {
    names.add(match[1]!)
  }
}

export function collectMaterialIconNames(rootDir: string): string[] {
  const names = new Set<string>()
  const files = [
    ...SCANNED_DIRS.flatMap((dir) => listSourceFiles(join(rootDir, dir))),
    ...SCANNED_FILES.map((file) => join(rootDir, file)),
  ]
  for (const file of files) {
    try {
      collectFromSource(readFileSync(file, 'utf8'), names)
    } catch {
      // fichier absent : rien à lire
    }
  }
  // Google exige l'ordre alphabétique
  return [...names].sort()
}
