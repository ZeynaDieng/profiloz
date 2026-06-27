const DEFAULT_TITLES = new Set(['Mon CV', 'Mon dossier'])

/**
 * Nom affiché d'un dossier.
 * Un titre personnalisé (renommé par l'utilisateur) prime sur le nom du CV.
 * Sinon on retombe sur le nom de la personne, puis le titre, puis un libellé générique.
 */
export function resolveDossierName(opts: { fullName?: string | null; title?: string | null }): string {
  const title = opts.title?.trim()
  if (title && !DEFAULT_TITLES.has(title) && !/^adresse\s*:/i.test(title)) return title

  const name = opts.fullName?.trim()
  if (name && !/^adresse\s*:/i.test(name)) return name

  if (title && !/^adresse\s*:/i.test(title)) return title
  return 'Mon dossier'
}
