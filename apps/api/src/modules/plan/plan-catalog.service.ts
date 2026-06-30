import {
  resolvePlanCatalog,
  resolvePlanFromCatalog,
  type Plan,
  type PlanOverride,
} from '@profiloz/shared'
import { getPlatformSetting } from '@/modules/admin/platform-settings.repository'

export async function getPlanOverrides(): Promise<Record<string, PlanOverride>> {
  return (await getPlatformSetting<Record<string, PlanOverride>>('plan_overrides')) ?? {}
}

export async function listPublicPlans(): Promise<Plan[]> {
  const overrides = await getPlanOverrides()
  return resolvePlanCatalog(overrides)
    .filter((plan) => plan.active)
    .map(({ active: _active, ...plan }) => plan)
}

export async function getResolvedPlan(slug: string) {
  const overrides = await getPlanOverrides()
  const plan = resolvePlanFromCatalog(slug, overrides)
  if (!plan || !plan.active) return null
  return plan
}

export async function listAdminPlans() {
  const overrides = await getPlanOverrides()
  return resolvePlanCatalog(overrides).map((plan) => ({
    ...plan,
    credits: Number.isFinite(plan.credits) ? plan.credits : null,
    editable: true,
  }))
}

export async function savePlanOverride(slug: string, patch: PlanOverride) {
  const overrides = await getPlanOverrides()
  overrides[slug] = { ...(overrides[slug] ?? {}), ...patch }
  const { upsertPlatformSetting } = await import('@/modules/admin/platform-settings.repository')
  await upsertPlatformSetting('plan_overrides', overrides)
  return resolvePlanFromCatalog(slug, overrides)
}
