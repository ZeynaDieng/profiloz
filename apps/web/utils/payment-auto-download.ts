import { isGuestPdfReturnPath } from '~/utils/payment-return'

export function withAutoDownloadQuery(path: string): string {
  if (!isGuestPdfReturnPath(path)) return path
  const [pathname, search = ''] = path.split('?')
  const params = new URLSearchParams(search)
  params.set('download', '1')
  const query = params.toString()
  return query ? `${pathname}?${query}` : `${pathname}?download=1`
}
