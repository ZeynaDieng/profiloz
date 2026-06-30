import { organizationService } from '@/modules/organization/organization.service'
import { paymentService } from '@/modules/payment/payment.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requireAuth } from '@/lib/request-context'

type Params = { params: Promise<{ id: string; userId: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    const actorUserId = await requireAuth(request)
    await paymentService.assertFeature({ userId: actorUserId }, 'multiCollaborators')
    const { id, userId: targetUserId } = await params
    const membership = await organizationService.getMyOrganization(actorUserId)
    if (membership.organization.id !== id) {
      throw new Error('Organisation introuvable')
    }
    const member = await organizationService.updateMemberRole(
      actorUserId,
      targetUserId,
      await request.json(),
    )
    return withCors(jsonResponse({ member }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    const actorUserId = await requireAuth(request)
    await paymentService.assertFeature({ userId: actorUserId }, 'multiCollaborators')
    const { id, userId: targetUserId } = await params
    const membership = await organizationService.getMyOrganization(actorUserId)
    if (membership.organization.id !== id) {
      throw new Error('Organisation introuvable')
    }
    await organizationService.removeMember(actorUserId, targetUserId)
    return withCors(jsonResponse({ ok: true }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
