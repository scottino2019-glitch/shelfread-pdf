import React from 'react';
import { Eye, Sun, BookOpen, Feather, ShieldCheck } from 'lucide-react';

export const ReadingGuide: React.FC = () => {
  return (
    <div className="py-6 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-[#241c15] border border-[#3e3023] rounded-lg p-6 sm:p-8 space-y-3">
        <p className="text-xs uppercase tracking-widest text-[#ad957e] font-serif">
          Principi di Confort Visivo & Design d'Ambiente
        </p>
        <h2 className="text-2xl sm:text-3xl font-serif font-medium text-[#f0e4d6]">
          Filosofia della Biblioteca Naturale
        </h2>
        <p className="text-sm text-[#baa998] font-serif leading-relaxed">
          Un'architettura visiva pensata per proteggere gli occhi e favorire la concentrazione profonda, eliminando l'affaticamento tipico degli schermi moderni.
        </p>
      </div>

      {/* Grid of 4 principles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Principle 1 */}
        <div className="bg-[#211913] border border-[#3b2e21] rounded-lg p-6 space-y-3">
          <div className="w-9 h-9 rounded-md bg-[#33261a] border border-[#4d3a29] flex items-center justify-center text-[#d1a877]">
            <Eye className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-[#f2e6d9] text-lg font-medium">
            Assenza di Luce Artificiale Fredda
          </h3>
          <p className="text-xs sm:text-sm text-[#b5a392] font-serif leading-relaxed">
            I classici lettori PDF proiettano sfondi bianchi digitali (<code className="font-mono text-[#d1a877]">#FFFFFF</code>) che abbagliano la retina. La nostra palette utilizza toni caldi del legno, pergamena morbida e tinte terrose prive di picchi di luce blu.
          </p>
        </div>

        {/* Principle 2 */}
        <div className="bg-[#211913] border border-[#3b2e21] rounded-lg p-6 space-y-3">
          <div className="w-9 h-9 rounded-md bg-[#33261a] border border-[#4d3a29] flex items-center justify-center text-[#d1a877]">
            <Feather className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-[#f2e6d9] text-lg font-medium">
            Foglio Naturale: Inchiostro e Carta
          </h3>
          <p className="text-xs sm:text-sm text-[#b5a392] font-serif leading-relaxed">
            Nella modalità di lettura del testo estratto, la carta risponde a formulazioni storiche (Avorio Naturale, Antica d'Archivio, Selce Opaca) e l'inchiostro è un carbone profondo (<code className="font-mono text-[#d1a877]">#1F1D1A</code>), non il nero freddo sintetico.
          </p>
        </div>

        {/* Principle 3 */}
        <div className="bg-[#211913] border border-[#3b2e21] rounded-lg p-6 space-y-3">
          <div className="w-9 h-9 rounded-md bg-[#33261a] border border-[#4d3a29] flex items-center justify-center text-[#d1a877]">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-[#f2e6d9] text-lg font-medium">
            Scaffale Fisico & Presenza Spaziale
          </h3>
          <p className="text-xs sm:text-sm text-[#b5a392] font-serif leading-relaxed">
            I volumi sono allineati su mensole di legno massiccio scuro con costole dorate, legature in cuoio e tela, e segnalibri in seta, ricreando la calda familiarità di una biblioteca d'epoca rinascimentale.
          </p>
        </div>

        {/* Principle 4 */}
        <div className="bg-[#211913] border border-[#3b2e21] rounded-lg p-6 space-y-3">
          <div className="w-9 h-9 rounded-md bg-[#33261a] border border-[#4d3a29] flex items-center justify-center text-[#d1a877]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-[#f2e6d9] text-lg font-medium">
            Duplice Modalità: PDF & Reflow
          </h3>
          <p className="text-xs sm:text-sm text-[#b5a392] font-serif leading-relaxed">
            Puoi passare con un solo tocco tra il layout grafico originale delle pagine PDF (facsimile ad alta definizione) e la rilettura testuale fluida con interlinea rilassata e colonna editoriale ideale da 65-75 caratteri.
          </p>
        </div>

      </div>

      {/* Interactive Paper sample showcase */}
      <div className="bg-[#1e1711] border border-[#372a1e] rounded-lg p-6 space-y-4">
        <h4 className="font-serif text-[#eddcc8] text-base font-medium">
          Confronto Sfumature dei Fogli Naturali
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#FAF6ED] text-[#1F1D1A] p-4 rounded-sm border border-[#E8DEC8] shadow-sm">
            <span className="text-[10px] uppercase font-mono tracking-wider opacity-70">Campione 01</span>
            <h5 className="font-serif font-bold text-sm mt-1">Carta Avorio Naturale</h5>
            <p className="text-xs font-serif opacity-80 mt-1 leading-snug">
              Tonalità pergamena morbida, elimina il riverbero e rilassa i muscoli ciliari dell’occhio.
            </p>
          </div>
          <div className="bg-[#F3EDE2] text-[#26231F] p-4 rounded-sm border border-[#DFD5C4] shadow-sm">
            <span className="text-[10px] uppercase font-mono tracking-wider opacity-70">Campione 02</span>
            <h5 className="font-serif font-bold text-sm mt-1">Carta Antica d'Archivio</h5>
            <p className="text-xs font-serif opacity-80 mt-1 leading-snug">
              Texture di carta straccia d'epoca, perfetto equilibrio di contrasto per letture di studio.
            </p>
          </div>
          <div className="bg-[#EAE4D7] text-[#1C1917] p-4 rounded-sm border border-[#D6CDBC] shadow-sm">
            <span className="text-[10px] uppercase font-mono tracking-wider opacity-70">Campione 03</span>
            <h5 className="font-serif font-bold text-sm mt-1">Carta Selce Opaca</h5>
            <p className="text-xs font-serif opacity-80 mt-1 leading-snug">
              Cotone pressato naturale a bassa riflettanza, zero bagliori anche sotto illuminazione intensa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
