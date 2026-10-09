import { expect, test } from '@playwright/test'

// Smoke: the app loads and the login route renders its form.
// Read-only: no credentials are entered or submitted.
test('home loads with hero content', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: /gestiona tus proyectos/i }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: /iniciar sesi.n/i }).first(),
  ).toBeVisible()
})

test('navigating to /login shows the login form', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: /iniciar sesi.n/i }).first().click()

  await expect(page).toHaveURL(/\/login/)
  await expect(
    page.getByRole('heading', { name: /inicia sesi.n en tu cuenta/i }),
  ).toBeVisible()
  await expect(page.getByLabel(/correo electr.nico/i)).toBeVisible()
  await expect(page.getByLabel(/contrase.a/i)).toBeVisible()
  await expect(
    page.getByRole('button', { name: /iniciar sesi.n/i }),
  ).toBeVisible()
})
