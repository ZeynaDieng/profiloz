import { organizationService } from '@/modules/organization/organization.service'
import { paymentService } from '@/modules/payment/payment.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requireAuth } from '@/lib/request-context'

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const userId = await requireAuth(request)
    await paymentService.assertFeature({ userId }, 'businessOrg')
    const result = await organizationService.getMyOrganization(userId)
    return withCors(jsonResponse(result), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function PATCH(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const userId = await requireAuth(request)
    await paymentService.assertFeature({ userId }, 'businessOrg')
    const organization = await organizationService.updateOrganization(userId, await request.json())
    return withCors(jsonResponse({ organization }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
