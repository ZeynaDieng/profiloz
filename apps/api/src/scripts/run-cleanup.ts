import { cleanupService, type CleanupJobName } from '../modules/cleanup/cleanup.service'

function parseJobsFromArgv(argv: string[]): CleanupJobName[] {
  const jobsFlag = argv.find((arg) => arg.startsWith('--jobs='))
  if (!jobsFlag) return ['pdf', 'guest', 'orphan']

  const jobs = jobsFlag
    .slice('--jobs='.length)
    .split(',')
    .map((job) => job.trim())
    .filter(Boolean) as CleanupJobName[]

  return jobs.length ? jobs : ['pdf', 'guest', 'orphan']
}

async function main() {
  const jobs = parseJobsFromArgv(process.argv.slice(2))
  const stats = await cleanupService.runCleanupJobs(jobs)
  console.log(JSON.stringify({ ok: true, jobs, stats }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
