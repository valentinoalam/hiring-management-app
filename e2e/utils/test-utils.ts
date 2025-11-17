import { Page } from '@playwright/test';

export class SignInPageUtils {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/sign-in');
  }

  async fillEmail(email: string) {
    await this.page.getByLabel(/Alamat email/i).fill(email);
  }

  async fillPassword(password: string) {
    await this.page.getByLabel(/Password/i).fill(password);
  }

  async submitMagicLink() {
    await this.page.getByRole('button', { name: /Kirim link ajaib/i }).click();
  }

  async submitPasswordLogin() {
    await this.page.getByRole('button', { name: /Masuk/i }).click();
  }

  async switchToPasswordLogin() {
    await this.page.getByRole('button', { name: /Masuk dengan Password/i }).click();
  }

  async switchBackToMagicLink() {
    await this.page.getByRole('button', { name: /Kembali/i }).click();
  }

  async loginWithPassword(email: string, password: string) {
    await this.fillEmail(email);
    await this.switchToPasswordLogin();
    await this.fillPassword(password);
    await this.submitPasswordLogin();
  }

  async getErrorMessage() {
    return this.page.getByRole('alert').textContent();
  }

  async isMagicLinkSuccessVisible() {
    return this.page.getByText(/Link telah dikirim/i).isVisible();
  }
}