import { expect, test } from '@playwright/test'

test('API health endpoint responds', async ({ request }) => {
  const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001/api/v1'
  const response = await request.get(`${apiBase}/health`)
  expect(response.ok()).toBeTruthy()
  const body = await response.json()
  expect(body.status).toBe('ok')
})

test('API templates endpoint responds', async ({ request }) => {
  const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001/api/v1'
  const response = await request.get(`${apiBase}/templates`)
  expect(response.ok()).toBeTruthy()
  const body = await response.json()
  expect(body.data?.length).toBeGreaterThan(0)
})
