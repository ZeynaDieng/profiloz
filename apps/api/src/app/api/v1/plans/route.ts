import { listPublicPlans } from '@/modules/plan/plan-catalog.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const plans = await listPublicPlans()
    const data = plans.map((plan) => ({
      ...plan,
      credits: Number.isFinite(plan.credits) ? plan.credits : null,
    }))
    return withCors(jsonResponse({ data }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
