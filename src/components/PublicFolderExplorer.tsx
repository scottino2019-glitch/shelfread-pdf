import React, { useState } from 'react';
import { Book } from '../types/book';
import { Folder, FileText, Check, Copy, ExternalLink, ArrowRight, HardDrive } from 'lucide-react';

interface PublicFolderExplorerProps {
  books: Book[];
  onSelectBook: (book: Book, mode: 'pdf' | 'text') => void;
  onAddPdf: () => void;
}

export const PublicFolderExplorer: React.FC<PublicFolderExplorerProps> = ({
  books,
  onSelectBook,
  onAddPdf,
}) => {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const publicBooks = books.filter((b) => !b.isCustom || b.url.startsWith('/'));

  const handleCopy = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  return (
    <div className="py-6 space-y-8">
      {/* Overview Card */}
      <div className="bg-[#241c15] border border-[#3e3023] rounded-lg p-6 sm:p-8 space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#ad957e] font-serif">
          <HardDrive className="w-4 h-4 text-[#dec4a6]" />
          <span>Gestione Archivio File di Sistema</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-medium text-[#f0e4d6]">
          Cartella Radice: <code className="text-[#d1a877] font-mono">/public</code>
        </h2>
        <p className="text-sm text-[#baa998] font-serif max-w-3xl leading-relaxed">
          In conformità alle specifiche di progetto, tutti i file PDF risiedono nella cartella pubblica <code className="bg-[#382c20] px-1.5 py-0.5 rounded text-[#dec4a6] text-xs font-mono">public/books/</code> del server. Vengono serviti direttamente dal web server e analizzati istantaneamente senza dipendere da servizi esterni o connessioni remote.
        </p>
      </div>

      {/* Directory Browser List */}
      <div className="bg-[#211913] border border-[#3b2e21] rounded-lg overflow-hidden shadow-md">
        <div className="px-6 py-4 bg-[#1b150f] border-b border-[#35281b] flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-[#d8c7b5]">
            <Folder className="w-4 h-4 text-[#d1a877]" />
            <span>public / books /</span>
          </div>
          <span className="text-xs text-[#8e7a68] font-mono">
            {publicBooks.length} file PDF memorizzati
          </span>
        </div>

        <div className="divide-y divide-[#2f2317]">
          {publicBooks.map((book) => {
            const fullPath = `public${book.url.startsWith('/') ? book.url : `/${book.url}`}`;
            const isCopied = copiedPath === fullPath;

            return (
              <div
                key={book.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#281f17]/50 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className="w-8 h-10 rounded-xs shrink-0 flex items-center justify-center text-[#edd8c4] shadow-xs mt-0.5"
                    style={{ backgroundColor: book.spineColor }}
                  >
                    <FileText className="w-4 h-4 opacity-80" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif font-medium text-[#f3e5d7] text-sm">
                        {book.filename}
                      </h4>
                      <span className="text-[10px] font-mono bg-[#32261b] text-[#cbb6a1] px-1.5 py-0.5 rounded">
                        {book.fileSize || 'PDF'}
                      </span>
                    </div>
                    <p className="text-xs text-[#9f8b79] font-serif mt-0.5">
                      {book.title} — di {book.author} ({book.pageCount} fogli)
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono text-[#7d6c5c]">
                      <span>Percorso: {fullPath}</span>
                      <button
                        onClick={() => handleCopy(fullPath)}
                        className="text-[#caa783] hover:text-[#eddcc8] transition-colors inline-flex items-center gap-1"
                        title="Copia percorso file negli appunti"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-[#7eb375]" /> : <Copy className="w-3 h-3" />}
                        <span className="text-[10px]">{isCopied ? 'Copiato' : 'Copia'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-2 sm:self-center shrink-0">
                  <button
                    onClick={() => onSelectBook(book, 'pdf')}
                    className="px-3 py-1.5 bg-[#312519] hover:bg-[#403122] text-[#d6c4b2] rounded text-xs border border-[#483726] transition-colors"
                  >
                    Apri PDF
                  </button>
                  <button
                    onClick={() => onSelectBook(book, 'text')}
                    className="px-3 py-1.5 bg-[#d1a877] hover:bg-[#dfb785] text-[#221a13] font-semibold rounded text-xs transition-colors flex items-center gap-1"
                  >
                    <span>Leggi Testo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guide to adding custom PDFs to public/ and catalog.json */}
      <div className="bg-[#1e1711] border border-[#382b1e] rounded-lg p-6 space-y-4">
        <h3 className="font-serif text-[#eddcc8] text-base font-medium">
          Come aggiungere o rimuovere volumi tramite <code className="text-[#d1a877]">public/catalog.json</code>
        </h3>
        <p className="text-xs sm:text-sm text-[#baa998] font-serif leading-relaxed">
          Il file <code className="bg-[#2c2218] px-1.5 py-0.5 rounded text-[#dec4a6] font-mono text-xs">public/catalog.json</code> è ora ultra-semplice: non servono ID, colori esadecimali, descrizioni o conteggi manuali. Bastano solo <strong>titolo</strong>, <strong>nome file</strong> e <strong>autore</strong>:
        </p>

        <pre className="bg-[#150f0a] border border-[#382b1e] p-3 rounded text-[11px] font-mono text-[#ecd8c3] overflow-x-auto">
{`[
  {
    "title": "Mio Libro",
    "filename": "mio-libro.pdf",
    "author": "Nome Autore"
  }
]`}
        </pre>

        <ul className="text-xs text-[#a89685] font-serif space-y-1.5 list-disc list-inside">
          <li><strong>Per aggiungere un libro</strong>: copia il file PDF in <code className="font-mono text-[#d1a877]">public/books/</code> e inserisci le 3 righe in <code className="font-mono text-[#d1a877]">catalog.json</code>.</li>
          <li><strong>Per rimuovere un libro</strong>: basta cancellare l'elemento da <code className="font-mono text-[#d1a877]">catalog.json</code> o eliminare il PDF. Non verrà più ricaricato!</li>
          <li><strong>Colori e dorso in pelle</strong>: generati automaticamente in modo armonioso ed elegante.</li>
        </ul>

        <div className="pt-1">
          <button
            onClick={onAddPdf}
            className="px-4 py-2 bg-[#d1a877] hover:bg-[#dfb785] text-[#221a13] text-xs font-semibold rounded-md transition-colors cursor-pointer"
          >
            Carica un PDF dall'Interfaccia
          </button>
        </div>
      </div>
    </div>
  );
};
