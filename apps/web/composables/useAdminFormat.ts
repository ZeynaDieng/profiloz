export function useAdminFormat() {
  function formatDate(iso: string | null | undefined, withTime = false) {
    if (!iso) return '—'
    const d = new Date(iso)
    return withTime
      ? d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
      : d.toLocaleDateString('fr-FR')
  }

  function formatXof(amount: number) {
    return `${amount.toLocaleString('fr-FR')} FCFA`
  }

  function formatNumber(value: number) {
    return value.toLocaleString('fr-FR')
  }

  function formatMs(ms: number) {
    if (ms < 1000) return `${ms} ms`
    return `${(ms / 1000).toFixed(1)} s`
  }

  return { formatDate, formatXof, formatNumber, formatMs }
}
