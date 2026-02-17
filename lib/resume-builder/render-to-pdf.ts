import { chromium } from 'playwright';

type PdfOptions = {
  pageSize: 'A4' | 'Letter';
  margins: { top: string; right: string; bottom: string; left: string };
};

const TIMEOUT_MS = 30_000;

/**
 * Renders an HTML string to a PDF buffer using Playwright's Chromium.
 * Launches a browser, sets the HTML content, and generates a PDF.
 */
export async function htmlToPdf(html: string, options: PdfOptions): Promise<Buffer> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle', timeout: TIMEOUT_MS });

    const pdfBuffer = await page.pdf({
      format: options.pageSize,
      margin: {
        top: options.margins.top,
        right: options.margins.right,
        bottom: options.margins.bottom,
        left: options.margins.left,
      },
      printBackground: true,
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}
