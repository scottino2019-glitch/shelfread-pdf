import { Book, ReaderSettings } from '../types/book';

const STORAGE_KEY_SETTINGS = 'biblioteca_pdf_settings';
const STORAGE_KEY_CUSTOM_BOOKS = 'biblioteca_custom_books_v5';
const STORAGE_KEY_PROGRESS = 'biblioteca_reading_progress_v5';
const STORAGE_KEY_HIDDEN_CATALOG = 'biblioteca_hidden_catalog_ids_v5';
const STORAGE_KEY_CACHED_BOOKS = 'biblioteca_cached_books_v5';

export const DEFAULT_SETTINGS: ReaderSettings = {
  paperTone: 'avorio',
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: 'serif',
  columnWidth: 'normal',
};

// Rich warm color palette for book spines and gilded accents
const WARM_SPINE_PALETTE = [
  { spine: '#7a3e2a', accent: '#d4af37' }, // Cuoio fiorentino / oro
  { spine: '#4a242c', accent: '#e5c07b' }, // Amaranto rinascimentale / ottone
  { spine: '#2d4a3e', accent: '#deb887' }, // Verde bosco / pergamena
  { spine: '#34493a', accent: '#c9b037' }, // Verde salvia / bronzo
  { spine: '#273646', accent: '#c8a96e' }, // Blu oltremare antico / foglia d'oro
  { spine: '#503525', accent: '#d1af72' }, // Noce bruno / ambra
  { spine: '#5c3127', accent: '#dfba87' }, // Terracotta senese
  { spine: '#3d3445', accent: '#d9ba79' }, // Prugna / argento dorato
  { spine: '#433428', accent: '#e8c582' }, // Castagno antico / oro zecchino
  { spine: '#2c3e35', accent: '#d6b879' }, // Cipresso scuro / bronzo
];

/**
 * Deterministically generates rich spine and accent colors from title or id
 */
function getDeterministicSpineColors(seed: string, index: number) {
  let hash = index;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  const idx = Math.abs(hash) % WARM_SPINE_PALETTE.length;
  return WARM_SPINE_PALETTE[idx];
}

/**
 * Formats a clean book title from a filename if not provided
 */
function formatTitleFromFilename(filename: string): string {
  const clean = filename
    .replace(/^.*\//, '')
    .replace(/\.pdf$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim();
  if (!clean) return 'Documento PDF';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Normalizes any simple entry from catalog.json into a complete Book object.
 * Supports minimal JSON with only title, filename, and author!
 */
export function normalizeCatalogItem(item: any, index: number): Book {
  // Support simple string entry e.g. "il-principe.pdf"
  if (typeof item === 'string') {
    const filename = item.replace(/^.*\//, '');
    const url = item.startsWith('/') ? item : `/books/${item}`;
    const id = filename.replace(/\.pdf$/i, '') || `book-${index}`;
    const colors = getDeterministicSpineColors(id, index);
    return {
      id,
      title: formatTitleFromFilename(filename),
      author: 'Autore non specificato',
      url,
      filename,
      pageCount: 1,
      category: 'Biblioteca',
      description: 'Documento PDF conservato nell’archivio.',
      spineColor: colors.spine,
      accentColor: colors.accent,
      lastReadPage: 1,
      progressPercent: 0,
    };
  }

  // Support simple object with minimal fields
  const filename = item.filename || (item.url ? item.url.split('/').pop() : '') || `documento-${index}.pdf`;
  const cleanFilename = filename.replace(/^.*\//, '');
  const url = item.url || (item.filename?.startsWith('/') ? item.filename : `/books/${cleanFilename}`);
  const id = item.id || cleanFilename.replace(/\.pdf$/i, '') || `book-${index}`;
  const colors = getDeterministicSpineColors(id, index);

  return {
    id,
    title: item.title?.trim() || formatTitleFromFilename(cleanFilename),
    author: item.author?.trim() || 'Autore non specificato',
    year: item.year?.toString() || '',
    category: item.category || 'Biblioteca',
    description: item.description || (item.author ? `Opera di ${item.author}.` : 'Documento PDF conservato in archivio.'),
    url,
    filename: cleanFilename,
    pageCount: Number(item.pageCount) || 1,
    fileSize: item.fileSize || '',
    spineColor: item.spineColor || colors.spine,
    accentColor: item.accentColor || colors.accent,
    coverImage: item.coverImage,
    isCustom: false,
    lastReadPage: 1,
    progressPercent: 0,
    dateAdded: item.dateAdded,
  };
}

/**
 * Loads reading progress map from localStorage
 */
export function loadReadingProgress(): Record<string, { lastReadPage: number; progressPercent: number }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Saves reading progress for a specific book
 */
export function saveBookProgress(bookId: string, page: number, totalPages: number = 1): void {
  try {
    const progressMap = loadReadingProgress();
    const percent = Math.min(100, Math.round((page / Math.max(1, totalPages)) * 100));
    progressMap[bookId] = {
      lastReadPage: page,
      progressPercent: percent,
    };
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progressMap));
  } catch (err) {
    console.error('Error saving reading progress:', err);
  }
}

/**
 * Loads custom user-uploaded books from localStorage
 */
export function loadCustomBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_BOOKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Saves custom user-uploaded books to localStorage
 */
export function saveCustomBooks(books: Book[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_BOOKS, JSON.stringify(books));
  } catch (err) {
    console.error('Error saving custom books:', err);
  }
}

/**
 * Loads list of catalog IDs hidden by the user
 */
export function loadHiddenCatalogIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HIDDEN_CATALOG);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

/**
 * Saves list of catalog IDs hidden by the user
 */
export function saveHiddenCatalogId(id: string): void {
  try {
    const current = loadHiddenCatalogIds();
    current.add(id);
    localStorage.setItem(STORAGE_KEY_HIDDEN_CATALOG, JSON.stringify(Array.from(current)));
  } catch (err) {
    console.error('Error saving hidden catalog id:', err);
  }
}

/**
 * Synchronously loads cached books from localStorage for immediate first-render display.
 */
export function loadStoredBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CACHED_BOOKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore and return empty array
  }
  return [];
}

/**
 * Saves current books to the cache
 */
export function saveStoredBooks(books: Book[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CACHED_BOOKS, JSON.stringify(books));
  } catch (err) {
    console.error('Error caching books:', err);
  }
}

/**
 * Fetches public/catalog.json dynamically from the server.
 * Merges with user reading progress and custom uploaded books.
 * If a book is deleted from catalog.json or public, it is automatically removed!
 */
export async function fetchCatalogBooks(): Promise<Book[]> {
  const progressMap = loadReadingProgress();
  const hiddenIds = loadHiddenCatalogIds();
  const customBooks = loadCustomBooks();

  let catalogBooks: Book[] = [];

  try {
    const res = await fetch(`/catalog.json?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        catalogBooks = data
          .map((item, index) => normalizeCatalogItem(item, index))
          .filter((book) => !hiddenIds.has(book.id));
      }
    }
  } catch (err) {
    console.warn('Could not fetch catalog.json, using custom books:', err);
  }

  // Apply saved reading progress
  const allBooks = [...catalogBooks, ...customBooks].map((book) => {
    const saved = progressMap[book.id];
    if (saved) {
      return {
        ...book,
        lastReadPage: saved.lastReadPage || book.lastReadPage || 1,
        progressPercent: saved.progressPercent || book.progressPercent || 0,
      };
    }
    return book;
  });

  saveStoredBooks(allBooks);
  return allBooks;
}

export function loadStoredSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: ReaderSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}
