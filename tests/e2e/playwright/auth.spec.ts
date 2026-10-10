import { expect, test } from '@playwright/test'

// Auth guard + login form visibility. Read-only: no credentials are
// entered or submitted, no session is created.
test('protected route without token redirects to /login', async ({ page }) => {
  await page.goto('/dashboard')

  await expect(page).toHaveURL(/\/login/)
  await expect(
    page.getByRole('heading', { name: /inicia sesi.n en tu cuenta/i }),
  ).toBeVisible()
})

test('login form shows user/password fields and submit button', async ({
  page,
}) => {
  await page.goto('/login')

  const email = page.getByLabel(/correo electr.nico/i)
  const password = page.getByLabel(/contrase.a/i)
  const submit = page.getByRole('button', { name: /iniciar sesi.n/i })

  await expect(email).toBeVisible()
  await expect(password).toBeVisible()
  await expect(submit).toBeVisible()
  await expect(submit).toBeEnabled()
  // Intentionally no fill/submit: E2E stays read-only without a test
  // environment (no accounts, no credentials in the repo).
})
