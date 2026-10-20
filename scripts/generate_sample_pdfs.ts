import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

interface BookDef {
  filename: string;
  title: string;
  author: string;
  year: string;
  category: string;
  spineColor: string;
  accentColor: string;
  description: string;
  pages: {
    chapterTitle: string;
    paragraphs: string[];
  }[];
}

const books: BookDef[] = [
  {
    filename: 'il-principe-machiavelli.pdf',
    title: 'Il Principe',
    author: 'Niccolò Machiavelli',
    year: '1532',
    category: 'Documento PDF',
    spineColor: '#7b3f28',
    accentColor: '#d4af37',
    description: 'Trattato di dottrina politica fondamentale del Rinascimento fiorentino sulla conquista e conservazione degli stati.',
    pages: [
      {
        chapterTitle: 'Dedica e Capitolo I: Quante sieno le spezie de’ principati',
        paragraphs: [
          'Niccolò Machiavelli al Magnifico Lorenzo de’ Medici.',
          'Sogliono, il più delle volte, coloro che desiderano acquistare grazia appresso uno Principe, farseli incontro con quelle cose che infra le loro abbiano più care, o delle quali vegghino lui più dilettarsi; donde si vede molte volte essere loro presentati cavalli, arme, drappi d’oro, pietre preziose e simili ornamenti degni della grandezza di quelli.',
          'Desiderando io adunque offerirmi alla vostra Magnificenza con qualche testimone della servitù mia verso di quella, non ho trovato intra la mia suppellettile cosa quale io abbia più cara o tanto stimi, quanto la cognizione delle azioni degli uomini grandi, imparata da me con una lunga esperienzia delle cose moderne ed una continua lezione delle antique.',
          'Tutti gli stati, tutti e’ dominii che hanno avuto e hanno imperio sopra gli uomini, sono stati e sono o repubbliche o principati. E’ principati sono o ereditarii, de’ quali el sangue del loro signore ne sia suto lungo tempo principe, o e’ sono nuovi.'
        ]
      },
      {
        chapterTitle: 'Capitolo XVII: Della crudeltà e pietà; se sia meglio esser amato che temuto',
        paragraphs: [
          'Scendendo appresso alle altre preallegate qualità, dico che ciascuno principe debbe desiderare di essere tenuto pietoso e non crudele: nondimanco debbe avvertire di non usare male questa pietà. Era tenuto Cesare Borgia crudele; nondimanco quella sua crudeltà aveva racconcia la Romagna, unitola, ridottola in pace e in fede.',
          'Nasce da questo una disputa: s’elli è meglio essere amato che temuto, o e converso. Rispondesi che si vorrebbe essere l’uno e l’altro; ma, perché elli è difficile accozzarli insieme, è molto più sicuro essere temuto che amato, quando si abbia a mancare dell’uno de’ duoi.',
          'Perché degli uomini si può dire questo generalmente: che sieno ingrati, volubili, simulatori e dissimulatori, fuggitori de’ pericoli, cupidi di guadagno; e mentre fai loro bene, sono tutti tuoi, ma quando il bisogno ti si accosta, si rivoltano.'
        ]
      },
      {
        chapterTitle: 'Capitolo XXV: Quanto possa la Fortuna nelle cose umane',
        paragraphs: [
          'Non mi è incognito come molti hanno avuto e hanno opinione che le cose del mondo sieno in modo governate dalla fortuna e da Dio, che gli uomini con la prudenzia loro non possino correggerle, né vi abbiano alcuno rimedio.',
          'Nondimanco, perché il nostro libero arbitrio non sia spento, iudico potere essere vero che la fortuna sia arbitra della metà delle azioni nostre, ma che ancora ella ne lasci governare l’altra metà, o presso, a noi.',
          'E assomiglio quella a uno di questi fiumi rovinosi, che, quando s’adirano, allagano e’ piani, rovinano gli arbori e gli edifizii; ciascuno fugge loro dinanzi, ognuno cede all’impeto loro, sanza potervi in alcuna parte ostare.'
        ]
      }
    ]
  }
];

async function generateBooks() {
  const publicDir = path.resolve(process.cwd(), 'public');
  const booksDir = path.resolve(publicDir, 'books');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  if (!fs.existsSync(booksDir)) {
    fs.mkdirSync(booksDir, { recursive: true });
  }

  const manifest: any[] = [];

  for (const book of books) {
    const pdfDoc = await PDFDocument.create();
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

    // Cover Page (A4 format)
    const coverPage = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = coverPage.getSize();

    // Natural parchment paper background tone
    coverPage.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.98, 0.965, 0.94),
    });

    // Elegant inner frame
    coverPage.drawRectangle({
      x: 36,
      y: 36,
      width: width - 72,
      height: height - 72,
      borderColor: rgb(0.35, 0.28, 0.22),
      borderWidth: 1.5,
    });

    coverPage.drawText(book.category.toUpperCase(), {
      x: 60,
      y: height - 120,
      size: 11,
      font: timesRoman,
      color: rgb(0.48, 0.38, 0.28),
    });

    coverPage.drawText(book.title, {
      x: 60,
      y: height - 170,
      size: 32,
      font: timesBold,
      color: rgb(0.14, 0.11, 0.08),
    });

    coverPage.drawText(`di ${book.author}`, {
      x: 60,
      y: height - 215,
      size: 16,
      font: timesItalic,
      color: rgb(0.28, 0.22, 0.16),
    });

    coverPage.drawLine({
      start: { x: 60, y: height - 245 },
      end: { x: width - 60, y: height - 245 },
      thickness: 1,
      color: rgb(0.70, 0.60, 0.50),
    });

    const descLines = wrapText(book.description, timesRoman, 14, width - 120);
    let descY = height - 290;
    for (const line of descLines) {
      coverPage.drawText(line, {
        x: 60,
        y: descY,
        size: 14,
        font: timesRoman,
        color: rgb(0.20, 0.17, 0.13),
      });
      descY -= 22;
    }

    coverPage.drawText(`Edizione conservata in /public/books · Anno ${book.year}`, {
      x: 60,
      y: 70,
      size: 11,
      font: timesItalic,
      color: rgb(0.45, 0.38, 0.30),
    });

    // Content Pages
    let pageNumber = 1;
    for (const section of book.pages) {
      pageNumber++;
      const page = pdfDoc.addPage([595.28, 841.89]);
      
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(0.985, 0.972, 0.95),
      });

      page.drawText(`${book.title} — ${book.author}`, {
        x: 60,
        y: height - 48,
        size: 11,
        font: timesItalic,
        color: rgb(0.42, 0.36, 0.30),
      });
      page.drawLine({
        start: { x: 60, y: height - 54 },
        end: { x: width - 60, y: height - 54 },
        thickness: 0.5,
        color: rgb(0.78, 0.72, 0.66),
      });

      page.drawText(section.chapterTitle, {
        x: 60,
        y: height - 90,
        size: 16,
        font: timesBold,
        color: rgb(0.14, 0.11, 0.08),
      });

      let currentY = height - 130;
      for (const p of section.paragraphs) {
        const lines = p.split('\n');
        for (const rawLine of lines) {
          const wrapped = wrapText(rawLine, timesRoman, 14, width - 120);
          for (const line of wrapped) {
            if (currentY < 70) break;
            page.drawText(line, {
              x: 60,
              y: currentY,
              size: 14,
              font: timesRoman,
              color: rgb(0.12, 0.09, 0.07),
            });
            currentY -= 23;
          }
        }
        currentY -= 14;
      }

      page.drawText(`— ${pageNumber} —`, {
        x: width / 2 - 15,
        y: 38,
        size: 11,
        font: timesRoman,
        color: rgb(0.42, 0.36, 0.30),
      });
    }

    const pdfBytes = await pdfDoc.save();
    const filePath = path.join(booksDir, book.filename);
    fs.writeFileSync(filePath, pdfBytes);

    manifest.push({
      id: book.filename.replace('.pdf', ''),
      filename: book.filename,
      url: `/books/${book.filename}`,
      title: book.title,
      author: book.author,
      year: book.year,
      category: book.category,
      spineColor: book.spineColor,
      accentColor: book.accentColor,
      description: book.description,
      pageCount: book.pages.length + 1,
      fileSize: `${Math.round(pdfBytes.byteLength / 1024)} KB`,
    });
  }

  fs.writeFileSync(
    path.join(publicDir, 'catalog.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );
  console.log(`Generated book with enhanced clear typography in /public/books`);
}

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, size);
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

generateBooks().catch((err) => {
  console.error(err);
  process.exit(1);
});
