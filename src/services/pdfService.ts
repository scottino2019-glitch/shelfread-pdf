import * as pdfjsLib from 'pdfjs-dist';
import { ExtractedPageText } from '../types/book';
import { getPdfFromIndexedDB } from '../utils/pdfStorage';

// Configure local worker from public folder for instant offline support
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export interface PDFDocHandle {
  numPages: number;
  pdfDocument: pdfjsLib.PDFDocumentProxy;
}

// Track active render task to cancel safely whenever zoom or page changes
let activeRenderTask: any = null;

export interface RenderDimensions {
  displayWidth: number;
  displayHeight: number;
  pixelWidth: number;
  pixelHeight: number;
}

/**
 * Loads a PDF document from a URL, Uint8Array, or IndexedDB with local cmaps and standard fonts
 */
export async function loadPDFDocument(
  source: string | Uint8Array | ArrayBuffer,
  bookId?: string
): Promise<PDFDocHandle> {
  // If stored in IndexedDB, fetch the binary directly
  if (typeof source === 'string' && source.startsWith('indexeddb://')) {
    const id = source.replace('indexeddb://', '');
    const indexedData = await getPdfFromIndexedDB(id);
    if (indexedData) {
      source = indexedData;
    }
  } else if (bookId) {
    const indexedData = await getPdfFromIndexedDB(bookId);
    if (indexedData) {
      source = indexedData;
    }
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const options: any = {
    cMapUrl: `${origin}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${origin}/standard_fonts/`,
  };

  if (typeof source === 'string') {
    options.url = source;
  } else {
    options.data = source;
  }

  const loadingTask = pdfjsLib.getDocument(options);
  const pdfDocument = await loadingTask.promise;
  return {
    numPages: pdfDocument.numPages,
    pdfDocument,
  };
}

/**
 * Renders a specific page onto an HTML5 canvas with razor-sharp HiDPI supersampling.
 * Uses Mozilla PDF.js official transform pattern with logical viewport and scaled context.
 * Safely cancels previous rendering tasks to prevent collisions and blurriness.
 */
export async function renderPDFPageToCanvas(
  pdfDocument: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.0
): Promise<RenderDimensions> {
  // Cancel any running render task before starting a new one
  if (activeRenderTask) {
    try {
      activeRenderTask.cancel();
    } catch {
      // Ignored
    }
    activeRenderTask = null;
  }

  const page = await pdfDocument.getPage(pageNumber);

  // High-DPI supersampling multiplier (at least 2x for crystal-clear vector text on all screens)
  const dpr = Math.min(3, Math.max(window.devicePixelRatio || 1, 2));

  // Logical viewport for CSS screen display dimensions
  const cssViewport = page.getViewport({ scale });
  const displayWidth = Math.round(cssViewport.width);
  const displayHeight = Math.round(cssViewport.height);

  // High-resolution rendering viewport for the canvas internal pixel buffer
  const renderViewport = page.getViewport({ scale: scale * dpr });
  const pixelWidth = Math.round(renderViewport.width);
  const pixelHeight = Math.round(renderViewport.height);

  // Configure canvas internal resolution
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;

  // Set explicit CSS display size matching the logical viewport
  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Impossibile ottenere il contesto 2D del canvas');

  // Fill natural warm parchment paper tone before drawing
  ctx.fillStyle = '#FAF7F1';
  ctx.fillRect(0, 0, pixelWidth, pixelHeight);

  // Enable high-quality smoothing for graphics and images
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Render directly with high-resolution viewport for razor sharpness
  const renderContext: any = {
    canvasContext: ctx,
    viewport: renderViewport,
  };

  const renderTask = page.render(renderContext);
  activeRenderTask = renderTask;

  try {
    await renderTask.promise;
  } catch (err: any) {
    // RenderingCancelledException is expected when user changes page or zoom rapidly
    if (err?.name === 'RenderingCancelledException') {
      return {
        displayWidth,
        displayHeight,
        pixelWidth,
        pixelHeight,
      };
    }
    throw err;
  } finally {
    if (activeRenderTask === renderTask) {
      activeRenderTask = null;
    }
  }

  return {
    displayWidth,
    displayHeight,
    pixelWidth,
    pixelHeight,
  };
}

/**
 * Extracts clean structured text and paragraphs from all pages of the document
 */
export async function extractAllTextFromPDF(
  pdfDocument: pdfjsLib.PDFDocumentProxy
): Promise<ExtractedPageText[]> {
  const pages: ExtractedPageText[] = [];

  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    
    const lines: string[] = [];
    let currentLine = '';
    let lastY: number | null = null;

    for (const item of textContent.items) {
      if ('str' in item && item.str.length > 0) {
        const y = Math.round(item.transform[5]);
        
        // If vertical position moved down, start a new line
        if (lastY === null || Math.abs(y - lastY) > 5) {
          if (currentLine.trim()) {
            lines.push(currentLine.trim());
          }
          currentLine = item.str;
          lastY = y;
        } else {
          // Same line: join with space if needed
          if (currentLine.endsWith(' ') || item.str.startsWith(' ')) {
            currentLine += item.str;
          } else {
            currentLine += ' ' + item.str;
          }
        }
      }
    }

    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    // Group into readable paragraphs
    const paragraphs: string[] = [];
    let currentPara: string[] = [];

    for (const line of lines) {
      if (line.length === 0) {
        if (currentPara.length > 0) {
          paragraphs.push(currentPara.join(' '));
          currentPara = [];
        }
      } else {
        currentPara.push(line);
      }
    }

    if (currentPara.length > 0) {
      paragraphs.push(currentPara.join(' '));
    }

    const fullPageText = paragraphs.join('\n\n');

    pages.push({
      pageNumber: i,
      text: fullPageText || '(Nessun testo selezionabile estratto in questa pagina)',
      paragraphs: paragraphs.length > 0 ? paragraphs : ['(Pagina priva di testo estraibile)'],
    });
  }

  return pages;
}
