// tests/utils/file-upload.ts
import { Page } from '@playwright/test';

export async function uploadResume(page: Page, filePath: string = './tests/fixtures/sample-resume.pdf') {
  const resumeInput = page.locator('input[id="resume"]');
  await resumeInput.setInputFiles(filePath);
}

export async function uploadCoverLetter(page: Page, filePath: string = './tests/fixtures/cover-letter.pdf') {
  const coverLetterInput = page.locator('input[id="coverLetterFile"]');
  await coverLetterInput.setInputFiles(filePath);
}

export async function validateFileUpload(page: Page, fileName: string) {
  await expect(page.locator(`text=${fileName}`)).toBeVisible();
}

export async function removeUploadedFile(page: Page, fileName: string) {
  await page.locator(`button:has-text("${fileName}") + button`).click();
  await expect(page.locator(`text=${fileName}`)).not.toBeVisible();
}