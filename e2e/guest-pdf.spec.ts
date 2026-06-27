import { expect, test } from '@playwright/test'

const API_BASE = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001/api/v1'

const MINIMAL_SNAPSHOT = {
  snapshot: {
    id: 'e2e-test',
    title: 'CV E2E',
    templateSlug: 'PROFESSIONNEL',
    templateConfig: { accentColor: '#0051d5' },
    personalInfo: {
      fullName: 'Test E2E',
      email: 'e2e@profiloz.test',
      jobTitle: 'Développeur',
    },
    summary: 'Parcours E2E ProfiloZ.',
    experiences: [
      {
        company: "Profilo'Z",
        position: 'QA',
        startDate: '2024',
        endDate: '',
        isCurrent: true,
        description: 'Validation parcours guest PDF.',
      },
    ],
    educations: [],
    skills: [{ name: 'Playwright' }],
    certifications: [],
    interests: [],
    languages: [],
    metadata: {
      completeness: 80,
      lastModified: '2026-01-01T00:00:00.000Z',
      source: 'wizard',
    },
  },
}

test.describe('Parcours invité — PDF', () => {
  test('génère et télécharge un PDF via l’API', async ({ request }) => {
    test.setTimeout(120_000)

    const sessionResponse = await request.post(`${API_BASE}/guest/session`, { data: {} })
    expect(sessionResponse.ok()).toBeTruthy()
    const { sessionId } = await sessionResponse.json()
    expect(sessionId).toBeTruthy()

    const generateResponse = await request.post(`${API_BASE}/pdf/generate-from-snapshot`, {
      headers: { 'X-Guest-Session-Id': sessionId },
      data: MINIMAL_SNAPSHOT,
    })
    expect(generateResponse.ok()).toBeTruthy()

    const payload = await generateResponse.json()
    expect(payload.jobId).toBeTruthy()
    expect(payload.downloadUrl).toMatch(/^\/pdf\/download\//)

    const downloadResponse = await request.get(`${API_BASE}${payload.downloadUrl}`, {
      headers: { 'X-Guest-Session-Id': sessionId },
    })
    expect(downloadResponse.ok()).toBeTruthy()

    const buffer = await downloadResponse.body()
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF')
    expect(buffer.length).toBeGreaterThan(1000)
  })
})

test.describe('Landing MVP', () => {
  test('affiche les sections clés', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /comment ça marche/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /modèles pour votre candidature/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /cv \+ lettre de motivation/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /simple, fiable, sans engagement/i })).toBeVisible()
  })
})
