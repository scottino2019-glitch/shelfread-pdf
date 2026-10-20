import React, { useState } from 'react';
import { Book } from '../types/book';
import { BookOpen, FileText, Search, ArrowUpDown, ExternalLink } from 'lucide-react';

interface CatalogTableProps {
  books: Book[];
  onSelectBook: (book: Book, mode: 'pdf' | 'text') => void;
  onOpenDetails: (book: Book) => void;
}

export const CatalogTable: React.FC<CatalogTableProps> = ({
  books,
  onSelectBook,
  onOpenDetails,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'year' | 'pageCount'>('title');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = books
    .filter(
      (b) =>
        b.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(filterQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(filterQuery.toLowerCase())
    )
    .sort((a, b) => {
      let valA: any = a[sortBy] || '';
      let valB: any = b[sortBy] || '';
      if (sortBy === 'pageCount') {
        valA = a.pageCount;
        valB = b.pageCount;
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  const toggleSort = (col: 'title' | 'author' | 'year' | 'pageCount') => {
    if (sortBy === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(col);
      setSortAsc(true);
    }
  };

  return (
    <div className="py-6 space-y-6">
      <div className="bg-[#241c15] border border-[#3e3023] rounded-lg p-6 sm:p-8 space-y-2">
        <p className="text-xs uppercase tracking-widest text-[#ad957e] font-serif">
          Inventario d'Archivio
        </p>
        <h2 className="text-2xl sm:text-3xl font-serif font-medium text-[#f0e4d6]">
          Catalogo Completo dei Volumi
        </h2>
        <p className="text-sm text-[#baa998] font-serif max-w-2xl">
          Elenco tabellare di tutti i documenti PDF presenti nella cartella <code className="bg-[#382c20] px-1.5 py-0.5 rounded text-[#dec4a6] text-xs font-mono">public</code>, con metadati bibliografici e accesso immediato alla lettura.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7765]" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filtra catalogo per titolo, autore, genere..."
            className="w-full bg-[#1e1711] border border-[#3e3124] focus:border-[#9f7d54] text-[#e8dfd5] text-xs rounded-md pl-9 pr-3 py-2 outline-none"
          />
        </div>
        <span className="text-xs font-mono text-[#8f7d6d]">
          {filtered.length} volumi registrati
        </span>
      </div>

      {/* Table */}
      <div className="bg-[#221a13] border border-[#3d2f22] rounded-lg overflow-x-auto shadow-md">
        <table className="w-full text-left text-xs text-[#d6c5b2]">
          <thead className="bg-[#1b150f] border-b border-[#382b1e] text-[11px] uppercase tracking-wider text-[#9d8977] font-serif">
            <tr>
              <th
                onClick={() => toggleSort('title')}
                className="py-3 px-4 cursor-pointer hover:text-[#f0e4d6]"
              >
                <div className="flex items-center gap-1">
                  <span>Titolo Opera</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('author')}
                className="py-3 px-4 cursor-pointer hover:text-[#f0e4d6]"
              >
                <div className="flex items-center gap-1">
                  <span>Autore</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 hidden md:table-cell">File in /public</th>
              <th
                onClick={() => toggleSort('year')}
                className="py-3 px-4 cursor-pointer hover:text-[#f0e4d6] hidden sm:table-cell"
              >
                <div className="flex items-center gap-1">
                  <span>Anno</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('pageCount')}
                className="py-3 px-4 cursor-pointer hover:text-[#f0e4d6] text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Pagine</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Consultazione</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#312519]">
            {filtered.map((book) => (
              <tr
                key={book.id}
                className="hover:bg-[#2c2219]/60 transition-colors cursor-pointer group"
                onClick={() => onOpenDetails(book)}
              >
                <td className="py-3.5 px-4 font-serif font-medium text-[#f2e6d9]">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-6 rounded-xs shrink-0 shadow-xs"
                      style={{ backgroundColor: book.spineColor }}
                    />
                    <span className="group-hover:text-[#dfb785] transition-colors">{book.title}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-serif italic text-[#baa897]">
                  {book.author}
                </td>
                <td className="py-3.5 px-4 font-mono text-xs text-[#a3907c] hidden md:table-cell truncate max-w-xs" title={book.url}>
                  {book.filename}
                </td>
                <td className="py-3.5 px-4 font-mono text-[#a59381] hidden sm:table-cell">
                  {book.year || '—'}
                </td>
                <td className="py-3.5 px-4 font-mono tabular-nums text-right text-[#edd8c4]">
                  {book.pageCount}
                </td>
                <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onSelectBook(book, 'pdf')}
                      className="px-2.5 py-1 bg-[#32261b] hover:bg-[#433324] text-[#d6c4b2] hover:text-[#fff] rounded text-[11px] border border-[#483726] transition-colors"
                      title="Apri PDF Originale"
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => onSelectBook(book, 'text')}
                      className="px-2.5 py-1 bg-[#9f7d54] hover:bg-[#b08d62] text-[#1c1611] font-semibold rounded text-[11px] transition-colors"
                      title="Leggi Testo Estratto"
                    >
                      Testo
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
