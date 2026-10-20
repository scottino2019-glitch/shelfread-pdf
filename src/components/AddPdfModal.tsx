import React, { useState, useRef, useEffect } from 'react';
import { Book } from '../types/book';
import { loadPDFDocument } from '../services/pdfService';
import { savePdfToIndexedDB } from '../utils/pdfStorage';
import { X, UploadCloud, Folder, FileCheck, AlertCircle, Loader2, BookOpen } from 'lucide-react';

interface AddPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (book: Book) => void;
}

const WARM_SPINE_COLORS = [
  { spine: '#713b28', accent: '#d4af37', label: 'Cuoio Terracotta' },
  { spine: '#2a4d3b', accent: '#deb887', label: 'Tela Verde Bosco' },
  { spine: '#4c262d', accent: '#e0c080', label: 'Bordeaux d’Epoca' },
  { spine: '#273646', accent: '#c8a96e', label: 'Inchiostro Blu Notte' },
  { spine: '#42362b', accent: '#d1af72', label: 'Noce Antico' },
  { spine: '#354332', accent: '#c5b382', label: 'Salvia Chiostro' },
];

const SUGGESTED_PUBLIC_FILES = [
  { path: '/books/il-principe-machiavelli.pdf', name: 'Il Principe — Niccolò Machiavelli' },
  { path: '/books/la-divina-commedia-inferno.pdf', name: 'La Divina Commedia: Inferno — Dante Alighieri' },
  { path: '/books/le-avventure-di-pinocchio.pdf', name: 'Le Avventure di Pinocchio — Carlo Collodi' },
  { path: '/books/antico-erbario-officinale.pdf', name: 'Antico Erbario Officinale — Frate Silvestro' },
  { path: '/books/dialogo-massimi-sistemi-galileo.pdf', name: 'Dialogo sopra i due massimi sistemi — Galileo' },
  { path: '/books/i-canti-leopardi.pdf', name: 'I Canti — Giacomo Leopardi' },
];

export const AddPdfModal: React.FC<AddPdfModalProps> = ({ isOpen, onClose, onAddBook }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'publicPath'>('upload');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publicPath, setPublicPath] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Il file selezionato non è un documento PDF valido (.pdf).');
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleSelectSuggested = (path: string, suggestedTitle: string) => {
    setPublicPath(path);
    if (!title) {
      const parts = suggestedTitle.split(' — ');
      setTitle(parts[0] || suggestedTitle);
      if (parts[1]) setAuthor(parts[1]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const bookId = `custom-${Date.now()}`;
      let finalUrl = '';
      let pageCount = 1;
      let fileSize = '0 KB';
      const colorScheme = WARM_SPINE_COLORS[selectedColorIndex];

      if (activeTab === 'upload') {
        if (!selectedFile) {
          setErrorMsg('Per favore seleziona un file PDF.');
          setIsLoading(false);
          return;
        }

        // 1. Store the file directly in IndexedDB for permanent offline persistence
        await savePdfToIndexedDB(bookId, selectedFile);
        finalUrl = `indexeddb://${bookId}`;

        // 2. Read arrayBuffer to extract page count with PDF.js
        const arrayBuffer = await selectedFile.arrayBuffer();
        const doc = await loadPDFDocument(new Uint8Array(arrayBuffer));
        pageCount = doc.numPages;
        fileSize = `${Math.max(1, Math.round(selectedFile.size / 1024))} KB`;
      } else {
        if (!publicPath.trim()) {
          setErrorMsg('Inserisci o seleziona un file PDF presente in /public.');
          setIsLoading(false);
          return;
        }

        let cleanPath = publicPath.trim();
        // Normalize common user path variations
        if (!cleanPath.startsWith('/')) {
          if (!cleanPath.startsWith('books/')) {
            cleanPath = `/books/${cleanPath}`;
          } else {
            cleanPath = `/${cleanPath}`;
          }
        }

        const doc = await loadPDFDocument(cleanPath);
        pageCount = doc.numPages;
        finalUrl = cleanPath;
        fileSize = 'File Public';
      }

      const newBook: Book = {
        id: bookId,
        title: title.trim() || (selectedFile ? selectedFile.name.replace('.pdf', '') : 'Documento PDF'),
        author: author.trim() || 'Documento Personale',
        year: new Date().getFullYear().toString(),
        category: 'Documento PDF',
        description: `Documento archiviato in biblioteca. ${pageCount} pagine.`,
        url: finalUrl,
        filename: selectedFile ? selectedFile.name : (publicPath.split('/').pop() || 'documento.pdf'),
        pageCount: pageCount,
        fileSize: fileSize,
        spineColor: colorScheme.spine,
        accentColor: colorScheme.accent,
        isCustom: true,
        lastReadPage: 1,
        progressPercent: 0,
        dateAdded: new Date().toLocaleDateString('it-IT'),
      };

      onAddBook(newBook);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        'Impossibile riconoscere o analizzare il file PDF. Verifica che il formato sia corretto e che il file sia leggibile.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#120d09]/85 backdrop-blur-xs transition-opacity duration-200 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#251d16] border border-[#52412f] rounded-lg shadow-2xl text-[#e8dfd5] flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Pinned Header */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-[#3c2f21] bg-[#1e1711]">
          <h3 className="font-serif font-medium text-[#f3e5d7] text-base sm:text-lg">
            Colloca PDF sullo Scaffale
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-[#a89582] hover:text-[#f3e5d7] hover:bg-[#34271c] rounded transition-colors cursor-pointer"
            title="Chiudi (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            
            {/* Method tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#1c1610] rounded-md border border-[#3b2e21]">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-[#3e3023] text-[#f2e6d9] shadow-xs'
                    : 'text-[#8a7765] hover:text-[#cbb9a7]'
                }`}
              >
                Carica File dal Computer
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('publicPath')}
                className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeTab === 'publicPath'
                    ? 'bg-[#3e3023] text-[#f2e6d9] shadow-xs'
                    : 'text-[#8a7765] hover:text-[#cbb9a7]'
                }`}
              >
                File in Cartella /public
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-[#421d1d]/80 border border-[#6b2a2a] text-[#f3c2c2] text-xs rounded">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#e67575]" />
                <span>{errorMsg}</span>
              </div>
            )}

            {activeTab === 'upload' ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#443526] hover:border-[#967551] rounded-lg p-5 text-center cursor-pointer transition-colors bg-[#1c1611]/50 hover:bg-[#231b14]"
                >
                  <UploadCloud className="w-7 h-7 mx-auto text-[#8e7b68] mb-1.5" />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-[#d1a877]">
                      <FileCheck className="w-4 h-4 text-[#78a872]" />
                      <span className="font-mono font-medium truncate max-w-xs">{selectedFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-serif text-[#eddcc8]">
                        Trascina o clicca per scegliere un documento PDF dal tuo dispositivo
                      </p>
                      <p className="text-[11px] text-[#7d6b5b] mt-0.5">Formato .pdf standard (salvataggio permanente)</p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-serif text-[#caa783] block">
                  Percorso file o selezione rapida dalla cartella public
                </label>
                <div className="relative">
                  <Folder className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7d6c5c]" />
                  <input
                    type="text"
                    value={publicPath}
                    onChange={(e) => setPublicPath(e.target.value)}
                    placeholder="/books/il-principe-machiavelli.pdf"
                    className="w-full bg-[#1b150f] border border-[#3e3124] focus:border-[#9f7d54] text-[#e8dfd5] text-xs rounded-md pl-9 pr-3 py-2 outline-none font-mono"
                  />
                </div>

                {/* Quick picker chips for public books */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] text-[#8e7a68] font-serif block">
                    Oppure tocca un volume presente in public/books/:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {SUGGESTED_PUBLIC_FILES.map((f) => (
                      <button
                        key={f.path}
                        type="button"
                        onClick={() => handleSelectSuggested(f.path, f.name)}
                        className={`text-left text-[11px] px-2 py-1.5 rounded border transition-colors flex items-center gap-1.5 truncate cursor-pointer ${
                          publicPath === f.path
                            ? 'bg-[#3e3023] border-[#caa783] text-[#f2e6d9]'
                            : 'bg-[#1e1711] border-[#382b1f] text-[#baa794] hover:border-[#624b35] hover:text-[#eedecf]'
                        }`}
                      >
                        <BookOpen className="w-3 h-3 shrink-0 text-[#caa783]" />
                        <span className="truncate">{f.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Book Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-serif text-[#caa783] block">Titolo Documento</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nome visualizzato sullo scaffale"
                  className="w-full bg-[#1b150f] border border-[#3e3124] focus:border-[#9f7d54] text-[#e8dfd5] text-xs rounded-md px-3 py-2 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-serif text-[#caa783] block">Autore o Origine (opzionale)</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="es. Autore o Documento Personale"
                  className="w-full bg-[#1b150f] border border-[#3e3124] focus:border-[#9f7d54] text-[#e8dfd5] text-xs rounded-md px-3 py-2 outline-none"
                />
              </div>
            </div>

            {/* Custom Spine Color for Wooden Shelf */}
            <div className="space-y-1.5 pt-2 border-t border-[#3c2f21]">
              <label className="text-xs font-serif text-[#caa783] block">
                Colore Dorso per lo Scaffale in Legno
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {WARM_SPINE_COLORS.map((c, i) => (
                  <button
                    key={c.spine}
                    type="button"
                    onClick={() => setSelectedColorIndex(i)}
                    style={{ backgroundColor: c.spine }}
                    className={`h-9 rounded border flex items-center justify-center transition-all cursor-pointer ${
                      selectedColorIndex === i
                        ? 'border-[#f2e6d9] ring-2 ring-[#d4af37] scale-105'
                        : 'border-[#4a3a2a] opacity-80 hover:opacity-100'
                    }`}
                    title={c.label}
                  >
                    <div
                      className="w-1.5 h-4 rounded-full"
                      style={{ backgroundColor: c.accent }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pinned Action Footer */}
          <div className="shrink-0 flex items-center justify-end gap-3 px-5 sm:px-6 py-3.5 border-t border-[#3c2f21] bg-[#1e1711]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-[#2d2218] hover:bg-[#3d2f21] text-xs text-[#cbb9a7] rounded transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-[#d1a877] hover:bg-[#dfb785] text-[#201811] text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analisi e Collocazione...</span>
                </>
              ) : (
                <span>Colloca sullo Scaffale</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
