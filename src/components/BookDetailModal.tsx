import React, { useEffect } from 'react';
import { Book } from '../types/book';
import { X, BookOpen, FileText, Trash2, Folder, Check } from 'lucide-react';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
  onReadBook: (book: Book, mode: 'pdf' | 'text') => void;
  onDeleteCustomBook?: (bookId: string) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  onClose,
  onReadBook,
  onDeleteCustomBook,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!book) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [book, onClose]);

  if (!book) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#120d09]/85 backdrop-blur-xs transition-opacity duration-200 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl sm:max-w-2xl bg-[#251d16] border border-[#52412f] rounded-lg shadow-2xl text-[#e8dfd5] flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Pinned Header */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-[#3c2f21] bg-[#1e1711]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] uppercase tracking-wider text-[#ad957e] font-serif shrink-0">
              Volume d'Archivio
            </span>
            <span aria-hidden="true" className="text-[#594634]">·</span>
            <span className="text-[11px] text-[#8e7a68] font-mono truncate">{book.filename}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#a89582] hover:text-[#f3e5d7] hover:bg-[#34271c] rounded transition-colors shrink-0"
            title="Chiudi (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Middle Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
            
            {/* Visual Book Presentation (Compact) */}
            <div className="w-32 sm:w-40 aspect-[3/4] shrink-0 mx-auto sm:mx-0 rounded-md overflow-hidden shadow-lg border border-[#483726] bg-[#17110c] relative">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full p-3 flex flex-col justify-between text-[#ecd8c4]"
                  style={{ backgroundColor: book.spineColor }}
                >
                  <div className="border border-[#ffffff]/20 h-full p-2.5 flex flex-col justify-between">
                    <div>
                      <p className="text-[9px] uppercase font-mono tracking-wider opacity-80">{book.category}</p>
                      <h4 className="font-serif font-bold text-xs mt-1 text-[#ffffff]">{book.title}</h4>
                      <p className="font-serif text-[10px] italic mt-0.5 text-[#ecd8c4]">{book.author}</p>
                    </div>
                    <p className="text-[9px] text-right opacity-70 font-mono">{book.pageCount} pag.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Information Details */}
            <div className="flex-1 space-y-3 min-w-0">
              <div>
                <span className="text-xs text-[#a48e78] font-serif">{book.category}</span>
                <h2 className="text-xl sm:text-2xl font-serif font-medium text-[#f5ebde] leading-snug">
                  {book.title}
                </h2>
                <p className="text-xs sm:text-sm font-serif italic text-[#cbb6a1] mt-0.5">
                  di {book.author} {book.year ? `(${book.year})` : ''}
                </p>
              </div>

              <div className="pt-2 border-t border-[#382b1e]">
                <h4 className="text-[11px] uppercase tracking-wider text-[#99836e] font-serif mb-1">
                  Descrizione
                </h4>
                <p className="text-xs sm:text-sm text-[#baa998] font-serif leading-relaxed">
                  {book.description}
                </p>
              </div>

              {/* Attributes list */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div className="bg-[#1b150f] p-2 rounded border border-[#34271c]">
                  <span className="text-[#7d6c5d] block text-[10px] uppercase font-mono">Pagine</span>
                  <span className="text-[#edd8c4] font-serif font-medium">{book.pageCount} fogli</span>
                </div>
                <div className="bg-[#1b150f] p-2 rounded border border-[#34271c]">
                  <span className="text-[#7d6c5d] block text-[10px] uppercase font-mono">Posizione</span>
                  <span className="text-[#edd8c4] font-mono text-[11px] truncate block" title={book.url}>
                    {book.url}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Delete book option */}
          {onDeleteCustomBook && (
            <div className="pt-2 text-right border-t border-[#382b1e]">
              <button
                onClick={() => onDeleteCustomBook(book.id)}
                className="inline-flex items-center gap-1.5 text-xs text-[#a95751] hover:text-[#c46962] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Rimuovi questo PDF dalla libreria</span>
              </button>
            </div>
          )}
        </div>

        {/* PINNED ALWAYS-VISIBLE FOOTER ACTION BAR */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-[#3c2f21] bg-[#1e1711] space-y-2">
          <p className="text-[11px] text-[#a48f7d] font-serif text-center sm:text-left">
            Scegli come consultare il volume:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Primary Action 1: PDF Document Mode */}
            <button
              onClick={() => onReadBook(book, 'pdf')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#d1a877] hover:bg-[#dfb785] active:bg-[#c29868] text-[#221a13] rounded-md transition-colors text-xs sm:text-sm font-serif font-bold shadow-md border border-[#e2c199]/40 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#221a13]" />
              <span>Leggi Documento PDF</span>
            </button>

            {/* Secondary Action 2: Extracted Text Mode */}
            <button
              onClick={() => onReadBook(book, 'text')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#34271c] hover:bg-[#433224] text-[#ede0d2] rounded-md transition-colors border border-[#5a4431] text-xs sm:text-sm font-serif font-medium shadow-sm cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#dec4a6]" />
              <span>Testo Estratto</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
