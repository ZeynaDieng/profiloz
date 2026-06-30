import { organizationService } from '@/modules/organization/organization.service'
import { paymentService } from '@/modules/payment/payment.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requireAuth } from '@/lib/request-context'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    const userId = await requireAuth(request)
    await paymentService.assertFeature({ userId }, 'multiCollaborators')
    const { id } = await params
    const membership = await organizationService.getMyOrganization(userId)
    if (membership.organization.id !== id) {
      throw new Error('Organisation introuvable')
    }
    const member = await organizationService.inviteMember(userId, await request.json())
    return withCors(jsonResponse({ member }, 201), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
