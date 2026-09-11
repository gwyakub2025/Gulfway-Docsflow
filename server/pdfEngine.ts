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
    if (company.stampUrl) {
      stampImageEmbed = await this.embedImageBuffer(pdfDoc, company.stampUrl);
    }

    // Embed signatures with robust multi-format and smart field matching
    const signatureFields = template.fields.filter((f) => f.type === 'signature');
    const embeddedSignatures: Array<{ sig: any; image: any }> = [];

    if (document.signatures && document.signatures.length > 0) {
      for (const sig of document.signatures) {
        if (sig.signatureDataUrl) {
          const img = await this.embedImageBuffer(pdfDoc, sig.signatureDataUrl);
          if (img) {
            embeddedSignatures.push({ sig, image: img });
          }
        }
      }
    }

    // Map each template signature field to its resolved signature or official sanction seal
    const fieldSignatureMap = new Map<
      string,
      {
        image?: any;
        sig?: any;
        isApprovalSeal?: boolean;
        approverName?: string;
        approvalDate?: string;
      }
    >();

    const usedSigIndexes = new Set<number>();

    // 1. Exact Field ID Match
    signatureFields.forEach((field) => {
      const idx = embeddedSignatures.findIndex((item, i) => !usedSigIndexes.has(i) && item.sig.fieldId === field.id);
      if (idx !== -1) {
        usedSigIndexes.add(idx);
        fieldSignatureMap.set(field.id, embeddedSignatures[idx]);
      }
    });

    // 2. Exact Field Name Match
    signatureFields.forEach((field) => {
      if (fieldSignatureMap.has(field.id)) return;
      const idx = embeddedSignatures.findIndex((item, i) => !usedSigIndexes.has(i) && item.sig.fieldId === field.name);
      if (idx !== -1) {
        usedSigIndexes.add(idx);
        fieldSignatureMap.set(field.id, embeddedSignatures[idx]);
      }
    });

    // 3. Semantic Role / Alias Matching (Applicant vs Approver)
    signatureFields.forEach((field) => {
      if (fieldSignatureMap.has(field.id)) return;
      const isApproverField =
        field.signerRole === 'APPROVER' ||
        field.name.includes('hr') ||
        field.name.includes('manager') ||
        field.name.includes('fleet') ||
        field.name.includes('finance') ||
        field.label.toLowerCase().includes('hr') ||
        field.label.toLowerCase().includes('manager') ||
        field.label.toLowerCase().includes('verification') ||
        field.label.toLowerCase().includes('sanction');

      const idx = embeddedSignatures.findIndex((item, i) => {
        if (usedSigIndexes.has(i)) return false;
        const fid = (item.sig.fieldId || '').toLowerCase();
        const role = (item.sig.signerRole || '').toLowerCase();
        const isApproverSig =
          fid.includes('approv') ||
          fid.includes('hr') ||
          fid.includes('manager') ||
          fid.includes('fleet') ||
          fid.includes('finance') ||
          role.includes('approv') ||
          role.includes('admin') ||
          role.includes('manager');

        return isApproverField ? isApproverSig : !isApproverSig;
      });

      if (idx !== -1) {
        usedSigIndexes.add(idx);
        fieldSignatureMap.set(field.id, embeddedSignatures[idx]);
      }
    });

    // 4. Positional fallback for any remaining unused signatures
    signatureFields.forEach((field) => {
      if (fieldSignatureMap.has(field.id)) return;
      const idx = embeddedSignatures.findIndex((_, i) => !usedSigIndexes.has(i));
      if (idx !== -1) {
        usedSigIndexes.add(idx);
        fieldSignatureMap.set(field.id, embeddedSignatures[idx]);
      }
    });

    // 5. Official Corporate Sanction & Approval Seal for Approved/Finalized Documents
    const isApprovedOrFinal =
      document.status === 'APPROVED' ||
      document.status === 'FINAL' ||
      !!document.finalizedAt ||
      !isDraftPreview && (document.approvalHistory && document.approvalHistory.length > 0);

    if (isApprovedOrFinal) {
      signatureFields.forEach((field) => {
        if (fieldSignatureMap.has(field.id)) return;
        const isApproverSlot =
          field.signerRole === 'APPROVER' ||
          field.name.includes('hr') ||
          field.name.includes('manager') ||
          field.name.includes('fleet') ||
          field.name.includes('finance') ||
          field.label.toLowerCase().includes('hr') ||
          field.label.toLowerCase().includes('manager') ||
          field.label.toLowerCase().includes('verification') ||
          field.label.toLowerCase().includes('sanction');

        if (isApproverSlot) {
          const approvalEntry = (document.approvalHistory || []).find((a: any) => a.action === 'APPROVED');
          const statusEntry = (document.statusHistory || []).find((s: any) => s.newStatus === 'APPROVED' || s.newStatus === 'FINAL');
          const approverName = approvalEntry?.approverName || (statusEntry as any)?.changedByName || 'HR Operations Director';
          const approvalDate = approvalEntry?.actionAt || (statusEntry as any)?.changedAt || document.updatedAt || new Date().toISOString();

          fieldSignatureMap.set(field.id, {
            isApprovalSeal: true,
            approverName,
            approvalDate,
          });
        }
      });
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
          const match = fieldSignatureMap.get(field.id);
          const baselineY = yPos + 10;

          if (match?.image) {
            // Draw signature baseline
            page.drawLine({
              start: { x: xPos, y: baselineY },
              end: { x: xPos + fieldWidth, y: baselineY },
              thickness: 0.8,
              color: rgb(0.55, 0.6, 0.65),
            });

            // Draw field label below baseline
            page.drawText(field.label, {
              x: xPos,
              y: yPos - 3,
              size: 8,
              font: fontBold,
              color: rgb(0.12, 0.18, 0.28),
            });

            // Draw embedded signature image directly above the baseline
            const targetWidth = Math.min(fieldWidth - 10, 140);
            const targetHeight = Math.min(fieldHeight, 38);
            page.drawImage(match.image, {
              x: xPos + 5,
              y: baselineY + 2,
              width: Math.max(targetWidth, 60),
              height: Math.max(targetHeight, 25),
            });

            // Draw audit verification caption below field label
            const signer = match.sig?.signerName || 'Authorized Signatory';
            const dateStr = match.sig?.signedAt
              ? new Date(match.sig.signedAt).toLocaleDateString('en-GB')
              : (document.updatedAt ? new Date(document.updatedAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'));

            page.drawText(`Digitally Signed by: ${signer} | ${dateStr} (Verified)`, {
              x: xPos,
              y: yPos - 13,
              size: 5.5,
              font: fontRegular,
              color: rgb(0.1, 0.45, 0.25),
            });
          } else if (match?.isApprovalSeal) {
            // Draw official corporate sanction & verification seal block
            const boxHeight = Math.max(fieldHeight + 14, 52);
            const boxWidth = Math.max(fieldWidth, 140);

            // Light emerald tint background box
            page.drawRectangle({
              x: xPos,
              y: yPos - 10,
              width: boxWidth,
              height: boxHeight,
              color: rgb(0.95, 0.98, 0.96),
              borderColor: rgb(0.12, 0.55, 0.32),
              borderWidth: 1,
            });

            // Top accent status bar
            page.drawRectangle({
              x: xPos,
              y: yPos - 10 + boxHeight - 4,
              width: boxWidth,
              height: 4,
              color: rgb(0.12, 0.55, 0.32),
            });

            // Seal Header
            page.drawText('VERIFIED & SANCTIONED', {
              x: xPos + 8,
              y: yPos - 10 + boxHeight - 15,
              size: 7,
              font: fontBold,
              color: rgb(0.1, 0.45, 0.25),
            });

            // Field Label / Approval Title
            page.drawText(`${field.label}: Approved`, {
              x: xPos + 8,
              y: yPos - 10 + boxHeight - 26,
              size: 6.5,
              font: fontBold,
              color: rgb(0.15, 0.2, 0.28),
            });

            // Signatory & Date
            const approver = match.approverName || 'Authorized HR / Operations Director';
            const dateStr = match.approvalDate
              ? new Date(match.approvalDate).toLocaleDateString('en-GB')
              : new Date().toLocaleDateString('en-GB');

            page.drawText(`Signatory: ${approver}`, {
              x: xPos + 8,
              y: yPos - 10 + boxHeight - 37,
              size: 6,
              font: fontRegular,
              color: rgb(0.25, 0.3, 0.38),
            });

            page.drawText(`Date: ${dateStr} | Status: Certified Final`, {
              x: xPos + 8,
              y: yPos - 10 + boxHeight - 47,
              size: 5.5,
              font: fontRegular,
              color: rgb(0.35, 0.4, 0.48),
            });
          } else {
            // Draw clean signature placeholder line
            page.drawLine({
              start: { x: xPos, y: baselineY },
              end: { x: xPos + fieldWidth, y: baselineY },
              thickness: 1,
              color: rgb(0.65, 0.7, 0.75),
            });
            page.drawText(`${field.label} (Sign Here)`, {
              x: xPos,
              y: yPos - 4,
              size: 7.5,
              font: fontRegular,
              color: rgb(0.45, 0.5, 0.55),
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

  /**
   * Safely embed any base64 image (PNG, JPEG, JPG, Data URL) into PDFDocument.
   * Inspects binary signatures to dynamically select embedPng or embedJpg.
   */
  private static async embedImageBuffer(pdfDoc: PDFDocument, dataUrlOrBase64: string): Promise<any> {
    try {
      if (!dataUrlOrBase64 || typeof dataUrlOrBase64 !== 'string') return null;
      const clean = dataUrlOrBase64.trim();
      if (!clean) return null;

      let rawBase64 = clean;
      if (clean.startsWith('data:image/svg+xml')) {
        return null;
      } else if (clean.startsWith('data:image/png;base64,')) {
        rawBase64 = clean.replace(/^data:image\/png;base64,/, '');
      } else if (clean.startsWith('data:image/jpeg;base64,') || clean.startsWith('data:image/jpg;base64,')) {
        rawBase64 = clean.replace(/^data:image\/(jpeg|jpg);base64,/, '');
      } else if (clean.startsWith('data:')) {
        const base64Index = clean.indexOf(';base64,');
        if (base64Index !== -1) {
          rawBase64 = clean.substring(base64Index + 8);
        }
      }

      // Strip all whitespace, newlines, and carriage returns
      const sanitizedBase64 = rawBase64.replace(/\s+/g, '');
      const buf = Buffer.from(sanitizedBase64, 'base64');

      if (!buf || buf.length === 0) {
        console.warn('[pdfEngine] Buffer is empty after base64 decode');
        return null;
      }

      // Check binary magic bytes:
      // PNG: 0x89 0x50 0x4E 0x47
      // JPEG: 0xFF 0xD8
      if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
        const img = await pdfDoc.embedPng(buf);
        console.log(`[pdfEngine] Successfully embedded PNG image (${buf.length} bytes, dimensions: ${img.width}x${img.height})`);
        return img;
      } else if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) {
        const img = await pdfDoc.embedJpg(buf);
        console.log(`[pdfEngine] Successfully embedded JPG image (${buf.length} bytes, dimensions: ${img.width}x${img.height})`);
        return img;
      } else {
        // Fallback: try PNG first, then JPG
        try {
          const img = await pdfDoc.embedPng(buf);
          console.log(`[pdfEngine] Successfully embedded image as PNG fallback (${buf.length} bytes)`);
          return img;
        } catch {
          const img = await pdfDoc.embedJpg(buf);
          console.log(`[pdfEngine] Successfully embedded image as JPG fallback (${buf.length} bytes)`);
          return img;
        }
      }
    } catch (err: any) {
      console.warn('[pdfEngine] Failed to embed image:', err?.message || err);
      return null;
    }
  }
}
