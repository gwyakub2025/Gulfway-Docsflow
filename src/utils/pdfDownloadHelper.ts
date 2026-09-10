/**
 * Bulletproof client-side PDF download utility.
 * Resolves 0-byte download issues in iframe/sandboxed environments by fetching
 * the binary stream as an ArrayBuffer/Blob and triggering download via ObjectURL.
 */
export async function downloadPdfFromUrl(url: string, filename: string): Promise<void> {
  try {
    // Append window.location.origin as baseUrl if not already present
    const separator = url.includes('?') ? '&' : '?';
    const targetUrl = url.includes('baseUrl=')
      ? url
      : `${url}${separator}baseUrl=${encodeURIComponent(window.location.origin)}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'x-app-base-url': window.location.origin,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Network response was not ok');
      throw new Error(`Server returned status ${response.status}: ${errorText}`);
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error('Received 0 bytes from PDF endpoint');
    }

    // Force application/pdf MIME type
    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(pdfBlob);

    const link = window.document.createElement('a');
    link.href = blobUrl;
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    link.style.display = 'none';
    window.document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }, 1500);
  } catch (err: any) {
    console.error('[PdfDownloadHelper] Fetch download failed, attempting window fallback:', err);
    // Fallback: direct window open if blob fetch had issues
    const fallbackLink = window.document.createElement('a');
    fallbackLink.href = url;
    fallbackLink.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    fallbackLink.target = '_blank';
    fallbackLink.rel = 'noopener noreferrer';
    fallbackLink.click();
  }
}

/**
 * Downloads a PDF directly from a base64 data URL (e.g. data:application/pdf;base64,...)
 */
export function downloadPdfFromBase64(base64DataUrl: string, filename: string): void {
  try {
    const base64Clean = base64DataUrl.replace(/^data:application\/pdf;base64,/, '');
    const byteCharacters = atob(base64Clean);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);

    const link = window.document.createElement('a');
    link.href = blobUrl;
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    link.style.display = 'none';
    window.document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }, 1500);
  } catch (err) {
    console.error('[PdfDownloadHelper] Base64 download error:', err);
  }
}
