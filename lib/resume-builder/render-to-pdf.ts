import { chromium } from 'playwright';

type PdfOptions = {
  pageSize: 'A4' | 'Letter';
  margins: { top: string; right: string; bottom: string; left: string };
};

const TIMEOUT_MS = 30_000;

export class PdfGenerationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'PdfGenerationError';
  }
}

/**
 * Renders an HTML string to a PDF buffer using Playwright's Chromium.
 * Launches a browser, sets the HTML content, and generates a PDF.
 */
export async function htmlToPdf(html: string, options: PdfOptions): Promise<Buffer> {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    throw new PdfGenerationError(
      'Failed to launch browser — Chromium may not be installed. Run "npx playwright install chromium".',
      err
    );
  }

  try {
    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'networkidle', timeout: TIMEOUT_MS });
    } catch (err) {
      throw new PdfGenerationError('Timed out loading resume HTML content', err);
    }

    try {
      const pdfBuffer = await page.pdf({
        format: options.pageSize,
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
        printBackground: true,
      });
      return pdfBuffer;
    } catch (err) {
      throw new PdfGenerationError('Failed to render PDF from HTML', err);
    }
  } finally {
    await browser.close();
  }
}
