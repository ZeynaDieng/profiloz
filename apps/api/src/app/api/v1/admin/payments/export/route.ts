import { adminService } from '@/modules/admin/admin.service'
import { handleOptions, problemResponse } from '@/lib/errors'
import { requirePlatformAdmin } from '@/lib/request-context'

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  try {
    await requirePlatformAdmin(request)
    const csv = await adminService.exportPaymentsCsv()
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="profiloz-paiements.csv"',
        ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
      },
    })
  } catch (error) {
    return problemResponse(error as Error)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
