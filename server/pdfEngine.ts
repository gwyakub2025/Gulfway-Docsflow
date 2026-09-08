import { PDFDocument, rgb, StandardFonts, PDFPage, degrees } from 'pdf-lib';
import crypto from 'crypto';
import { FormField, FormTemplate, DocumentRecord, Company } from '../src/types/index.js';
import { QrGenerator } from './qrGenerator.js';

export interface GeneratePdfOptions {
  template: FormTemplate;
  document: Partial<DocumentRecord>;
  company: Company;
  appUrl?: string;
  isDraftPreview?: boolean;
}

export class PdfGenerationEngine {
  /**
   * Generates a complete PDF with placed fields, document header, barcode/QR code,
   * stamps, signatures, and computes SHA-256.
   */
  public static async generateDocumentPdf(options: GeneratePdfOptions): Promise<{
    pdfBytes: Uint8Array;
    pdfBase64: string;
    sha256Hash: string;
  }> {
    const { template, document, company, isDraftPreview } = options;
    let pdfDoc: PDFDocument;

    // Load existing base template if provided, otherwise construct clean professional template
    if (template.pdfTemplateUrl && template.pdfTemplateUrl.startsWith('data:application/pdf;base64,')) {
      try {
        const base64Data = template.pdfTemplateUrl.replace('data:application/pdf;base64,', '');
        pdfDoc = await PDFDocument.load(Buffer.from(base64Data, 'base64'));
      } catch {
        pdfDoc = await this.createStandardBaseTemplate(template, company);
      }
    } else {
      pdfDoc = await this.createStandardBaseTemplate(template, company);
    }

    const pages = pdfDoc.getPages();
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const docNumber = document.documentNumber || (isDraftPreview ? 'DRAFT-PREVIEW-NOT-OFFICIAL' : 'PENDING-NUMBER');
    const verificationToken = document.secureVerificationToken || 'TOKEN_PENDING';
    const appBaseUrl = options.appUrl || process.env.APP_URL || 'http://localhost:3000';
    const verificationUrl = QrGenerator.buildVerificationUrl({
      token: verificationToken,
      documentNumber: docNumber,
      baseUrl: appBaseUrl,
    });

    // Generate secure verification QR Code image using server-side utility
    let qrImageEmbed = null;
    try {
      const qrBuffer = await QrGenerator.generatePngBuffer(verificationUrl, {
        width: 180,
        margin: 1,
        errorCorrectionLevel: 'M',
        darkColor: '#0a192f',
      });
      qrImageEmbed = await pdfDoc.embedPng(qrBuffer);
    } catch {
      // ignore qr generation error if any
    }

    // Embed company stamp if present
    let stampImageEmbed = null;
    if (company.stampUrl && company.stampUrl.startsWith('data:image/png;base64,')) {
      try {
        const stampBuffer = Buffer.from(company.stampUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
        stampImageEmbed = await pdfDoc.embedPng(stampBuffer);
      } catch {
        // ignore
      }
    }

    // Embed signatures if present
    const signatureEmbeds: Record<string, any> = {};
    if (document.signatures && document.signatures.length > 0) {
      for (const sig of document.signatures) {
        if (sig.signatureDataUrl && sig.signatureDataUrl.startsWith('data:image/png;base64,')) {
          try {
            const sigBuf = Buffer.from(sig.signatureDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
            signatureEmbeds[sig.fieldId] = await pdfDoc.embedPng(sigBuf);
          } catch {
            // ignore
          }
        }
      }
    }

    // Map each field to its coordinates
    for (const field of template.fields) {
      const targetPageNumber = Math.min(Math.max(1, field.pageNumber || 1), pages.length);
      const page = pages[targetPageNumber - 1];
      const { width: pageWidth, height: pageHeight } = page.getSize();

      // Convert percentage coordinates to points
      // Note: in PDF coordinates (0, 0) is bottom-left, so top-down coordinate y must be flipped
      const fieldWidth = (field.width / 100) * pageWidth;
      const fieldHeight = (field.height / 100) * pageHeight;
      const xPos = (field.x / 100) * pageWidth;
      const yPos = pageHeight - ((field.y / 100) * pageHeight) - fieldHeight;

      const val = document.values ? document.values[field.name] : undefined;

      switch (field.type) {
        case 'document_number': {
          page.drawRectangle({
            x: xPos,
            y: yPos,
            width: Math.max(fieldWidth, 140),
            height: Math.max(fieldHeight, 22),
            color: rgb(0.95, 0.96, 0.98),
            borderColor: rgb(0.2, 0.35, 0.6),
            borderWidth: 1,
          });
          page.drawText(docNumber, {
            x: xPos + 6,
            y: yPos + 6,
            size: field.fontSize || 10,
            font: fontBold,
            color: rgb(0.1, 0.2, 0.45),
          });
          break;
        }

        case 'qr_code': {
          if (qrImageEmbed) {
            page.drawImage(qrImageEmbed, {
              x: xPos,
              y: yPos,
              width: Math.max(fieldWidth, 50),
              height: Math.max(fieldHeight, 50),
            });
          }
          break;
        }

        case 'company_stamp': {
          if (stampImageEmbed) {
            page.drawImage(stampImageEmbed, {
              x: xPos,
              y: yPos,
              width: Math.max(fieldWidth, 60),
              height: Math.max(fieldHeight, 60),
            });
          } else {
            // Draw simulated digital company seal
            page.drawEllipse({
              x: xPos + fieldWidth / 2,
              y: yPos + fieldHeight / 2,
              xScale: fieldWidth / 2,
              yScale: fieldHeight / 2,
              borderColor: rgb(0.1, 0.45, 0.2),
              borderWidth: 1.5,
            });
            page.drawText(company.code, {
              x: xPos + 10,
              y: yPos + fieldHeight / 2 - 4,
              size: 8,
              font: fontBold,
              color: rgb(0.1, 0.45, 0.2),
            });
          }
          break;
        }

        case 'signature': {
          const sigImg = signatureEmbeds[field.id];
          if (sigImg) {
            page.drawImage(sigImg, {
              x: xPos,
              y: yPos,
              width: Math.max(fieldWidth, 90),
              height: Math.max(fieldHeight, 35),
            });
          } else {
            // Draw signature placeholder line
            page.drawLine({
              start: { x: xPos, y: yPos + 5 },
              end: { x: xPos + fieldWidth, y: yPos + 5 },
              thickness: 1,
              color: rgb(0.6, 0.65, 0.7),
            });
            page.drawText(`${field.label} (Sign Here)`, {
              x: xPos,
              y: yPos - 8,
              size: 7,
              font: fontRegular,
              color: rgb(0.4, 0.45, 0.5),
            });
          }
          break;
        }

        case 'generated_date': {
          const dateStr = document.createdAt
            ? new Date(document.createdAt).toLocaleDateString('en-GB')
            : new Date().toLocaleDateString('en-GB');
          page.drawText(dateStr, {
            x: xPos,
            y: yPos + 2,
            size: field.fontSize || 9,
            font: fontRegular,
            color: rgb(0.1, 0.1, 0.1),
          });
          break;
        }

        case 'generated_by': {
          const byStr = document.createdByName || 'Authorized User';
          page.drawText(byStr, {
            x: xPos,
            y: yPos + 2,
            size: field.fontSize || 9,
            font: fontRegular,
            color: rgb(0.1, 0.1, 0.1),
          });
          break;
        }

        case 'checkbox': {
          const isChecked = val === true || val === 'true' || val === '1';
          page.drawRectangle({
            x: xPos,
            y: yPos,
            width: 12,
            height: 12,
            borderColor: rgb(0.2, 0.2, 0.2),
            borderWidth: 1,
          });
          if (isChecked) {
            page.drawText('X', {
              x: xPos + 2,
              y: yPos + 2,
              size: 9,
              font: fontBold,
              color: rgb(0, 0, 0),
            });
          }
          break;
        }

        default: {
          // Standard text, number, date, dropdown, etc.
          const textVal = val !== undefined && val !== null ? String(val) : (field.defaultValue || '');
          if (textVal) {
            page.drawText(textVal, {
              x: xPos,
              y: yPos + 2,
              size: field.fontSize || 10,
              font: field.fontStyle === 'bold' ? fontBold : fontRegular,
              color: rgb(0.1, 0.1, 0.1),
              maxWidth: fieldWidth,
            });
          }
          break;
        }
      }
    }

    // Add security header / footer banner to every page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width: pW, height: pH } = page.getSize();

      // Top security strip
      page.drawRectangle({
        x: 0,
        y: pH - 18,
        width: pW,
        height: 18,
        color: rgb(0.08, 0.18, 0.36),
      });
      page.drawText(`GULF WAY DOCFLOW | ${company.name.toUpperCase()} | DOC: ${docNumber}`, {
        x: 20,
        y: pH - 12,
        size: 7,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
      page.drawText(`PAGE ${i + 1} OF ${pages.length}`, {
        x: pW - 90,
        y: pH - 12,
        size: 7,
        font: fontRegular,
        color: rgb(0.9, 0.9, 0.9),
      });

      // Bottom security watermark footer
      page.drawLine({
        start: { x: 20, y: 22 },
        end: { x: pW - 20, y: 22 },
        thickness: 0.5,
        color: rgb(0.7, 0.75, 0.8),
      });
      page.drawText(
        `Official Electronically Numbered Document | Verification: ${verificationUrl}`,
        {
          x: 20,
          y: 12,
          size: 6.5,
          font: fontRegular,
          color: rgb(0.4, 0.45, 0.5),
        }
      );
    }

    // If draft preview, place subtle diagonal draft watermark
    if (isDraftPreview) {
      for (const page of pages) {
        const { width: pW, height: pH } = page.getSize();
        page.drawText('DRAFT - NOT AN OFFICIAL RECORD', {
          x: pW / 4,
          y: pH / 2,
          size: 26,
          font: fontBold,
          color: rgb(0.85, 0.85, 0.88),
          rotate: degrees(35),
        });
      }
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    const sha256Hash = crypto.createHash('sha256').update(pdfBytes).digest('hex');

    return {
      pdfBytes,
      pdfBase64: `data:application/pdf;base64,${pdfBase64}`,
      sha256Hash,
    };
  }

  /**
   * Helper to construct a beautifully formatted base PDF for any form template
   * with company header, titles, form code, borders and section divisions.
   */
  private static async createStandardBaseTemplate(
    template: FormTemplate,
    company: Company
  ): Promise<PDFDocument> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const { width, height } = page.getSize();

    // Outer margin border
    page.drawRectangle({
      x: 20,
      y: 28,
      width: width - 40,
      height: height - 56,
      borderColor: rgb(0.82, 0.85, 0.88),
      borderWidth: 1,
    });

    // Company Header Box
    page.drawRectangle({
      x: 30,
      y: height - 110,
      width: width - 60,
      height: 70,
      color: rgb(0.97, 0.98, 0.99),
      borderColor: rgb(0.85, 0.88, 0.92),
      borderWidth: 1,
    });

    // Company Title & Info
    page.drawText(company.name.toUpperCase(), {
      x: 45,
      y: height - 65,
      size: 13,
      font: fontBold,
      color: rgb(0.08, 0.18, 0.36),
    });

    page.drawText(`Trade License: ${company.tradeLicenseNumber} | ${company.phone} | ${company.email}`, {
      x: 45,
      y: height - 80,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.4, 0.45, 0.5),
    });

    page.drawText(`${company.address}`, {
      x: 45,
      y: height - 93,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.4, 0.45, 0.5),
    });

    // Form Title Banner
    page.drawRectangle({
      x: 30,
      y: height - 150,
      width: width - 60,
      height: 32,
      color: rgb(0.1, 0.25, 0.48),
    });

    page.drawText(template.formName.toUpperCase(), {
      x: 45,
      y: height - 138,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText(`FORM CODE: ${template.formCode} | VER: ${template.currentVersion} | DEPT: ${template.departmentId}`, {
      x: width - 260,
      y: height - 138,
      size: 8,
      font: fontRegular,
      color: rgb(0.9, 0.95, 1),
    });

    // Instructions Box if present
    if (template.instructions) {
      page.drawRectangle({
        x: 30,
        y: height - 185,
        width: width - 60,
        height: 26,
        color: rgb(0.98, 0.98, 0.99),
        borderColor: rgb(0.9, 0.9, 0.92),
        borderWidth: 0.5,
      });

      page.drawText(`Notice: ${template.instructions.slice(0, 110)}`, {
        x: 38,
        y: height - 176,
        size: 7.5,
        font: fontRegular,
        color: rgb(0.35, 0.4, 0.45),
      });
    }

    return pdfDoc;
  }
}
