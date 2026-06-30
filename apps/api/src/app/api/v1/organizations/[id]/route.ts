import { organizationService } from '@/modules/organization/organization.service'
import { paymentService } from '@/modules/payment/payment.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requireAuth } from '@/lib/request-context'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    const userId = await requireAuth(request)
    await paymentService.assertFeature({ userId }, 'businessOrg')
    const { id } = await params
    const result = await organizationService.getMyOrganization(userId)
    if (result.organization.id !== id) {
      throw new Error('Organisation introuvable')
    }
    return withCors(jsonResponse(result), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
