import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';

export async function mergePDFs(pdfBytesArray: Uint8Array[]): Promise<Uint8Array> {
  const mergedDoc = await PDFDocument.create();
  for (const bytes of pdfBytesArray) {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await mergedDoc.copyPages(doc, doc.getPageIndices());
    pages.forEach((page) => mergedDoc.addPage(page));
  }
  return mergedDoc.save();
}

export async function splitPDF(
  pdfBytes: Uint8Array,
  ranges: Array<[number, number]>
): Promise<Uint8Array[]> {
  const results: Uint8Array[] = [];
  for (const [start, end] of ranges) {
    const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const newDoc = await PDFDocument.create();
    const indices = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    const pages = await newDoc.copyPages(doc, indices);
    pages.forEach((page) => newDoc.addPage(page));
    results.push(await newDoc.save());
  }
  return results;
}

export async function deletePages(pdfBytes: Uint8Array, pageIndices: number[]): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const sorted = [...pageIndices].sort((a, b) => b - a);
  for (const idx of sorted) {
    doc.removePage(idx);
  }
  return doc.save();
}

export async function rotatePages(
  pdfBytes: Uint8Array,
  pageIndices: number[],
  angle: number
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  for (const idx of pageIndices) {
    const page = doc.getPage(idx);
    const currentAngle = page.getRotation().angle;
    const newRotation = ((currentAngle + angle) % 360 + 360) % 360;

    // Determine the original (unrotated) page dimensions.
    // If the page is currently at 90°/270°, the MediaBox is already
    // swapped relative to the original, so we un-swap to recover it.
    let origW = page.getWidth();
    let origH = page.getHeight();
    if (currentAngle === 90 || currentAngle === 270) {
      [origW, origH] = [origH, origW];
    }

    page.setRotation(degrees(newRotation));

    // Set MediaBox/CropBox based on original dimensions and the new rotation.
    // Odd multiples of 90° (90°/270°) need width↔height swapped so the
    // page dimensions match the rotated content orientation.
    if (newRotation === 90 || newRotation === 270) {
      page.setMediaBox(0, 0, origH, origW);
      page.setCropBox(0, 0, origH, origW);
    } else {
      page.setMediaBox(0, 0, origW, origH);
      page.setCropBox(0, 0, origW, origH);
    }
  }
  return doc.save();
}

export async function reorderPages(
  pdfBytes: Uint8Array,
  newOrder: number[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();
  const pages = await newDoc.copyPages(doc, newOrder);
  pages.forEach((page) => newDoc.addPage(page));
  return newDoc.save();
}

export async function insertBlankPage(
  pdfBytes: Uint8Array,
  afterPageIndex: number,
  width: number = 612,
  height: number = 792
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  doc.insertPage(afterPageIndex + 1, [width, height]);
  return doc.save();
}

export async function insertPagesFromPDF(
  targetBytes: Uint8Array,
  sourceBytes: Uint8Array,
  afterPageIndex: number
): Promise<Uint8Array> {
  const targetDoc = await PDFDocument.load(targetBytes, { ignoreEncryption: true });
  const sourceDoc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
  const sourcePages = await targetDoc.copyPages(sourceDoc, sourceDoc.getPageIndices());
  for (let i = 0; i < sourcePages.length; i++) {
    targetDoc.insertPage(afterPageIndex + 1 + i, sourcePages[i]);
  }
  return targetDoc.save();
}

export async function encryptPDF(
  pdfBytes: Uint8Array,
  password: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  return doc.save({
    userPassword: password,
    ownerPassword: password,
    permissions: {
      printing: 'highResolution',
      modifying: false,
      copying: false,
      annotating: true,
    },
  });
}

export async function addTextToPage(
  pdfBytes: Uint8Array,
  pageIndex: number,
  text: string,
  x: number,
  y: number,
  fontSize: number = 12
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.getPage(pageIndex);
  page.drawText(text, {
    x,
    y: page.getHeight() - y,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });
  return doc.save();
}

export async function editExistingText(
  pdfBytes: Uint8Array,
  pageIndex: number,
  screenX: number,
  screenY: number,
  originalWidth: number,
  originalHeight: number,
  pageHeight: number,
  newText: string,
  fontSize: number
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.getPage(pageIndex);

  // screenY is origin-top-left (PDF.js viewport coords at scale=1)
  // pdf-lib uses origin-bottom-left, so convert:
  const pdfX = screenX;
  const pdfY = pageHeight - screenY - originalHeight;

  // Draw white rectangle to cover original text
  page.drawRectangle({
    x: pdfX - 1,
    y: pdfY - 1,
    width: originalWidth + 2,
    height: originalHeight + 2,
    color: rgb(1, 1, 1),
  });

  // Draw new text - pdf-lib drawText y is the baseline, so offset slightly from bottom
  page.drawText(newText, {
    x: pdfX,
    y: pdfY + originalHeight * 0.15,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });

  return doc.save();
}

export async function getPDFInfo(pdfBytes: Uint8Array) {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pages = doc.getPages().map((page, index) => {
    const { width, height } = page.getSize();
    const rotation = page.getRotation().angle;
    return { pageNumber: index + 1, width, height, rotation };
  });
  return {
    pageCount: doc.getPageCount(),
    title: doc.getTitle() || '',
    author: doc.getAuthor() || '',
    pages,
  };
}
