import React from 'react';
import { Plus, BookOpen } from 'lucide-react';

interface HeaderProps {
  onAddPdf: () => void;
  activeSection: string;
  onNavigate: (section: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onAddPdf, activeSection, onNavigate }) => {
  return (
    <header className="sticky top-0 z-40 bg-[#28211a] border-b border-[#43372c] text-[#e8dfd5] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded bg-[#3d3126] border border-[#5a4837] flex items-center justify-center text-[#d1a877] font-serif text-base font-bold shadow-inner">
            <BookOpen className="w-4 h-4" />
          </div>
          <button
            onClick={() => onNavigate('scaffali')}
            className="text-base sm:text-lg font-serif font-semibold tracking-wide text-[#eddcc8] hover:text-[#f7e9da] transition-colors whitespace-nowrap shrink-0 text-left"
          >
            Biblioteca PDF
          </button>
        </div>

        {/* Zone 2: Minimal single-line text navigation links */}
        <nav className="hidden sm:flex items-center gap-6 text-xs sm:text-sm font-medium text-[#b5a392]">
          <button
            onClick={() => onNavigate('scaffali')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeSection === 'scaffali' ? 'text-[#eddcc8] font-semibold underline underline-offset-8 decoration-[#9f7d54]' : 'hover:text-[#e8dfd5]'
            }`}
          >
            Scaffale Libri
          </button>
          <button
            onClick={() => onNavigate('pubblici')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeSection === 'pubblici' ? 'text-[#eddcc8] font-semibold underline underline-offset-8 decoration-[#9f7d54]' : 'hover:text-[#e8dfd5]'
            }`}
          >
            Cartella /public
          </button>
        </nav>

        {/* Zone 3: ALWAYS VISIBLE HIGH-CONTRAST PRIMARY ACTION BUTTON */}
        <div className="flex items-center shrink-0 z-20">
          <button
            onClick={onAddPdf}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-serif font-bold text-[#201811] bg-[#d1a877] hover:bg-[#e0ba8a] active:bg-[#c29868] rounded-md transition-all whitespace-nowrap shadow-md border border-[#f0c896] hover:scale-102 cursor-pointer"
            title="Aggiungi o carica un nuovo PDF da collocare sulla libreria"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="inline">Aggiungi PDF</span>
          </button>
        </div>

      </div>
    </header>
  );
};
