import * as puppeteer from 'puppeteer';
import { generateOrderSlipHTML } from './pdf-generator';
import type { Order, OrderItem, Product, User } from '@shared/schema';

interface OrderForPDF extends Order {
  items: (OrderItem & { product: Product })[];
  user?: User;
}

export class PDFService {
  private static browser: any = null;

  static async getBrowser(): Promise<any> {
    if (!this.browser || !this.browser.connected) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process', // Required for some cloud environments
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      });
    }
    return this.browser;
  }

  static async generateOrderPDF(order: OrderForPDF, isAdmin = false): Promise<Buffer> {
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      // Set page size to A4
      await page.setViewport({ width: 794, height: 1123 });

      // Disable JavaScript for security (prevent script execution in headless browser)
      await page.setJavaScriptEnabled(false);

      // Generate HTML content
      const htmlContent = generateOrderSlipHTML(order, isAdmin);

      // Set the HTML content
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px'
        },
        displayHeaderFooter: false,
        preferCSSPageSize: true
      });

      await page.close();
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  static async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  await PDFService.closeBrowser();
});

process.on('SIGINT', async () => {
  await PDFService.closeBrowser();
});