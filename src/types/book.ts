export interface CatalogItem {
  title?: string;
  filename?: string;
  url?: string;
  author?: string;
  year?: string | number;
  category?: string;
  description?: string;
  spineColor?: string;
  accentColor?: string;
  coverImage?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  year?: string;
  category: string;
  description: string;
  url: string; // path in public or indexeddb:// URL
  filename: string;
  pageCount: number;
  fileSize?: string;
  spineColor: string;
  accentColor: string;
  coverImage?: string;
  isCustom?: boolean;
  lastReadPage?: number;
  progressPercent?: number;
  dateAdded?: string;
}

export interface ExtractedPageText {
  pageNumber: number;
  text: string;
  paragraphs: string[];
}

export type ReaderMode = 'pdf' | 'text';

export type PaperTone = 'avorio' | 'antica' | 'opaca' | 'notte';

export interface ReaderSettings {
  paperTone: PaperTone;
  fontSize: number; // in px, e.g. 18
  lineHeight: number; // 1.6, 1.8, 2.0
  fontFamily: 'serif' | 'sans';
  columnWidth: 'narrow' | 'normal' | 'wide'; // 600px, 720px, 860px
}
