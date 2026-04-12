import { expect, test } from '@playwright/test'

test('ribbon demo page loads', async ({ page }) => {
  await page.goto('http://localhost:4173')
  await expect(page.getByText('Home')).toBeVisible()
})
