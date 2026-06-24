import { expect, test } from '@playwright/test'

test.describe('Landing page', () => {
  test('affiche le titre et les CTA', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('body')).toContainText("Profilo'Z")
    await expect(page.getByRole('link', { name: /créer/i }).first()).toBeVisible()
  })
})

test.describe('Parcours invité', () => {
  test('navigation vers le choix de parcours', async ({ page }) => {
    await page.goto('/creer')
    await expect(page.getByRole('heading', { name: /comment souhaitez-vous commencer/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /créer manuellement/i })).toBeVisible()
  })

  test('wizard informations — première étape', async ({ page }) => {
    await page.goto('/creer/assistant/informations')
    await expect(page.getByRole('heading', { name: /commençons par vos informations/i })).toBeVisible()
  })
})

test.describe('Auth pages', () => {
  test('page connexion accessible', async ({ page }) => {
    await page.goto('/connexion')
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()
  })

  test('page inscription accessible', async ({ page }) => {
    await page.goto('/inscription')
    await expect(page.getByRole('heading', { name: /sécurisez votre cv/i })).toBeVisible()
  })
})
