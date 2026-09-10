import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker using official cdnjs build matching installed version or fallback
try {
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
  }
} catch (e) {
  console.warn('PDF.js worker initialization notice:', e);
}

export interface RenderedPageResult {
  dataUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
  pageNumber: number;
  totalPdfPages: number;
}

/**
 * Render a page of a PDF document to a high-resolution PNG image Data URL.
 * This guarantees reliable, cross-browser visual rendering on the interactive mapping canvas.
 */
export async function renderPdfPageToImage(
  pdfDataUriOrArrayBuffer: string | ArrayBuffer,
  pageNumber = 1,
  scale = 1.6
): Promise<RenderedPageResult> {
  let uint8Array: Uint8Array;

  if (typeof pdfDataUriOrArrayBuffer === 'string') {
    const base64Data = pdfDataUriOrArrayBuffer.replace(/^data:application\/pdf;base64,/, '');
    const binary = atob(base64Data);
    uint8Array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      uint8Array[i] = binary.charCodeAt(i);
    }
  } else {
    uint8Array = new Uint8Array(pdfDataUriOrArrayBuffer);
  }

  const loadingTask = pdfjsLib.getDocument({
    data: uint8Array,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const targetPage = Math.min(Math.max(1, pageNumber), pdfDoc.numPages);
  const page = await pdfDoc.getPage(targetPage);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get 2D canvas context for PDF rendering');
  }

  // Draw pure white background before rendering PDF layers
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: viewport.width,
    height: viewport.height,
    aspectRatio: viewport.width / viewport.height,
    pageNumber: targetPage,
    totalPdfPages: pdfDoc.numPages,
  };
}

/**
 * Parse and convert a Word document (.docx or .doc) into formatted HTML and plain text
 */
export async function parseDocxFile(arrayBuffer: ArrayBuffer): Promise<{
  html: string;
  rawText: string;
  messages: string[];
}> {
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const rawResult = await mammoth.extractRawText({ arrayBuffer });
    return {
      html: result.value,
      rawText: rawResult.value,
      messages: (result.messages || []).map((m: any) => m.message || String(m)),
    };
  } catch (err: any) {
    throw new Error(`Failed to parse Word document: ${err.message}`);
  }
}
