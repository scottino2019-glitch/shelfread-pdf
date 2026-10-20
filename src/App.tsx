import React, { useState, useEffect } from 'react';
import { Book, ReaderMode, ReaderSettings } from './types/book';
import {
  loadStoredBooks,
  fetchCatalogBooks,
  saveStoredBooks,
  saveBookProgress,
  loadCustomBooks,
  saveCustomBooks,
  saveHiddenCatalogId,
  loadStoredSettings,
  saveStoredSettings,
} from './utils/storage';
import { deletePdfFromIndexedDB } from './utils/pdfStorage';
import { Header } from './components/Header';
import { Bookshelf } from './components/Bookshelf';
import { PublicFolderExplorer } from './components/PublicFolderExplorer';
import { BookDetailModal } from './components/BookDetailModal';
import { AddPdfModal } from './components/AddPdfModal';
import { Reader } from './components/Reader';

export default function App() {
  const [books, setBooks] = useState<Book[]>(() => loadStoredBooks());
  const [settings, setSettings] = useState<ReaderSettings>(() => loadStoredSettings());
  const [activeSection, setActiveSection] = useState<string>('scaffali');
  
  // Reading state
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [readerMode, setReaderMode] = useState<ReaderMode>('pdf');
  
  // Modals
  const [inspectingBook, setInspectingBook] = useState<Book | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Dynamically load catalog.json on mount so any additions or deletions from catalog.json are immediately reflected
  useEffect(() => {
    fetchCatalogBooks().then((loaded) => {
      setBooks(loaded);
    });
  }, []);

  // Sync books reading progress
  const handleUpdateProgress = React.useCallback((bookId: string, page: number) => {
    setBooks((prevBooks) => {
      const existing = prevBooks.find((b) => b.id === bookId);
      if (existing && existing.lastReadPage === page) {
        return prevBooks;
      }
      const updated = prevBooks.map((b) => {
        if (b.id === bookId) {
          const progress = Math.min(100, Math.round((page / b.pageCount) * 100));
          return { ...b, lastReadPage: page, progressPercent: progress };
        }
        return b;
      });
      saveStoredBooks(updated);
      saveBookProgress(bookId, page, existing?.pageCount || 1);
      return updated;
    });
  }, []);

  const handleAddBook = React.useCallback((newBook: Book) => {
    setBooks((prev) => {
      const updated = [newBook, ...prev];
      saveStoredBooks(updated);
      const customBooks = loadCustomBooks();
      saveCustomBooks([newBook, ...customBooks.filter((b) => b.id !== newBook.id)]);
      return updated;
    });
  }, []);

  const handleDeleteBook = React.useCallback((bookId: string) => {
    deletePdfFromIndexedDB(bookId);
    saveHiddenCatalogId(bookId);

    const customBooks = loadCustomBooks().filter((b) => b.id !== bookId);
    saveCustomBooks(customBooks);

    setBooks((prev) => {
      const updated = prev.filter((b) => b.id !== bookId);
      saveStoredBooks(updated);
      return updated;
    });
    setInspectingBook(null);
  }, []);

  const handleUpdateSettings = React.useCallback((newSettings: ReaderSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  }, []);

  const handleStartReading = (book: Book, mode: ReaderMode = 'pdf') => {
    setReadingBook(book);
    setReaderMode(mode);
    setInspectingBook(null);
  };

  // If in active reading mode, render the Reader view
  if (readingBook) {
    return (
      <>
        <Reader
          book={readingBook}
          initialMode={readerMode}
          onBackToLibrary={() => setReadingBook(null)}
          onUpdateProgress={handleUpdateProgress}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onAddPdf={() => setIsAddModalOpen(true)}
        />
        <AddPdfModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddBook={(newBook) => {
            handleAddBook(newBook);
            handleStartReading(newBook, 'pdf');
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#241c15] text-[#e8dfd5] flex flex-col font-sans">
      {/* Universal Top Bar */}
      <Header
        onAddPdf={() => setIsAddModalOpen(true)}
        activeSection={activeSection}
        onNavigate={(sec) => setActiveSection(sec)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeSection === 'scaffali' && (
          <Bookshelf
            books={books}
            onSelectBook={(book, mode = 'pdf') => handleStartReading(book, mode)}
            onOpenDetails={(book) => setInspectingBook(book)}
            onAddPdf={() => setIsAddModalOpen(true)}
            onDeleteBook={handleDeleteBook}
          />
        )}

        {activeSection === 'pubblici' && (
          <PublicFolderExplorer
            books={books}
            onSelectBook={(book, mode) => handleStartReading(book, mode)}
            onAddPdf={() => setIsAddModalOpen(true)}
          />
        )}
      </main>

      {/* Quiet Library Footer */}
      <footer className="border-t border-[#3b2e21] bg-[#1d1610] text-xs text-[#958371] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <span className="font-serif text-[#b8a695]">Libreria & Lettore PDF</span>
          <span className="text-[11px] text-[#7d6c5c] font-mono">Archivio da public/catalog.json</span>
        </div>
      </footer>

      {/* Book Inspection Drawer / Modal */}
      <BookDetailModal
        book={inspectingBook}
        onClose={() => setInspectingBook(null)}
        onReadBook={(book, mode) => handleStartReading(book, mode)}
        onDeleteCustomBook={handleDeleteBook}
      />

      {/* Add PDF Modal */}
      <AddPdfModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddBook={handleAddBook}
      />
    </div>
  );
}
