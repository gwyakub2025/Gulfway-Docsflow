/**
 * Bulletproof enterprise PDF download, export, and print helper for Gulf Way DocFlow.
 * Handles iframe sandboxing, pop-up blocker interventions, cross-origin security restrictions,
 * and provides instant visual status toasts with fail-safe fallback options.
 */

export function isRunningInIframe(): boolean {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch (e) {
    return true;
  }
}

/**
 * Builds a clean, fully qualified absolute URL with required origin parameters.
 */
export function buildPdfAbsoluteUrl(url: string, download = true): string {
  if (typeof window === 'undefined') return url;

  const origin = window.location.origin;
  const separator = url.includes('?') ? '&' : '?';
  let targetUrl = url;

  if (download && !targetUrl.includes('download=')) {
    targetUrl = `${targetUrl}${separator}download=true`;
  }

  const secondSep = targetUrl.includes('?') ? '&' : '?';
  if (!targetUrl.includes('baseUrl=')) {
    targetUrl = `${targetUrl}${secondSep}baseUrl=${encodeURIComponent(origin)}`;
  }

  if (targetUrl.startsWith('http')) {
    return targetUrl;
  }

  return `${origin}${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`;
}

/**
 * Displays a non-intrusive, interactive download status notification.
 * Gives users immediate visual feedback and one-click escape options
 * if their browser restricts sandboxed downloads.
 */
export function showDownloadToast(options: {
  filename: string;
  status: 'loading' | 'success' | 'warning' | 'error';
  message: string;
  downloadUrl?: string;
  onPrint?: () => void;
}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const toastId = 'docflow-pdf-download-toast';
  let container = document.getElementById(toastId);

  if (!container) {
    container = document.createElement('div');
    container.id = toastId;
    container.style.position = 'fixed';
    container.style.bottom = '24px';
    container.style.right = '24px';
    container.style.zIndex = '999999';
    container.style.maxWidth = '420px';
    container.style.width = 'calc(100vw - 48px)';
    container.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)';
    container.style.borderRadius = '12px';
    container.style.overflow = 'hidden';
    container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    container.style.transition = 'all 0.3s ease';
    document.body.appendChild(container);
  }

  const isDark = true;
  const bg = isDark ? '#0f172a' : '#ffffff';
  const border = options.status === 'error' ? '#ef4444' : options.status === 'warning' ? '#f59e0b' : '#3b82f6';
  const textColor = '#f8fafc';

  container.style.backgroundColor = bg;
  container.style.border = `1.5px solid ${border}`;
  container.style.color = textColor;

  const iconSvg =
    options.status === 'loading'
      ? `<svg class="animate-spin" style="width:20px;height:20px;color:#60a5fa;animation:spin 1s linear infinite;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`
      : options.status === 'error'
      ? `<svg style="width:20px;height:20px;color:#f87171;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
      : `<svg style="width:20px;height:20px;color:#34d399;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

  container.innerHTML = `
    <style>
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .toast-btn { display:inline-flex; align-items:center; gap:4px; padding:5px 10px; font-size:11px; font-weight:600; border-radius:6px; cursor:pointer; text-decoration:none; transition:background 0.2s; }
      .toast-btn-primary { background:#2563eb; color:#ffffff; border:none; }
      .toast-btn-primary:hover { background:#1d4ed8; }
      .toast-btn-secondary { background:#334155; color:#cbd5e1; border:1px solid #475569; }
      .toast-btn-secondary:hover { background:#475569; color:#ffffff; }
    </style>
    <div style="padding: 14px 16px;">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
        <div style="display:flex; align-items:flex-start; gap:10px;">
          <div style="margin-top:2px;">${iconSvg}</div>
          <div>
            <div style="font-weight:700; font-size:13px; color:#ffffff; line-height:1.2;">${options.filename}</div>
            <div style="font-size:11.5px; color:#94a3b8; margin-top:3px; line-height:1.4;">${options.message}</div>
          </div>
        </div>
        <button id="toast-close-btn" style="background:transparent; border:none; color:#64748b; cursor:pointer; font-size:16px; padding:0 4px; line-height:1;">✕</button>
      </div>

      ${
        options.downloadUrl
          ? `
        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; padding-top:10px; border-top:1px solid #334155;">
          <a href="${options.downloadUrl}" target="_blank" rel="noopener noreferrer" class="toast-btn toast-btn-primary">
            <svg style="width:12px;height:12px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            Open / Save in New Tab
          </a>
          <button id="toast-copy-btn" class="toast-btn toast-btn-secondary">
            <svg style="width:12px;height:12px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
            Copy Direct Link
          </button>
        </div>
      `
          : ''
      }
    </div>
  `;

  // Attach interactive listeners
  const closeBtn = document.getElementById('toast-close-btn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      container?.remove();
    };
  }

  const copyBtn = document.getElementById('toast-copy-btn');
  if (copyBtn && options.downloadUrl) {
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(options.downloadUrl!);
        copyBtn.innerText = 'Copied to Clipboard!';
        setTimeout(() => {
          if (copyBtn) copyBtn.innerText = 'Copy Direct Link';
        }, 2500);
      } catch {
        prompt('Copy PDF URL:', options.downloadUrl);
      }
    };
  }

  // Auto-dismiss after 9 seconds if not loading
  if (options.status !== 'loading') {
    setTimeout(() => {
      if (document.getElementById(toastId) === container) {
        container?.remove();
      }
    }, 9000);
  }
}

/**
 * Primary bulletproof client-side PDF download handler.
 * Combines native link download, blob stream fetching, and standalone tab opening.
 */
export async function downloadPdfFromUrl(url: string, filename: string): Promise<void> {
  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const fullTargetUrl = buildPdfAbsoluteUrl(url, true);

  showDownloadToast({
    filename: safeFilename,
    status: 'loading',
    message: 'Initiating PDF document download...',
    downloadUrl: fullTargetUrl,
  });

  try {
    // Strategy 1: Fetch raw binary stream to create valid application/pdf Blob
    const response = await fetch(fullTargetUrl, {
      method: 'GET',
      headers: {
        'x-app-base-url': typeof window !== 'undefined' ? window.location.origin : '',
      },
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error('Received empty 0-byte stream');
    }

    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(pdfBlob);

    // Trigger simulated click
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = safeFilename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }, 2000);

    // If running in an iframe, the browser might suppress link.click() silently.
    // We notify the user with quick fallbacks.
    if (isRunningInIframe()) {
      showDownloadToast({
        filename: safeFilename,
        status: 'success',
        message: 'Download sent. If your browser blocked the iframe file save, click "Open in New Tab" below.',
        downloadUrl: fullTargetUrl,
      });
    } else {
      showDownloadToast({
        filename: safeFilename,
        status: 'success',
        message: 'File downloaded successfully to your computer.',
        downloadUrl: fullTargetUrl,
      });
    }
  } catch (err: any) {
    console.warn('[PdfDownloadHelper] Fetch download failed, opening top-level window fallback:', err.message);

    // Strategy 2: Direct top-level navigation to ensure file downloads regardless of CORS/sandboxes
    try {
      const fallbackLink = document.createElement('a');
      fallbackLink.href = fullTargetUrl;
      fallbackLink.download = safeFilename;
      fallbackLink.target = '_blank';
      fallbackLink.rel = 'noopener noreferrer';
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      setTimeout(() => document.body.removeChild(fallbackLink), 1000);
    } catch {
      window.open(fullTargetUrl, '_blank', 'noopener,noreferrer');
    }

    showDownloadToast({
      filename: safeFilename,
      status: 'warning',
      message: 'Opening PDF stream in standalone window for native browser download...',
      downloadUrl: fullTargetUrl,
    });
  }
}

/**
 * Downloads a PDF directly from a base64 data URL (e.g. data:application/pdf;base64,...)
 */
export function downloadPdfFromBase64(base64DataUrl: string, filename: string): void {
  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

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
    link.download = safeFilename;
    link.style.display = 'none';
    window.document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }, 2000);

    showDownloadToast({
      filename: safeFilename,
      status: 'success',
      message: 'Base64 document decoded and saved to your device.',
    });
  } catch (err: any) {
    console.error('[PdfDownloadHelper] Base64 download error:', err);
    showDownloadToast({
      filename: safeFilename,
      status: 'error',
      message: `Failed to decode document: ${err.message}`,
    });
  }
}

/**
 * Native Print / Save to PDF utility.
 * Renders an image or PDF into a hidden printable iframe and invokes window.print().
 * Guarantees "Save as PDF" access even in restricted environments.
 */
export function printDocumentCanvas(canvasElement: HTMLCanvasElement | null, title = 'Gulf Way Document'): void {
  if (!canvasElement) {
    alert('Document canvas not ready for printing.');
    return;
  }

  try {
    const dataUrl = canvasElement.toDataURL('image/png', 1.0);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { size: auto; margin: 0; }
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: white; }
            img { width: 100%; height: auto; max-width: 100%; page-break-inside: avoid; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.focus(); window.print(); setTimeout(() => { window.parent.document.body.removeChild(window.frameElement); }, 1500);" />
        </body>
      </html>
    `);
    doc.close();
  } catch (err) {
    console.error('Print error:', err);
    window.print();
  }
}
