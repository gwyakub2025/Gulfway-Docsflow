import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  RefreshCw,
  Loader2,
  Printer,
  FileText,
  AlertCircle,
  X,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { downloadPdfFromUrl, downloadPdfFromBase64, printDocumentCanvas } from '../utils/pdfDownloadHelper.js';
import { DocumentRecord } from '../types/index.js';
import { api } from '../api.js';

// Ensure PDF.js worker is configured
try {
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
  }
} catch (e) {
  // worker init fallback
}

interface PdfViewerCanvasProps {
  pdfUrl?: string;
  pdfBase64?: string;
  document?: DocumentRecord;
  documentNumber?: string;
  title?: string;
  onClose?: () => void;
  showDownloadButton?: boolean;
  showOpenInNewTabButton?: boolean;
  className?: string;
}

export const PdfViewerCanvas: React.FC<PdfViewerCanvasProps> = ({
  pdfUrl,
  pdfBase64,
  document,
  documentNumber = 'DOCUMENT',
  title = 'Official Document',
  onClose,
  showDownloadButton = true,
  showOpenInNewTabButton = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.3);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [rawPdfBytes, setRawPdfBytes] = useState<Uint8Array | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Check if document has an uploaded physical scanned image
  const hasUploadedImage =
    document?.signedDocumentUrl &&
    (document.signedDocumentUrl.startsWith('data:image/') ||
      document.signedDocumentUrl.endsWith('.jpg') ||
      document.signedDocumentUrl.endsWith('.png') ||
      document.signedDocumentUrl.endsWith('.jpeg'));

  const [viewMode, setViewMode] = useState<'PDF' | 'IMAGE'>('PDF');

  // Load the PDF from URL, Base64, or fallback renderer
  useEffect(() => {
    let isCancelled = false;

    const loadPdf = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        let uint8Array: Uint8Array | null = null;

        // 1. Direct Base64 source
        if (pdfBase64) {
          const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
          const binary = atob(cleanBase64);
          uint8Array = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            uint8Array[i] = binary.charCodeAt(i);
          }
        }

        // 2. Fetch from URL with resilient fallback
        if (!uint8Array && pdfUrl) {
          const sep = pdfUrl.includes('?') ? '&' : '?';
          let targetUrl = pdfUrl.includes('baseUrl=')
            ? pdfUrl
            : `${pdfUrl}${sep}baseUrl=${encodeURIComponent(window.location.origin)}`;

          // Include document fallback data in query if available
          if (document && !targetUrl.includes('docData=')) {
            try {
              const docPayload = btoa(JSON.stringify(document));
              targetUrl += `&docData=${encodeURIComponent(docPayload)}`;
            } catch {
              // ignore payload encoding
            }
          }

          try {
            const response = await fetch(targetUrl, {
              headers: {
                'x-app-base-url': window.location.origin,
              },
            });

            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              if (arrayBuffer.byteLength > 0) {
                uint8Array = new Uint8Array(arrayBuffer);
              }
            } else if (response.status === 404 && document) {
              console.warn(`[PdfViewerCanvas] Server returned 404 for ${targetUrl}. Attempting automatic render fallback...`);
              // Automatic recovery: Sync document to server and render directly
              await api.syncDocumentToServer(document);
              const rendered = await api.renderDocumentPdf(document);
              if (rendered.pdfBytes) {
                uint8Array = rendered.pdfBytes;
              } else if (rendered.pdfBase64) {
                const cleanBase64 = rendered.pdfBase64.replace(/^data:application\/pdf;base64,/, '');
                const binary = atob(cleanBase64);
                uint8Array = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                  uint8Array[i] = binary.charCodeAt(i);
                }
              }
            } else {
              throw new Error(`Failed to load PDF (${response.status})`);
            }
          } catch (fetchErr: any) {
            // Fallback attempt: direct POST render
            if (document) {
              console.warn('[PdfViewerCanvas] Fetch failed. Executing fallback direct render via api.renderDocumentPdf...');
              const rendered = await api.renderDocumentPdf(document);
              if (rendered.pdfBytes) {
                uint8Array = rendered.pdfBytes;
              } else if (rendered.pdfBase64) {
                const cleanBase64 = rendered.pdfBase64.replace(/^data:application\/pdf;base64,/, '');
                const binary = atob(cleanBase64);
                uint8Array = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                  uint8Array[i] = binary.charCodeAt(i);
                }
              }
            } else {
              throw fetchErr;
            }
          }
        }

        // 3. Fallback when only document is passed
        if (!uint8Array && document) {
          const rendered = await api.renderDocumentPdf(document);
          if (rendered.pdfBytes) {
            uint8Array = rendered.pdfBytes;
          } else if (rendered.pdfBase64) {
            const cleanBase64 = rendered.pdfBase64.replace(/^data:application\/pdf;base64,/, '');
            const binary = atob(cleanBase64);
            uint8Array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              uint8Array[i] = binary.charCodeAt(i);
            }
          }
        }

        if (!uint8Array || uint8Array.length === 0) {
          throw new Error('No PDF bytes could be generated or loaded');
        }

        if (isCancelled) return;
        setRawPdfBytes(uint8Array);

        const loadingTask = pdfjsLib.getDocument({
          data: uint8Array,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        setIsLoading(false);
      } catch (err: any) {
        if (!isCancelled) {
          console.error('[PdfViewerCanvas] Error loading PDF:', err);
          setErrorMessage(err.message || 'Unable to render PDF document');
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [pdfUrl, pdfBase64, document, reloadKey]);

  // Render the current page onto the canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let renderTask: any = null;
    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled || !canvasRef.current) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Support high-DPI (Retina) displays with minimum 2x supersampling for crisp text
        const dpr = Math.max(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.scale(dpr, dpr);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.warn('[PdfViewerCanvas] Page render warning:', err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, currentPage, scale]);

  // Handle direct download
  const handleDownload = async () => {
    setIsDownloading(true);
    const filename = `${documentNumber}.pdf`;

    try {
      if (rawPdfBytes) {
        const blob = new Blob([rawPdfBytes], { type: 'application/pdf' });
        const blobUrl = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        window.document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          window.document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 1500);
      } else if (pdfBase64) {
        downloadPdfFromBase64(pdfBase64, filename);
      } else if (pdfUrl) {
        await downloadPdfFromUrl(pdfUrl, filename);
      }
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Open in new tab using clean blob URL
  const handleOpenInNewTab = () => {
    try {
      if (rawPdfBytes) {
        const blob = new Blob([rawPdfBytes], { type: 'application/pdf' });
        const blobUrl = window.URL.createObjectURL(blob);
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
      } else if (pdfUrl) {
        const targetUrl = pdfUrl.includes('baseUrl=')
          ? pdfUrl
          : `${pdfUrl}${pdfUrl.includes('?') ? '&' : '?'}baseUrl=${encodeURIComponent(window.location.origin)}`;
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Open in new tab error:', err);
    }
  };

  // Print current PDF
  const handlePrint = () => {
    if (canvasRef.current) {
      printDocumentCanvas(canvasRef.current, `${documentNumber} - ${title}`);
    } else if (rawPdfBytes) {
      const blob = new Blob([rawPdfBytes], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
      }
    }
  };

  const resolvedDownloadUrl = pdfUrl
    ? pdfUrl.includes('download=')
      ? pdfUrl
      : `${pdfUrl}${pdfUrl.includes('?') ? '&' : '?'}download=true`
    : undefined;

  return (
    <div className={`flex flex-col h-full bg-slate-900 text-slate-100 rounded-xl overflow-hidden shadow-2xl border border-slate-700 ${className}`}>
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-800/95 border-b border-slate-700 text-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="truncate">
            <span className="font-bold text-white tracking-wide truncate block">
              {documentNumber}
            </span>
            <span className="text-[11px] text-slate-400 truncate block">
              {title}
            </span>
          </div>
        </div>

        {/* Center: Pagination & Zoom & View Switcher */}
        <div className="flex items-center gap-2">
          {hasUploadedImage && (
            <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setViewMode('PDF')}
                className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                  viewMode === 'PDF' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Official PDF</span>
              </button>
              <button
                onClick={() => setViewMode('IMAGE')}
                className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                  viewMode === 'IMAGE' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Scanned Image</span>
              </button>
            </div>
          )}

          {viewMode === 'PDF' && totalPages > 1 && (
            <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-700">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 hover:text-blue-400 disabled:opacity-30 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] text-slate-300 px-1">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 hover:text-blue-400 disabled:opacity-30 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-700">
            <button
              onClick={() => setScale((s) => Math.max(0.7, Math.round((s - 0.15) * 100) / 100))}
              className="p-1 hover:text-blue-400 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] text-slate-300 w-10 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(2.5, Math.round((s + 0.15) * 100) / 100))}
              className="p-1 hover:text-blue-400 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setScale(1.3)}
              className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white rounded transition-colors flex items-center gap-1"
              title="Reset View"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Right Actions: Download, Open in New Tab, Close */}
        <div className="flex items-center gap-2">
          {showOpenInNewTabButton && pdfUrl ? (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer inline-flex"
              title="Open document in a new browser tab with native controls"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Tab</span>
            </a>
          ) : showOpenInNewTabButton ? (
            <button
              onClick={handleOpenInNewTab}
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Open document in a new browser tab with native controls"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Tab</span>
            </button>
          ) : null}

          <button
            onClick={handlePrint}
            className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs transition-colors cursor-pointer"
            title="Print PDF / Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {showDownloadButton && resolvedDownloadUrl ? (
            <a
              href={resolvedDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={`${documentNumber}.pdf`}
              onClick={() => handleDownload()}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer inline-flex"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloading ? 'Downloading...' : 'Download PDF'}</span>
            </a>
          ) : showDownloadButton ? (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloading ? 'Downloading...' : 'Download PDF'}</span>
            </button>
          ) : null}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors ml-1"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Canvas Viewport Area */}
      <div
        ref={containerRef}
        className="flex-1 w-full overflow-auto p-4 flex items-center justify-center bg-slate-950/90 relative min-h-[450px]"
      >
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 text-slate-300">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-xs font-semibold">Rendering official document layers...</span>
          </div>
        )}

        {errorMessage && !isLoading && (
          <div className="max-w-md p-6 bg-slate-900 border border-rose-900/50 rounded-xl text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">Preview Could Not Be Loaded</h4>
            <p className="text-xs text-slate-400">{errorMessage}</p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  setIsLoading(true);
                  setErrorMessage('');
                  if (document) {
                    api.syncDocumentToServer(document).finally(() => setReloadKey((k) => k + 1));
                  } else {
                    setReloadKey((k) => k + 1);
                  }
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry / Re-render Preview</span>
              </button>
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File Direct</span>
              </button>
              {showOpenInNewTabButton && (
                <button
                  onClick={handleOpenInNewTab}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Tab</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* View Mode: Image Preview (Scanned Document) */}
        {viewMode === 'IMAGE' && hasUploadedImage && document?.signedDocumentUrl && (
          <div className="flex flex-col items-center justify-center max-w-4xl w-full">
            <div
              className="bg-white p-2 rounded-lg shadow-2xl border border-slate-700 overflow-hidden transition-transform duration-150"
              style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
            >
              <img
                src={document.signedDocumentUrl}
                alt={`Scanned copy of ${documentNumber}`}
                className="max-h-[750px] w-auto object-contain rounded"
              />
            </div>
          </div>
        )}

        {/* The HTML5 Canvas rendered by PDF.js */}
        {viewMode === 'PDF' && (
          <div className={`transition-opacity duration-200 ${isLoading || errorMessage ? 'opacity-0 hidden' : 'opacity-100 block'}`}>
            <div className="shadow-2xl rounded-xs overflow-hidden border border-slate-700 bg-white">
              <canvas ref={canvasRef} className="block mx-auto" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
