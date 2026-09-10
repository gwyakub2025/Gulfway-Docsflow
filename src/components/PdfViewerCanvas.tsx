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
} from 'lucide-react';
import { downloadPdfFromUrl, downloadPdfFromBase64 } from '../utils/pdfDownloadHelper.js';

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

  // Load the PDF from either URL or Base64
  useEffect(() => {
    let isCancelled = false;

    const loadPdf = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        let uint8Array: Uint8Array;

        if (pdfBase64) {
          const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
          const binary = atob(cleanBase64);
          uint8Array = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            uint8Array[i] = binary.charCodeAt(i);
          }
        } else if (pdfUrl) {
          const sep = pdfUrl.includes('?') ? '&' : '?';
          const targetUrl = pdfUrl.includes('baseUrl=')
            ? pdfUrl
            : `${pdfUrl}${sep}baseUrl=${encodeURIComponent(window.location.origin)}`;

          const response = await fetch(targetUrl, {
            headers: {
              'x-app-base-url': window.location.origin,
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to load PDF (${response.status})`);
          }

          const arrayBuffer = await response.arrayBuffer();
          if (arrayBuffer.byteLength === 0) {
            throw new Error('Received 0 bytes from PDF endpoint');
          }
          uint8Array = new Uint8Array(arrayBuffer);
        } else {
          throw new Error('No PDF source provided');
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
  }, [pdfUrl, pdfBase64]);

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

        // Support high-DPI (Retina) displays
        const dpr = window.devicePixelRatio || 1;
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
    if (rawPdfBytes) {
      const blob = new Blob([rawPdfBytes], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
      }
    }
  };

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

        {/* Center: Pagination & Zoom */}
        <div className="flex items-center gap-2">
          {totalPages > 1 && (
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
              className="text-[10px] px-1 text-slate-400 hover:text-white transition-colors"
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Right Actions: Download, Open in New Tab, Close */}
        <div className="flex items-center gap-2">
          {showOpenInNewTabButton && (
            <button
              onClick={handleOpenInNewTab}
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Open document in a new browser tab with native controls"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Tab</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs transition-colors"
            title="Print PDF"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {showDownloadButton && (
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
          )}

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
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File Direct</span>
              </button>
              {showOpenInNewTabButton && (
                <button
                  onClick={handleOpenInNewTab}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Tab</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* The HTML5 Canvas rendered by PDF.js */}
        <div className={`transition-opacity duration-200 ${isLoading || errorMessage ? 'opacity-0 hidden' : 'opacity-100 block'}`}>
          <div className="shadow-2xl rounded-xs overflow-hidden border border-slate-700 bg-white">
            <canvas ref={canvasRef} className="block mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};
