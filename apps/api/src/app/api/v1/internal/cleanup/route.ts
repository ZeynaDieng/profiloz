import { AppError, handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import {
  cleanupService,
  type CleanupJobName,
} from '@/modules/cleanup/cleanup.service'

const VALID_JOBS: CleanupJobName[] = ['pdf', 'guest', 'orphan']

function assertCronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    throw new AppError(
      503,
      'Service Unavailable',
      'CRON_SECRET non configuré. Définissez la variable d’environnement pour activer le nettoyage.',
    )
  }

  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const headerSecret = request.headers.get('x-cron-secret')
  const provided = bearer ?? headerSecret

  if (!provided || provided !== secret) {
    throw new AppError(401, 'Unauthorized', 'Accès cron refusé')
  }
}

function parseJobs(request: Request): CleanupJobName[] {
  const url = new URL(request.url)
  const jobsParam = url.searchParams.get('jobs')
  if (!jobsParam) return VALID_JOBS

  const jobs = jobsParam
    .split(',')
    .map((job) => job.trim())
    .filter(Boolean) as CleanupJobName[]

  const invalid = jobs.filter((job) => !VALID_JOBS.includes(job))
  if (invalid.length) {
    throw new AppError(
      422,
      'Validation Error',
      `Jobs invalides: ${invalid.join(', ')}. Valeurs acceptées: ${VALID_JOBS.join(', ')}`,
    )
  }

  return jobs.length ? jobs : VALID_JOBS
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    assertCronAuthorized(request)
    const jobs = parseJobs(request)
    const stats = await cleanupService.runCleanupJobs(jobs)
    const response = jsonResponse({
      ok: true,
      ranAt: new Date().toISOString(),
      jobs,
      stats,
    })
    return withCors(response, origin)
  } catch (error) {
    const response = problemResponse(error as Error)
    return withCors(response, origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
