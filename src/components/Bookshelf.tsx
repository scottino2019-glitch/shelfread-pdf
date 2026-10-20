import React, { useState, useRef } from 'react';
import { Book } from '../types/book';
import { Search, BookOpen, Layers, Plus, Trash2, ChevronLeft, ChevronRight, Info } from 'lucide-react';

interface BookshelfProps {
  books: Book[];
  onSelectBook: (book: Book, mode?: 'pdf' | 'text') => void;
  onOpenDetails: (book: Book) => void;
  onAddPdf: () => void;
  onDeleteBook: (bookId: string) => void;
}

export const Bookshelf: React.FC<BookshelfProps> = ({
  books,
  onSelectBook,
  onOpenDetails,
  onAddPdf,
  onDeleteBook,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'spine' | 'cover'>('spine');

  // Ref map for shelf horizontal scroll containers
  const shelfScrollRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Mouse drag-to-scroll state
  const dragInfoRef = useRef<{
    startX: number;
    scrollLeft: number;
    hasMoved: boolean;
    rowIndex: number;
  } | null>(null);

  const filteredBooks = books.filter((book) => {
    return (
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Organize books into generous shelves (e.g. up to 8-10 books per wooden shelf)
  const chunkSize = 8;
  const shelfRows: Book[][] = [];
  for (let i = 0; i < filteredBooks.length; i += chunkSize) {
    shelfRows.push(filteredBooks.slice(i, i + chunkSize));
  }
  if (shelfRows.length === 0) {
    shelfRows.push([]);
  }

  // Scroll a specific shelf left or right
  const scrollShelf = (rowIndex: number, direction: 'left' | 'right') => {
    const el = shelfScrollRefs.current[rowIndex];
    if (el) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Mouse drag-to-scroll handlers
  const handleMouseDown = (rowIndex: number, e: React.MouseEvent<HTMLDivElement>) => {
    const el = shelfScrollRefs.current[rowIndex];
    if (!el) return;
    dragInfoRef.current = {
      startX: e.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
      hasMoved: false,
      rowIndex,
    };
  };

  const handleMouseMove = (rowIndex: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragInfoRef.current || dragInfoRef.current.rowIndex !== rowIndex) return;
    const el = shelfScrollRefs.current[rowIndex];
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragInfoRef.current.startX) * 1.4;
    if (Math.abs(x - dragInfoRef.current.startX) > 4) {
      dragInfoRef.current.hasMoved = true;
    }
    el.scrollLeft = dragInfoRef.current.scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setTimeout(() => {
      dragInfoRef.current = null;
    }, 50);
  };

  // Handle wheel scrolling without hijacking vertical page scrolling
  const handleShelfWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.currentTarget.scrollLeft += e.deltaX;
    } else if (e.shiftKey) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="py-4 space-y-6">
      {/* Calm Shelf Top Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
        {/* Shelf Heading */}
        <div className="flex items-center gap-2">
          <span className="font-serif text-lg text-[#eddcc8] font-medium">
            Scaffale dei Libri
          </span>
          <span className="text-xs text-[#8f7e6f] font-mono">
            ({books.length} {books.length === 1 ? 'volume' : 'volumi'})
          </span>
        </div>

        {/* Quiet controls: Search & View Toggle */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#1c1611] p-1 rounded-md border border-[#3c3024]">
            <button
              onClick={() => setViewMode('spine')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-serif transition-colors cursor-pointer ${
                viewMode === 'spine'
                  ? 'bg-[#423427] text-[#f2e6d9] shadow-sm font-semibold'
                  : 'text-[#8e7b68] hover:text-[#d4c3b2]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dorso</span>
            </button>
            <button
              onClick={() => setViewMode('cover')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-serif transition-colors cursor-pointer ${
                viewMode === 'cover'
                  ? 'bg-[#423427] text-[#f2e6d9] shadow-sm font-semibold'
                  : 'text-[#8e7b68] hover:text-[#d4c3b2]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Copertina</span>
            </button>
          </div>

          {/* Minimal Search */}
          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7d6b5b]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca libro..."
              className="w-full bg-[#1b150f] border border-[#3e3124] focus:border-[#9f7d54] text-[#e8dfd5] text-xs rounded pl-8 pr-3 py-1.5 outline-none placeholder:text-[#6f5e4f]"
            />
          </div>
        </div>
      </div>

      {/* Main Wooden Shelves */}
      {filteredBooks.length === 0 && books.length > 0 ? (
        <div className="bg-[#241c15] border border-[#3a2d21] rounded-lg p-10 text-center space-y-3">
          <BookOpen className="w-8 h-8 mx-auto text-[#6f5e4f]" />
          <p className="text-sm font-serif text-[#dcd0c2]">Nessun libro trovato per questa ricerca.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-3 py-1.5 bg-[#3b2e23] text-xs text-[#eedecf] rounded hover:bg-[#48392c] transition-colors cursor-pointer"
          >
            Azzera
          </button>
        </div>
      ) : viewMode === 'spine' ? (
        /* Physical Wooden Shelves with Interactive Scrolling */
        <div className="space-y-10">
          {shelfRows.map((row, rowIndex) => (
            <div key={`shelf-${rowIndex}`} className="relative group/shelf">
              {/* Shelf Header Bar with Scroll Controls */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#17110c] border border-b-0 border-[#382b1f] rounded-t-md text-xs text-[#9f8976]">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-semibold text-[#dec4a6]">
                    Scaffale {rowIndex + 1}
                  </span>
                  <span className="text-[11px] font-mono opacity-70">
                    · {row.length} {row.length === 1 ? 'libro' : 'libri'}
                  </span>
                  <span className="hidden md:inline text-[10px] text-[#7a6755] ml-2">
                    (Usa la rotella o le frecce per scorrere)
                  </span>
                </div>

                {/* Shelf Scroll Navigation Arrows */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => scrollShelf(rowIndex, 'left')}
                    className="p-1 rounded bg-[#2b2016] hover:bg-[#3d2e21] text-[#dec4a6] border border-[#4a3928] transition-colors cursor-pointer"
                    title="Scorri a sinistra sullo scaffale"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollShelf(rowIndex, 'right')}
                    className="p-1 rounded bg-[#2b2016] hover:bg-[#3d2e21] text-[#dec4a6] border border-[#4a3928] transition-colors cursor-pointer"
                    title="Scorri a destra sullo scaffale"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Wooden Shelf Back Wall & Book Scroll Track */}
              <div
                ref={(el) => {
                  shelfScrollRefs.current[rowIndex] = el;
                }}
                onWheel={handleShelfWheel}
                onMouseDown={(e) => handleMouseDown(rowIndex, e)}
                onMouseMove={(e) => handleMouseMove(rowIndex, e)}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="relative bg-[#1c150e] border-x-4 border-[#382b1f] px-6 sm:px-10 pt-12 pb-4 min-h-[310px] flex items-end justify-start gap-6 sm:gap-9 overflow-x-auto overflow-y-hidden scroll-smooth select-none cursor-grab active:cursor-grabbing"
                style={{
                  scrollbarWidth: 'auto',
                  scrollbarColor: '#634b35 #1c150e',
                }}
              >
                {row.map((book, idx) => {
                  const spineHeights = [260, 275, 250, 280, 265];
                  const height = spineHeights[(rowIndex + idx) % spineHeights.length];
                  const width = 64;

                  return (
                    <div
                      key={book.id}
                      onClick={() => {
                        if (dragInfoRef.current?.hasMoved) return;
                        onSelectBook(book, 'pdf');
                      }}
                      style={{
                        height: `${height}px`,
                        width: `${width}px`,
                        backgroundColor: book.spineColor || '#5a2e22',
                      }}
                      className="group relative cursor-pointer rounded-t-sm transition-all duration-300 ease-out hover:-translate-y-4 hover:shadow-2xl shrink-0 book-spine-shadow flex flex-col justify-between p-2 text-[#edd8c4] border-t border-r border-[#ffffff]/20"
                      title={`Clicca per leggere: ${book.title} - ${book.author}`}
                    >
                      {/* Top Gilded Band */}
                      <div className="w-full pt-1">
                        <div
                          className="h-1 w-full rounded-sm opacity-80"
                          style={{ backgroundColor: book.accentColor || '#d4af37' }}
                        />
                        <div
                          className="h-0.5 w-full mt-0.5 rounded-sm opacity-50"
                          style={{ backgroundColor: book.accentColor || '#d4af37' }}
                        />
                        <span className="block text-[9px] font-mono tracking-tighter opacity-70 text-center mt-1">
                          {book.pageCount}P
                        </span>
                      </div>

                      {/* Middle Spine Title */}
                      <div className="flex-1 flex items-center justify-center my-2 overflow-hidden">
                        <span
                          className="font-serif text-[11px] font-semibold tracking-wider uppercase text-center leading-tight line-clamp-3 rotate-180 [writing-mode:vertical-rl] drop-shadow-sm opacity-95 group-hover:text-[#ffffff] transition-colors"
                          style={{ color: '#f7ede2' }}
                        >
                          {book.title}
                        </span>
                      </div>

                      {/* Bottom Spine Band & Author */}
                      <div className="w-full pb-1 text-center">
                        <div
                          className="h-0.5 w-full mb-1 rounded-sm opacity-60"
                          style={{ backgroundColor: book.accentColor || '#d4af37' }}
                        />
                        <span className="block text-[8px] font-serif uppercase tracking-tight opacity-75 truncate">
                          {book.author}
                        </span>

                        {/* Bookmark Ribbon */}
                        <div
                          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-2 h-4 rounded-b-xs shadow-md"
                          style={{ backgroundColor: book.accentColor || '#d4af37' }}
                        />
                      </div>

                      {/* Quick action popover on spine hover */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1c1611] border border-[#524130] text-[#efe4d7] px-2 py-1 rounded-md shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-30 flex items-center gap-1.5 whitespace-nowrap pointer-events-auto"
                      >
                        <button
                          onClick={() => onSelectBook(book, 'pdf')}
                          className="px-2 py-0.5 bg-[#d1a877] hover:bg-[#dfb785] text-[#221a13] font-serif text-[11px] font-bold rounded transition-colors shadow-xs cursor-pointer"
                          title="Apri e leggi PDF"
                        >
                          Leggi PDF
                        </button>
                        <button
                          onClick={() => onOpenDetails(book)}
                          className="p-1 text-[#b5a28f] hover:text-[#f2e6d9] rounded transition-colors cursor-pointer"
                          title="Dettagli volume"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteBook(book.id)}
                          className="p-1 text-[#9e5d59] hover:text-[#d36f68] rounded transition-colors cursor-pointer"
                          title="Rimuovi dallo scaffale"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Empty shelf slot to place a new book */}
                <div
                  onClick={onAddPdf}
                  className="h-[240px] w-36 border-2 border-dashed border-[#3a2d20] rounded flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:border-[#8f704b] hover:bg-[#282017]/40 transition-colors shrink-0 text-[#8b7764] hover:text-[#d3bfab]"
                >
                  <Plus className="w-6 h-6 mb-1.5 opacity-60 text-[#d1a877]" />
                  <span className="text-xs font-serif font-medium">Aggiungi PDF</span>
                  <span className="text-[10px] text-[#6e5d4e]">Spazio libero</span>
                </div>
              </div>

              {/* Physical Wood Shelf Plank */}
              <div className="relative z-20">
                <div className="h-3 bg-gradient-to-r from-[#533f2c] via-[#654d37] to-[#533f2c] border-t border-[#88694a] shadow-inner" />
                <div className="h-5 bg-gradient-to-b from-[#423223] to-[#2e2318] border-b-2 border-[#1a140f] flex items-center justify-between px-6 shadow-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#9f7d54]" />
                    <span className="text-[9px] uppercase tracking-widest text-[#a89078] font-mono">
                      Scaffale {rowIndex + 1}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-[#7a6755]">
                    {row.length} {row.length === 1 ? 'Volume' : 'Volumi'}
                  </span>
                </div>
                <div className="h-4 bg-gradient-to-b from-[#120d09]/80 to-transparent pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Front Cover Showcase Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="bg-[#241c15] border border-[#3e3023] rounded-lg overflow-hidden shadow-lg hover:border-[#6f563e] transition-all duration-200 flex flex-col justify-between"
            >
              {/* Cover Preview */}
              <div
                onClick={() => onSelectBook(book, 'pdf')}
                className="relative aspect-[16/10] bg-[#1a140f] cursor-pointer overflow-hidden flex items-center justify-center border-b border-[#3c2f22]"
                title="Clicca per aprire il PDF"
              >
                {book.coverImage ? (
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full p-4 flex flex-col justify-between text-[#f2e6d9]"
                    style={{ backgroundColor: book.spineColor || '#4a3224' }}
                  >
                    <div className="border border-[#ffffff]/20 p-3 h-full flex flex-col justify-between">
                      <div>
                        <h3 className="font-serif text-base font-bold text-[#fffbf5]">
                          {book.title}
                        </h3>
                        <p className="text-xs font-serif italic text-[#d4c2b0] mt-0.5">
                          {book.author}
                        </p>
                      </div>
                      <p className="text-[10px] font-mono text-right opacity-70">
                        {book.pageCount} pagine
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Meta Content */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3
                    onClick={() => onSelectBook(book, 'pdf')}
                    className="font-serif text-base font-semibold text-[#f0e4d6] hover:text-[#dfb785] cursor-pointer leading-snug"
                  >
                    {book.title}
                  </h3>
                  <p className="text-xs text-[#a89685] font-serif italic mt-0.5">
                    {book.author}
                  </p>
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-2.5 border-t border-[#382b1e] flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => onDeleteBook(book.id)}
                    className="p-1.5 text-[#8f5a56] hover:text-[#c46962] rounded transition-colors cursor-pointer"
                    title="Rimuovi volume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenDetails(book)}
                      className="px-2.5 py-1 bg-[#2a2016] hover:bg-[#3d2e20] text-[#cbb6a1] rounded text-xs border border-[#483726] transition-colors cursor-pointer"
                      title="Dettagli"
                    >
                      Dettagli
                    </button>
                    <button
                      onClick={() => onSelectBook(book, 'pdf')}
                      className="px-3.5 py-1.5 bg-[#d1a877] hover:bg-[#dfb785] text-[#221a13] font-serif font-bold rounded text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Leggi PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
