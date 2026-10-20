import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Book, ReaderMode, PaperTone, ReaderSettings, ExtractedPageText } from '../types/book';
import {
  loadPDFDocument,
  renderPDFPageToCanvas,
  extractAllTextFromPDF,
  PDFDocHandle,
  RenderDimensions,
} from '../services/pdfService';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Volume2,
  VolumeX,
  Search,
  Download,
  Copy,
  Check,
  Sidebar,
  Sliders,
  Plus,
  RotateCw,
  Expand,
  Minimize,
} from 'lucide-react';

interface ReaderProps {
  book: Book;
  initialMode?: ReaderMode;
  onBackToLibrary: () => void;
  onUpdateProgress: (bookId: string, page: number) => void;
  settings: ReaderSettings;
  onUpdateSettings: (settings: ReaderSettings) => void;
  onAddPdf?: () => void;
}

const PAPER_THEMES: Record<
  PaperTone,
  {
    name: string;
    bg: string;
    text: string;
    border: string;
    metaText: string;
    description: string;
  }
> = {
  avorio: {
    name: 'Carta Avorio Naturale',
    bg: '#FAF6ED',
    text: '#1F1D1A',
    border: '#E8DEC8',
    metaText: '#7B6F5F',
    description: 'Tonalità pergamena calda e riposante, zero riflessi',
  },
  antica: {
    name: "Carta Antica d'Archivio",
    bg: '#F3EDE2',
    text: '#26231F',
    border: '#DFD5C4',
    metaText: '#7F7263',
    description: 'Fibre naturali ad alto contrasto per studio prolungato',
  },
  opaca: {
    name: 'Carta Selce Opaca',
    bg: '#EAE4D7',
    text: '#1C1917',
    border: '#D6CDBC',
    metaText: '#706456',
    description: 'Cotone pressato non sbiancato per lettura serena',
  },
  notte: {
    name: 'Inchiostro Carbone Notturno',
    bg: '#1e1a16',
    text: '#DCD6CB',
    border: '#3B352F',
    metaText: '#9A8E80',
    description: 'Fondo carbone scuro ad alto riposo visivo',
  },
};

export const Reader: React.FC<ReaderProps> = ({
  book,
  initialMode = 'pdf',
  onBackToLibrary,
  onUpdateProgress,
  settings,
  onUpdateSettings,
  onAddPdf,
}) => {
  const [mode, setMode] = useState<ReaderMode>(initialMode);
  const [currentPage, setCurrentPage] = useState<number>(book.lastReadPage || 1);
  const [totalPages, setTotalPages] = useState<number>(book.pageCount || 1);
  const [pdfHandle, setPdfHandle] = useState<PDFDocHandle | null>(null);
  const [extractedPages, setExtractedPages] = useState<ExtractedPageText[]>([]);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(true);
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);
  const [pdfScale, setPdfScale] = useState<number>(1.0);
  const [canvasDimensions, setCanvasDimensions] = useState<RenderDimensions | null>(null);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [showThumbnailSidebar, setShowThumbnailSidebar] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentTheme = PAPER_THEMES[settings.paperTone];

  // 1. Load PDF document
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingPdf(true);

    loadPDFDocument(book.url, book.id)
      .then(async (handle) => {
        if (isCancelled) return;
        setPdfHandle(handle);
        setTotalPages(handle.numPages);
        setIsLoadingPdf(false);

        // Extract text in background without blocking PDF rendering
        try {
          const extracted = await extractAllTextFromPDF(handle.pdfDocument);
          if (!isCancelled) {
            setExtractedPages(extracted);
          }
        } catch (err) {
          console.warn('Background text extraction note:', err);
        }
      })
      .catch((err) => {
        console.error('Error loading PDF document:', err);
        if (!isCancelled) setIsLoadingPdf(false);
      });

    return () => {
      isCancelled = true;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [book.url, book.id]);

  // Initial auto-fit check on mount so paper fits comfortably in viewport
  useEffect(() => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      if (containerWidth < 680) {
        const availableWidth = Math.max(300, containerWidth - 48);
        const autoScale = Math.max(0.45, Math.min(2.0, availableWidth / 595));
        setPdfScale(Number(autoScale.toFixed(2)));
      }
    }
  }, []);

  // 2. Render PDF Page on canvas with high-DPI supersampling vector clarity
  const renderCurrentPage = useCallback(async () => {
    if (mode !== 'pdf' || !pdfHandle || !canvasRef.current) return;

    setIsRenderingPage(true);
    try {
      const dimensions = await renderPDFPageToCanvas(
        pdfHandle.pdfDocument,
        currentPage,
        canvasRef.current,
        pdfScale
      );
      setCanvasDimensions(dimensions);
    } catch (err) {
      console.error('Error rendering canvas page:', err);
    } finally {
      setIsRenderingPage(false);
    }
  }, [mode, pdfHandle, currentPage, pdfScale]);

  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  // Track progress
  const lastReportedPageRef = useRef<number>(book.lastReadPage || 1);
  const onUpdateProgressRef = useRef(onUpdateProgress);
  useEffect(() => {
    onUpdateProgressRef.current = onUpdateProgress;
  }, [onUpdateProgress]);

  useEffect(() => {
    if (lastReportedPageRef.current !== currentPage) {
      lastReportedPageRef.current = currentPage;
      onUpdateProgressRef.current(book.id, currentPage);
    }
  }, [currentPage, book.id]);

  // Auto-fit PDF width to current viewport
  const handleFitWidth = () => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      // Standard A4 width is 595.28 points; leave comfortable margins
      const availableWidth = Math.max(300, containerWidth - 48);
      const targetScale = Math.max(0.4, Math.min(3.0, availableWidth / 595));
      setPdfScale(Number(targetScale.toFixed(2)));
    } else {
      setPdfScale(1.0);
    }
  };

  // Auto-fit PDF full page to current viewport height
  const handleFitPage = () => {
    if (scrollContainerRef.current) {
      const containerHeight = scrollContainerRef.current.clientHeight;
      // Standard A4 height is 841.89 points; leave space for headers & padding
      const availableHeight = Math.max(380, containerHeight - 120);
      const targetScale = Math.max(0.4, Math.min(2.5, availableHeight / 842));
      setPdfScale(Number(targetScale.toFixed(2)));
    } else {
      setPdfScale(0.9);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPage(currentPage - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goToPage(currentPage + 1);
      } else if (e.key === 'Escape') {
        setShowSettingsDrawer(false);
        setShowThumbnailSidebar(false);
      } else if (e.key === '+' || e.key === '=') {
        setPdfScale((s) => Math.min(2.5, Number((s + 0.15).toFixed(2))));
      } else if (e.key === '-') {
        setPdfScale((s) => Math.max(0.5, Number((s - 0.15).toFixed(2))));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

  // Handle Speech Synthesis
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const currentPageText =
      extractedPages.find((p) => p.pageNumber === currentPage)?.text ||
      extractedPages[0]?.text ||
      '';

    if (!currentPageText.trim()) return;

    const utterance = new SpeechSynthesisUtterance(currentPageText);
    utterance.lang = 'it-IT';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Copy extracted text
  const handleCopyCurrentPageText = () => {
    const pageText = extractedPages.find((p) => p.pageNumber === currentPage)?.text || '';
    if (!pageText) return;
    navigator.clipboard.writeText(pageText).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    });
  };

  // Export full extracted text as .txt file
  const handleExportTxt = () => {
    if (extractedPages.length === 0) return;
    const fullText = extractedPages
      .map(
        (p) =>
          `═══════════════════════════════════════════════\n${book.title} — Pagina ${p.pageNumber}\n═══════════════════════════════════════════════\n\n${p.text}\n\n`
      )
      .join('\n');

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${book.title.replace(/[\s\W-]+/g, '_')}_testo_estratto.txt`;
    link.click();
  };

  // Page navigation
  const goToPage = (page: number) => {
    const valid = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(valid);
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const currentPageData = extractedPages.find((p) => p.pageNumber === currentPage);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#1e1711] text-[#e8dfd5] flex flex-col overflow-hidden selection:bg-[#c29868]/30 selection:text-[#f3ede2]"
    >
      {/* =========================================================================
          PERMANENT PINNED TOP HEADER BAR (ALWAYS VISIBLE & COMPLETE)
          ========================================================================= */}
      <header className="shrink-0 z-30 bg-[#261e16] border-b border-[#3f3122] shadow-lg flex flex-col">
        {/* ROW 1: MASTER TOP BAR */}
        <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Left: Back to Library & Book Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBackToLibrary}
              className="flex items-center gap-1.5 text-xs font-serif font-semibold text-[#f5ebd8] bg-[#3a2d20] hover:bg-[#4d3c2b] active:bg-[#2b2116] px-3 py-1.5 rounded transition-all border border-[#5d4936] shrink-0 shadow-xs cursor-pointer"
              title="Torna alla Libreria"
            >
              <ArrowLeft className="w-4 h-4 text-[#dec4a6]" />
              <span className="inline">Libreria</span>
            </button>

            <div className="truncate">
              <h2 className="text-xs sm:text-sm font-serif font-bold text-[#f5ebd8] truncate">
                {book.title}
              </h2>
              <p className="text-[11px] text-[#baa48f] font-serif truncate">
                {book.author} · Pagina {currentPage} di {totalPages}
              </p>
            </div>
          </div>

          {/* Center: DUAL READING MODE SWITCHER */}
          <div className="flex items-center gap-1 bg-[#17110c] p-1 rounded-md border border-[#3e3022] shrink-0 shadow-inner">
            <button
              onClick={() => setMode('pdf')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-serif transition-colors cursor-pointer ${
                mode === 'pdf'
                  ? 'bg-[#403123] text-[#f8ede0] shadow-sm font-bold border border-[#745d44]'
                  : 'text-[#8f7e6f] hover:text-[#dcd0c2]'
              }`}
              title="Visualizzazione Originale del Documento PDF ad alta nitidezza"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#e5caa8]" />
              <span className="inline">Documento PDF</span>
            </button>

            <button
              onClick={() => setMode('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-serif transition-colors cursor-pointer ${
                mode === 'text'
                  ? 'bg-[#d1a877] text-[#221a12] shadow-sm font-bold border border-[#f0c896]'
                  : 'text-[#8f7e6f] hover:text-[#dcd0c2]'
              }`}
              title="Visualizzazione Testo Naturale ad alto comfort"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Testo Estratto</span>
            </button>
          </div>

          {/* Right: Drawer Toggles & Quick Tools */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Thumbnail sidebar toggle */}
            <button
              onClick={() => setShowThumbnailSidebar(!showThumbnailSidebar)}
              className={`p-2 rounded text-xs transition-colors border cursor-pointer flex items-center gap-1.5 ${
                showThumbnailSidebar
                  ? 'bg-[#4a3a2a] text-[#f8ede0] border-[#caa783]'
                  : 'bg-[#312519] text-[#cbb6a1] hover:text-[#f5ebd8] border-[#483726]'
              }`}
              title="Indice Fogli e Miniature"
            >
              <Sidebar className="w-4 h-4" />
              <span className="hidden lg:inline text-xs font-serif">Indice Fogli</span>
            </button>

            {/* Paper Theme / Preferences Drawer toggle */}
            <button
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              className={`p-2 rounded text-xs transition-colors border cursor-pointer flex items-center gap-1.5 ${
                showSettingsDrawer
                  ? 'bg-[#4a3a2a] text-[#f8ede0] border-[#caa783]'
                  : 'bg-[#312519] text-[#cbb6a1] hover:text-[#f5ebd8] border-[#483726]'
              }`}
              title="Tonalità Carta e Preferenze"
            >
              <Sliders className="w-4 h-4" />
              <span className="hidden lg:inline text-xs font-serif">Tonalità</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded text-xs bg-[#312519] text-[#cbb6a1] hover:text-[#f5ebd8] border border-[#483726] transition-colors cursor-pointer hidden md:flex"
              title="Schermo Intero"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
            </button>

            {/* Quick Add PDF button */}
            {onAddPdf && (
              <button
                onClick={onAddPdf}
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-bold text-[#201811] bg-[#d1a877] hover:bg-[#e0ba8a] rounded transition-colors shadow-xs border border-[#f0c896] cursor-pointer"
                title="Aggiungi o apri un altro PDF"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Aggiungi PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* ROW 2: PERMANENT READER NAVIGATION & ZOOM BAR */}
        <div className="px-3 sm:px-6 py-2 bg-[#201812] border-t border-[#35281b] flex items-center justify-between gap-3 text-xs text-[#b8a695] overflow-x-auto">
          {/* Left: Page Turn Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#31251a] hover:bg-[#433324] disabled:opacity-30 disabled:hover:bg-[#31251a] text-[#f2e6d9] transition-colors border border-[#4d3a28] cursor-pointer font-serif"
              title="Foglio precedente (Tasto Freccia Sinistra)"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Precedente</span>
            </button>

            <div className="flex items-center gap-1.5 font-serif px-1">
              <span>Foglio</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) goToPage(val);
                }}
                className="w-12 bg-[#17110c] border border-[#4d3a28] rounded text-center py-1 text-xs text-[#f5ebd8] font-mono outline-none focus:border-[#caa783]"
              />
              <span>di {totalPages}</span>
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#31251a] hover:bg-[#433324] disabled:opacity-30 disabled:hover:bg-[#31251a] text-[#f2e6d9] transition-colors border border-[#4d3a28] cursor-pointer font-serif"
              title="Foglio successivo (Tasto Freccia Destra)"
            >
              <span className="hidden sm:inline">Successivo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Center: In-text Search Bar */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7d6b5b]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca parole..."
                className="bg-[#17110c] border border-[#3e3022] text-[#e8dfd5] text-xs rounded pl-8 pr-3 py-1 outline-none focus:border-[#caa783] w-32 sm:w-48 placeholder:text-[#6e5d4e]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8e7a68] hover:text-[#eddcc8] text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right: Mode-Specific Tools (Zoom for PDF, Export for Text) */}
          <div className="flex items-center gap-2 shrink-0">
            {mode === 'pdf' ? (
              <div className="flex items-center gap-1.5 bg-[#17110c] p-1 rounded border border-[#3d2f21]">
                {/* Zoom Out Button */}
                <button
                  onClick={() => setPdfScale((s) => Math.max(0.5, Number((s - 0.15).toFixed(2))))}
                  className="p-1 text-[#bda995] hover:text-[#f5ebd8] hover:bg-[#2b2117] rounded transition-colors cursor-pointer"
                  title="Rimpicciolisci zoom"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                {/* Zoom percentage display */}
                <span className="font-mono text-xs px-1.5 text-[#f0dfcc] min-w-[44px] text-center font-bold">
                  {Math.round(pdfScale * 100)}%
                </span>

                {/* Zoom In Button */}
                <button
                  onClick={() => setPdfScale((s) => Math.min(2.5, Number((s + 0.15).toFixed(2))))}
                  className="p-1 text-[#bda995] hover:text-[#f5ebd8] hover:bg-[#2b2117] rounded transition-colors cursor-pointer"
                  title="Ingrandisci zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <div className="h-3.5 w-[1px] bg-[#3a2d21] mx-0.5" />

                {/* Preset Scale: Reset 100% */}
                <button
                  onClick={() => setPdfScale(1.0)}
                  className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors cursor-pointer ${
                    Math.round(pdfScale * 100) === 100
                      ? 'bg-[#3f3123] text-[#f5ebd8] font-bold border border-[#6b553e]'
                      : 'text-[#8e7a68] hover:text-[#d3c0ad]'
                  }`}
                  title="Dimensione standard 100%"
                >
                  100%
                </button>

                {/* Auto Fit Width */}
                <button
                  onClick={handleFitWidth}
                  className="px-2 py-0.5 text-[11px] font-serif rounded transition-colors text-[#c4b19e] hover:text-[#f5ebd8] hover:bg-[#2b2117] cursor-pointer flex items-center gap-1"
                  title="Adatta alla larghezza dello schermo"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span className="hidden md:inline">Larghezza</span>
                </button>

                {/* Auto Fit Page */}
                <button
                  onClick={handleFitPage}
                  className="px-2 py-0.5 text-[11px] font-serif rounded transition-colors text-[#c4b19e] hover:text-[#f5ebd8] hover:bg-[#2b2117] cursor-pointer hidden sm:flex items-center gap-1"
                  title="Adatta l'intero foglio alla finestra"
                >
                  <span>Pagina</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Speech TTS */}
                <button
                  onClick={handleToggleSpeech}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors border cursor-pointer ${
                    isSpeaking
                      ? 'bg-[#9f7d54] text-[#1c1611] border-[#cbb6a1]'
                      : 'bg-[#2b2016] text-[#cbb6a1] hover:text-[#f3e5d7] border-[#4e3c2c]'
                  }`}
                  title={isSpeaking ? 'Pausa Lettura Vocale' : 'Ascolta con Voce Naturale'}
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{isSpeaking ? 'In ascolto...' : 'Ascolta'}</span>
                </button>

                {/* Copy text */}
                <button
                  onClick={handleCopyCurrentPageText}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#2b2016] hover:bg-[#3d2e21] text-[#cbb6a1] rounded text-xs border border-[#483726] transition-colors cursor-pointer"
                  title="Copia testo della pagina corrente"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-[#7db574]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copiedText ? 'Copiato!' : 'Copia'}</span>
                </button>

                {/* Export text */}
                <button
                  onClick={handleExportTxt}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#2b2016] hover:bg-[#3d2e21] text-[#cbb6a1] rounded text-xs border border-[#483726] transition-colors cursor-pointer"
                  title="Scarica intero testo estratto in formato .txt"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Esporta .txt</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN CENTRAL VIEWPORT
          ========================================================================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Thumbnails Sidebar Drawer */}
        {showThumbnailSidebar && (
          <aside className="w-64 bg-[#1e1610] border-r border-[#3a2d20] flex flex-col shrink-0 overflow-y-auto p-3 space-y-2 z-20 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#35281c] text-xs">
              <span className="font-serif text-[#caa783] font-semibold">Indice Fogli ({totalPages})</span>
              <button
                onClick={() => setShowThumbnailSidebar(false)}
                className="text-[#8e7a68] hover:text-[#eddcc8] text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {Array.from({ length: totalPages }).map((_, index) => {
              const pNum = index + 1;
              const isSelected = pNum === currentPage;
              const pageSnippet = extractedPages.find((p) => p.pageNumber === pNum)?.paragraphs[0] || '';

              return (
                <div
                  key={`thumb-${pNum}`}
                  onClick={() => goToPage(pNum)}
                  className={`p-2.5 rounded cursor-pointer transition-all border text-left ${
                    isSelected
                      ? 'bg-[#3b2d1f] border-[#caa783] text-[#f5ebde] shadow-xs ring-1 ring-[#caa783]/40'
                      : 'bg-[#18120d] border-[#2e2318] text-[#8e7a68] hover:border-[#523f2d] hover:text-[#cfbea9]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className={isSelected ? 'text-[#e8cca9] font-bold' : ''}>
                      Foglio {pNum}
                    </span>
                    {isSelected && <span className="text-[9px] text-[#caa783]">● In lettura</span>}
                  </div>
                  {pageSnippet && (
                    <p className="text-[10px] font-serif line-clamp-2 mt-1 opacity-80 leading-snug">
                      {pageSnippet}
                    </p>
                  )}
                </div>
              );
            })}
          </aside>
        )}

        {/* Right Settings Drawer */}
        {showSettingsDrawer && (
          <aside className="absolute right-0 top-0 bottom-0 w-80 bg-[#1e1610] border-l border-[#3a2d20] p-6 shadow-2xl z-30 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#35281c]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#caa783]" />
                <h4 className="font-serif font-medium text-[#f0e4d6] text-sm">
                  Preferenze Foglio & Lettura
                </h4>
              </div>
              <button
                onClick={() => setShowSettingsDrawer(false)}
                className="text-[#8e7a68] hover:text-[#eddcc8] text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Paper tone selector */}
            <div className="space-y-3">
              <label className="text-xs font-serif text-[#caa783] block">
                Tonalità del Foglio Naturale
              </label>
              <div className="space-y-2">
                {(Object.keys(PAPER_THEMES) as PaperTone[]).map((key) => {
                  const t = PAPER_THEMES[key];
                  const isSelected = settings.paperTone === key;
                  return (
                    <div
                      key={key}
                      onClick={() => onUpdateSettings({ ...settings, paperTone: key })}
                      style={{ backgroundColor: t.bg, color: t.text, borderColor: t.border }}
                      className={`p-3 rounded-md border-2 cursor-pointer transition-all flex items-center justify-between shadow-xs ${
                        isSelected ? 'ring-2 ring-[#c5a06d]' : 'opacity-85 hover:opacity-100'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-serif font-bold">{t.name}</p>
                        <p className="text-[10px] opacity-75 mt-0.5">{t.description}</p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 shrink-0 text-[#85633e]" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Font Family (for text mode) */}
            <div className="space-y-2 pt-3 border-t border-[#35281c]">
              <label className="text-xs font-serif text-[#caa783] block">Carattere Tipografico (Testo Estratto)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateSettings({ ...settings, fontFamily: 'serif' })}
                  className={`p-2.5 rounded text-xs font-serif transition-colors border cursor-pointer ${
                    settings.fontFamily === 'serif'
                      ? 'bg-[#3c2f21] border-[#caa783] text-[#f2e6d9] font-bold'
                      : 'bg-[#18120d] border-[#312519] text-[#9a8674]'
                  }`}
                >
                  Garamond / Lora
                </button>
                <button
                  onClick={() => onUpdateSettings({ ...settings, fontFamily: 'sans' })}
                  className={`p-2.5 rounded text-xs font-sans transition-colors border cursor-pointer ${
                    settings.fontFamily === 'sans'
                      ? 'bg-[#3c2f21] border-[#caa783] text-[#f2e6d9] font-bold'
                      : 'bg-[#18120d] border-[#312519] text-[#9a8674]'
                  }`}
                >
                  Sans Naturale
                </button>
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-2 pt-3 border-t border-[#35281c]">
              <div className="flex items-center justify-between text-xs font-serif text-[#caa783]">
                <span>Dimensione Carattere (Testo Estratto)</span>
                <span className="font-mono">{settings.fontSize}px</span>
              </div>
              <input
                type="range"
                min={14}
                max={26}
                step={1}
                value={settings.fontSize}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, fontSize: parseInt(e.target.value, 10) })
                }
                className="w-full accent-[#caa783] cursor-pointer"
              />
            </div>
          </aside>
        )}

        {/* Central Viewport with Dedicated Smooth Scrolling */}
        <main
          ref={scrollContainerRef}
          className="flex-1 overflow-auto p-4 sm:p-8 flex flex-col items-center justify-start min-h-0 bg-[#1c150e] relative"
        >
          {isLoadingPdf ? (
            <div className="my-auto text-center space-y-3 py-16">
              <div className="w-10 h-10 border-3 border-[#caa783] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-serif text-[#f0dfcc] text-base font-medium">
                Caricamento volume in corso...
              </p>
              <p className="text-xs text-[#8f7e6f] font-mono">Preparazione visualizzazione naturale</p>
            </div>
          ) : mode === 'pdf' ? (
            /* =========================================================================
               MODE 1: PDF ORIGINAL DOCUMENT FACSIMILE (RAZOR-SHARP HIGH-DPI CANVAS)
               ========================================================================= */
            <div className="flex flex-col items-center max-w-full space-y-6 pb-16">
              {/* Natural Physical Paper Sheet Container */}
              <div
                className="paper-sheet-shadow rounded-sm transition-all overflow-visible border"
                style={{
                  backgroundColor: currentTheme.bg,
                  borderColor: currentTheme.border,
                }}
              >
                {/* Natural Top Margin Running Header */}
                <div
                  className="px-4 sm:px-8 py-2.5 border-b flex items-center justify-between text-[11px] font-serif select-none"
                  style={{
                    color: currentTheme.metaText,
                    borderColor: currentTheme.border,
                  }}
                >
                  <span className="italic font-medium truncate max-w-[200px] sm:max-w-md">
                    {book.title}
                  </span>
                  <span className="font-mono shrink-0">
                    Foglio {currentPage} di {totalPages}
                  </span>
                </div>

                {/* PDF Page Canvas with High-DPI Super-sampled Vector Rendering */}
                <div className="p-2 sm:p-5 overflow-visible flex items-center justify-center bg-transparent">
                  <canvas
                    ref={canvasRef}
                    style={{
                      display: 'block',
                      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.45)',
                      opacity: isRenderingPage ? 0.7 : 1,
                      filter: settings.paperTone === 'notte' ? 'invert(0.88) hue-rotate(180deg)' : undefined,
                      transition: 'opacity 0.15s ease',
                    }}
                    className="rounded-xs"
                  />
                </div>

                {/* Natural Bottom Margin Footer */}
                <div
                  className="px-4 sm:px-8 py-2.5 border-t text-center text-[10px] font-serif select-none"
                  style={{
                    color: currentTheme.metaText,
                    borderColor: currentTheme.border,
                  }}
                >
                  — Foglio {currentPage} —
                </div>
              </div>

              {/* Bottom Clean Navigation Controls (Unobtrusive & Below the Sheet) */}
              <div className="flex items-center gap-3 text-xs font-serif text-[#baa794] pb-4 pt-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 bg-[#2d2218] hover:bg-[#3d2f21] active:bg-[#1f1710] disabled:opacity-30 rounded-md border border-[#4d3a28] transition-colors cursor-pointer text-[#f2e6d9] flex items-center gap-1.5 shadow-xs"
                  title="Foglio Precedente (o Freccia Sinistra della tastiera)"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Foglio Precedente</span>
                </button>
                <div className="px-3 py-1.5 bg-[#201811] rounded border border-[#3e2e1e] font-mono text-[#ecd8c3] font-bold text-xs">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 bg-[#2d2218] hover:bg-[#3d2f21] active:bg-[#1f1710] disabled:opacity-30 rounded-md border border-[#4d3a28] transition-colors cursor-pointer text-[#f2e6d9] flex items-center gap-1.5 shadow-xs"
                  title="Foglio Successivo (o Freccia Destra della tastiera)"
                >
                  <span>Foglio Successivo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* =========================================================================
               MODE 2: NATURAL EXTRACTED TEXT SHEET (OPTIONAL SECONDARY VIEW)
               ========================================================================= */
            <div
              className={`w-full transition-all duration-300 pb-16 ${
                settings.columnWidth === 'narrow'
                  ? 'max-w-[620px]'
                  : settings.columnWidth === 'wide'
                  ? 'max-w-[880px]'
                  : 'max-w-[720px]'
              }`}
            >
              {/* Natural Physical Paper Sheet Container */}
              <article
                className="paper-sheet-shadow rounded-sm p-6 sm:p-14 lg:p-16 border transition-colors select-text relative"
                style={{
                  backgroundColor: currentTheme.bg,
                  color: currentTheme.text,
                  borderColor: currentTheme.border,
                  fontFamily: settings.fontFamily === 'serif' ? 'var(--font-serif)' : 'var(--font-sans)',
                  fontSize: `${settings.fontSize}px`,
                  lineHeight: settings.lineHeight,
                }}
              >
                {/* Natural Paper Texture Running Header */}
                <header
                  className="pb-4 mb-6 border-b flex items-center justify-between text-xs tracking-wider select-none"
                  style={{
                    borderColor: currentTheme.border,
                    color: currentTheme.metaText,
                  }}
                >
                  <span className="uppercase font-mono text-[10px]">Foglio d'Archivio</span>
                  <span className="font-mono text-[10px]">
                    Pagina {currentPage} di {totalPages}
                  </span>
                </header>

                {/* Chapter or Book Title on Page 1 */}
                {currentPage === 1 && (
                  <div className="mb-8 text-center space-y-2">
                    <h1 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight text-balance">
                      {book.title}
                    </h1>
                    <p className="text-sm sm:text-base italic opacity-85">di {book.author}</p>
                    <div
                      className="w-16 h-0.5 mx-auto my-4 opacity-50"
                      style={{ backgroundColor: currentTheme.text }}
                    />
                  </div>
                )}

                {/* Main Extracted Text Flow */}
                {currentPageData && currentPageData.paragraphs.length > 0 ? (
                  <div className="space-y-6">
                    {currentPageData.paragraphs.map((para, pIdx) => {
                      let renderedText: React.ReactNode = para;
                      if (searchQuery.trim().length > 1) {
                        const parts = para.split(new RegExp(`(${searchQuery})`, 'gi'));
                        renderedText = parts.map((part, i) =>
                          part.toLowerCase() === searchQuery.toLowerCase() ? (
                            <mark
                              key={i}
                              className="bg-[#d4af37]/35 text-inherit px-0.5 rounded-xs"
                            >
                              {part}
                            </mark>
                          ) : (
                            part
                          )
                        );
                      }

                      const isFirst = pIdx === 0 && para.length > 50 && currentPage === 1;

                      return (
                        <p
                          key={`p-${pIdx}`}
                          className={`text-justify leading-relaxed ${
                            isFirst
                              ? 'first-letter:text-5xl first-letter:font-serif first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:leading-none'
                              : 'indent-6 sm:indent-8'
                          }`}
                        >
                          {renderedText}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center opacity-70 space-y-3">
                    <p className="font-serif italic text-sm">
                      {isLoadingPdf
                        ? 'Estrazione del testo in corso...'
                        : 'Questo foglio contiene illustrazioni o testo nativo in PDF.'}
                    </p>
                    <button
                      onClick={() => setMode('pdf')}
                      className="px-4 py-2 bg-[#3a2d20] hover:bg-[#493a2b] text-[#ecd8c4] rounded text-xs font-serif border border-[#5a4837] cursor-pointer"
                    >
                      Visualizza Documento PDF
                    </button>
                  </div>
                )}

                {/* Natural Paper Sheet Footer */}
                <footer
                  className="mt-12 pt-4 border-t flex items-center justify-between text-xs select-none"
                  style={{
                    borderColor: currentTheme.border,
                    color: currentTheme.metaText,
                  }}
                >
                  <span className="italic truncate max-w-[200px]">{book.filename}</span>
                  <span className="font-serif font-medium">— Pagina {currentPage} —</span>
                </footer>
              </article>

              {/* Seamless Bottom Navigation */}
              <div className="mt-8 flex items-center justify-between gap-4 text-xs font-serif text-[#baa794]">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 bg-[#2d2218] hover:bg-[#3d2f21] disabled:opacity-30 rounded border border-[#4d3a28] transition-colors flex items-center gap-2 cursor-pointer text-[#f2e6d9]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Foglio Precedente</span>
                </button>

                <div className="text-center font-mono text-[11px] text-[#dec4a6]">
                  Avanzamento: {Math.round((currentPage / totalPages) * 100)}%
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 bg-[#2d2218] hover:bg-[#3d2f21] disabled:opacity-30 rounded border border-[#4d3a28] transition-colors flex items-center gap-2 cursor-pointer text-[#f2e6d9]"
                >
                  <span>Foglio Successivo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
