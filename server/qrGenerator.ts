import QRCode, { QRCodeToDataURLOptions } from 'qrcode';

export interface QrOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  darkColor?: string; // hex, e.g. '#0f274a' or '#000000'
  lightColor?: string; // hex, e.g. '#ffffff'
}

export interface VerificationUrlOptions {
  token: string;
  documentNumber?: string;
  baseUrl?: string;
}

export interface DocumentVerificationQrResult {
  verificationUrl: string;
  qrDataUrl: string;
  qrBuffer: Buffer;
  token: string;
}

/**
 * Server-side QR Code Generator Utility
 * Encodes secure verification URLs for official documents using the 'qrcode' npm package.
 */
export class QrGenerator {
  private static defaultBaseUrl(): string {
    const envUrl = process.env.APP_URL;
    if (envUrl && envUrl !== 'MY_APP_URL') {
      return envUrl.replace(/\/+$/, '');
    }
    return 'http://localhost:3000';
  }

  /**
   * Constructs the canonical secure public verification URL for a given document verification token.
   */
  public static buildVerificationUrl(options: VerificationUrlOptions): string {
    const base = (options.baseUrl || this.defaultBaseUrl()).replace(/\/+$/, '');
    const cleanToken = encodeURIComponent(options.token || '');
    return `${base}/verify/${cleanToken}`;
  }

  /**
   * Generates a PNG Data URL (data:image/png;base64,...) for any verification URL or text payload.
   */
  public static async generateDataUrl(
    textOrUrl: string,
    options?: QrOptions
  ): Promise<string> {
    const qrOpts: QRCodeToDataURLOptions = {
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
      margin: options?.margin ?? 1,
      width: options?.width ?? 200,
      color: {
        dark: options?.darkColor || '#0a192f',
        light: options?.lightColor || '#ffffff',
      },
    };

    return await QRCode.toDataURL(textOrUrl, qrOpts);
  }

  /**
   * Generates a raw PNG Buffer suitable for PDF embedding (pdf-lib), image saving, or direct streaming.
   */
  public static async generatePngBuffer(
    textOrUrl: string,
    options?: QrOptions
  ): Promise<Buffer> {
    return await QRCode.toBuffer(textOrUrl, {
      type: 'png',
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
      margin: options?.margin ?? 1,
      width: options?.width ?? 200,
      color: {
        dark: options?.darkColor || '#0a192f',
        light: options?.lightColor || '#ffffff',
      },
    });
  }

  /**
   * Generates an SVG string representation of the QR code for scalable vector rendering.
   */
  public static async generateSvgString(
    textOrUrl: string,
    options?: QrOptions
  ): Promise<string> {
    return await QRCode.toString(textOrUrl, {
      type: 'svg',
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
      margin: options?.margin ?? 1,
      width: options?.width ?? 200,
      color: {
        dark: options?.darkColor || '#0a192f',
        light: options?.lightColor || '#ffffff',
      },
    });
  }

  /**
   * High-level helper: Creates complete verification QR artifacts for a document record.
   */
  public static async generateDocumentVerificationQr(
    document: {
      id?: string;
      documentNumber?: string;
      secureVerificationToken?: string;
    },
    options?: {
      baseUrl?: string;
      width?: number;
      darkColor?: string;
    }
  ): Promise<DocumentVerificationQrResult> {
    const token = document.secureVerificationToken || document.id || 'VERIFICATION_TOKEN_PENDING';
    const verificationUrl = this.buildVerificationUrl({
      token,
      documentNumber: document.documentNumber,
      baseUrl: options?.baseUrl,
    });

    const qrDataUrl = await this.generateDataUrl(verificationUrl, {
      width: options?.width ?? 200,
      darkColor: options?.darkColor || '#0a192f',
      margin: 1,
      errorCorrectionLevel: 'M',
    });

    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
    const qrBuffer = Buffer.from(base64Data, 'base64');

    return {
      verificationUrl,
      qrDataUrl,
      qrBuffer,
      token,
    };
  }
}
