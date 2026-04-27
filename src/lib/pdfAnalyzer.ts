import * as pdfjsLib from 'pdfjs-dist';
import * as docx from 'docx-preview';
import * as xlsx from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// We bind html2canvas to the window so jsPDF's html module can find it
if (typeof window !== 'undefined') {
  (window as any).html2canvas = html2canvas;
}

// Set up the pdf worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

export interface PageAnalysis {
  page: number;
  coloredPercent: string;
  blackWhitePercent: string;
  imagePercent: string;
  textSummary?: string;
  pageSize?: string;
}

const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

function analyzeCanvasPixels(ctx: CanvasRenderingContext2D, width: number, height: number, hasImages: boolean) {
    const imgData = ctx.getImageData(0, 0, width, height).data;
    let colorPx = 0;
    let bwPx = 0;
    const totalPx = width * height;
    
    for (let j = 0; j < imgData.length; j += 4) {
      const r = imgData[j];
      const g = imgData[j+1];
      const b = imgData[j+2];
      const a = imgData[j+3];
      
      // Skip transparent or near-white background
      if (a < 50) continue;
      if (r > 240 && g > 240 && b > 240) continue; 
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      
      // Simple heuristic for colored vs black ink
      if (max - min > 15 && !(r<50 && g<50 && b<50)) {
         colorPx++;
      } else {
         bwPx++;
      }
    }
    
    let colorPercent = (colorPx / totalPx) * 100;
    let bwPercent = (bwPx / totalPx) * 100;

    let imagesPercent = hasImages ? (colorPercent + bwPercent) : 0;
    if (imagesPercent > 100) imagesPercent = 100;
    
    return {
        coloredPercent: colorPercent.toFixed(1),
        blackWhitePercent: bwPercent.toFixed(1),
        imagePercent: imagesPercent.toFixed(1)
    };
}

export async function convertToPdfBuffer(file: File): Promise<ArrayBuffer> {
  const type = file.type;
  const name = file.name.toLowerCase();
  
  if (name.endsWith('.pdf') || type === 'application/pdf') {
    return await file.arrayBuffer();
  }
  
  if (name.endsWith('.docx') || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // Attempt Server-Side Conversion (using docx2pdf-converter which requires LibreOffice)
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/analyze-file', {
           method: 'POST',
           body: formData
        });
        
        if (response.ok) {
           const result = await response.json();
           if (result.success && result.pdfBase64) {
               const binaryString = window.atob(result.pdfBase64);
               const len = binaryString.length;
               const bytes = new Uint8Array(len);
               for (let i = 0; i < len; i++) {
                   bytes[i] = binaryString.charCodeAt(i);
               }
               return bytes.buffer;
           }
        }
    } catch (e) {
        // Silently fallback without logging to console
    }

    // Client-side Fallback
    const arrayBuffer = await file.arrayBuffer();
    
    // Create a container for docx-preview to render
    const containerDiv = document.createElement('div');
    containerDiv.style.position = 'absolute';
    containerDiv.style.top = '0px';
    containerDiv.style.left = '0px';
    containerDiv.style.width = '800px'; // Render standard width
    containerDiv.style.zIndex = '-9999';
    containerDiv.style.background = 'white';

    document.body.appendChild(containerDiv);
    
    // Use docx-preview to render the word document directly to the DOM
    await docx.renderAsync(arrayBuffer, containerDiv, undefined, {
        className: "docx",
        inWrapper: false,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false, // Ensure fonts load if possible
        breakPages: true,
        experimental: false,
        trimXmlDeclaration: true,
        useBase64URL: true,
        renderChanges: false,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
    });
    
    // Wait for internal fonts, layout flow, and images to settle
    await new Promise(r => setTimeout(r, 800));
    
    // Docx-preview creates `<section class="docx">` for each page/section
    const sections = containerDiv.querySelectorAll('.docx');
    
    const doc = new jsPDF({ unit: 'in', format: 'letter' });
    let docHasPages = false;
    
    if (sections.length > 0) {
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i] as HTMLElement;
            // Remove box effects that shouldn't appear in analysis
            section.style.boxShadow = 'none';
            section.style.margin = '0';
            section.style.background = '#ffffff';
            section.style.overflow = 'hidden';
            
            // Take snapshot of each section
            const canvas = await html2canvas(section, {
                scale: 1.5, // slightly better resolution for PDF Output
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
                        
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            // scale is 1.5, meaning canvas is 1.5x CSS pixels at 96 DPI
            // CSS pixels to inches: (pixels / 1.5) / 96
            const widthInches = (canvas.width / 1.5) / 96;
            const heightInches = (canvas.height / 1.5) / 96;
            
            if (docHasPages) {
                doc.addPage([widthInches, heightInches], widthInches > heightInches ? 'landscape' : 'portrait');
            } else {
                doc.addPage([widthInches, heightInches], widthInches > heightInches ? 'landscape' : 'portrait');
            }
            docHasPages = true;
            doc.addImage(imgData, 'JPEG', 0, 0, widthInches, heightInches);
        }
    } else {
        // Fallback if no sections were generated
        const canvas = await html2canvas(containerDiv, {
            scale: 1.5,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
                
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgProps = doc.getImageProperties(imgData);
        // Default to a4 proportions
        const a4WidthInches = 8.27;
        const a4HeightInches = 11.69;
        const fullImgHeightInches = (imgProps.height * a4WidthInches) / imgProps.width;
        
        const pagesNeeded = Math.max(1, Math.ceil(fullImgHeightInches / a4HeightInches));
        
        for (let j = 0; j < pagesNeeded; j++) {
            doc.addPage([a4WidthInches, a4HeightInches], 'portrait');
            docHasPages = true;
            doc.addImage(imgData, 'JPEG', 0, -(j * a4HeightInches), a4WidthInches, fullImgHeightInches);
        }
    }
    
    if (docHasPages && doc.getNumberOfPages() > 1) {
       doc.deletePage(1); // delete first uninitialized page
    }
    const pdfBuffer = doc.output('arraybuffer');
    
    document.body.removeChild(containerDiv);
    return pdfBuffer;
  }
  
  if (name.endsWith('.xlsx') || name.endsWith('.csv') || type.includes('spreadsheet')) {
    // Attempt Server-Side Conversion (using docx2pdf-converter which requires LibreOffice)
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/analyze-file', {
           method: 'POST',
           body: formData
        });
        
        if (response.ok) {
           const result = await response.json();
           if (result.success && result.pdfBase64) {
               const binaryString = window.atob(result.pdfBase64);
               const len = binaryString.length;
               const bytes = new Uint8Array(len);
               for (let i = 0; i < len; i++) {
                   bytes[i] = binaryString.charCodeAt(i);
               }
               return bytes.buffer;
           }
        }
    } catch (e) {
        // Silently fallback without logging to console
    }
    
    // Client-side Fallback
    const arrayBuffer = await file.arrayBuffer();
    
    // Convert to PDF (Excel JS reading, then printing basic contents to jsPDF)
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    
    if (name.endsWith('.csv')) {
       const csvText = await file.text();
       // basic fallback parsing for csv strings in exceljs browser
       // @ts-ignore
       if (workbook.csv && workbook.csv.read) {
           // not usually supported without stream
       }
       const sheet = workbook.addWorksheet('CSV Data');
       const lines = csvText.split('\n');
       lines.forEach((line, i) => {
         sheet.getRow(i+1).values = line.split(',');
       });
    } else {
       await workbook.xlsx.load(arrayBuffer);
    }
    
    const doc = new jsPDF();
    let y = 10;
        
    workbook.eachSheet((worksheet, sheetId) => {
        doc.setFontSize(14);
        doc.text(`Sheet: ${worksheet.name}`, 10, y);
        y += 10;
        doc.setFontSize(10);
        
        worksheet.eachRow((row, rowNumber) => {
           const rowValues = row.values ? JSON.stringify(row.values).replace(/[\[\]"]/g, " ") : "";
           const textLines = doc.splitTextToSize(rowValues, 180);
           for(let textLine of textLines) {
               if (y > 280) {
                  doc.addPage();
                  y = 10;
               }
               doc.text(textLine, 10, y);
               y += 5; // compact spacing
           }
        });
        
        if (y > 10) {
           doc.addPage();
           y = 10;
        }
    });
    
    // delete last empty page
    if (doc.getNumberOfPages() > 1) {
        doc.deletePage(doc.getNumberOfPages());
    }
    return doc.output('arraybuffer');
  }
  
  if (name.match(/\.(jpg|jpeg|png)$/i) || type.startsWith('image/')) {
    const dataUrl = await fileToDataURL(file);
    return new Promise<ArrayBuffer>((resolve) => {
       const img = new Image();
       img.onload = () => {
          const doc = new jsPDF({
             orientation: img.width > img.height ? 'landscape' : 'portrait',
             unit: 'px',
             format: [img.width, img.height]
          });
          doc.addImage(dataUrl, name.match(/\.png$/i) ? 'PNG' : 'JPEG', 0, 0, img.width, img.height);
          resolve(doc.output('arraybuffer'));
       };
       img.src = dataUrl;
    });
  }
  
  throw new Error("Unsupported file type");
}

export async function analyzePdfBuffer(arrayBuffer: ArrayBuffer): Promise<PageAnalysis[]> {
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  const numPages = pdf.numPages;
  const results: PageAnalysis[] = [];
  
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    
    // Exact sizing in points
    const fullViewport = page.getViewport({ scale: 1.0 });
    const widthInches = fullViewport.width / 72;
    const heightInches = fullViewport.height / 72;
    const w = Math.min(widthInches, heightInches);
    const h = Math.max(widthInches, heightInches);
    
    let sizeName = 'Custom';
    const isApprox = (val: number, target: number) => Math.abs(val - target) < 0.3;
    if (isApprox(w, 8.27) && isApprox(h, 11.69)) sizeName = 'A4';
    else if (isApprox(w, 8.5) && isApprox(h, 11.0)) sizeName = 'Short/Letter';
    else if (isApprox(w, 8.5) && isApprox(h, 13.0)) sizeName = '8.5" x 13"';
    else if (isApprox(w, 8.5) && isApprox(h, 14.0)) sizeName = 'Long/Legal';
    else if (isApprox(w, 11.69) && isApprox(h, 16.54)) sizeName = 'A3';
    else if (isApprox(w, 5.8) && isApprox(h, 8.3)) sizeName = 'A5';
    
    const pageSize = `${sizeName} (${w.toFixed(1)}" x ${h.toFixed(1)}")`;

    const viewport = page.getViewport({ scale: 0.5 }); // Lower scale for faster pixel analysis
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) continue;
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
    
    // Attempt to find image usages via operator list
    let hasImages = false;
    try {
      const opList = await page.getOperatorList();
      const imageOps = [
        pdfjsLib.OPS.paintImageXObject,
        pdfjsLib.OPS.paintImageXObjectRepeat,
        pdfjsLib.OPS.paintImageMaskXObject,
        pdfjsLib.OPS.paintImageMaskXObjectGroup,
        pdfjsLib.OPS.paintImageMaskXObjectRepeat,
        pdfjsLib.OPS.paintInlineImageXObject,
        pdfjsLib.OPS.paintInlineImageXObjectGroup,
        pdfjsLib.OPS.paintXObject,
      ];
      if (opList.fnArray.some(op => imageOps.includes(op))) {
        hasImages = true;
      }
    } catch(e) {}

    const pixelStats = analyzeCanvasPixels(ctx, canvas.width, canvas.height, hasImages);
    
    let textSummary = '';
    try {
      const textContent = await page.getTextContent();
      const rawText = textContent.items.map((item: any) => item.str).join(' ').replace(/\s+/g, ' ').trim();
      if (rawText) {
         textSummary = rawText.substring(0, 80) + (rawText.length > 80 ? '...' : '');
      } else {
         textSummary = hasImages ? 'Image / Scanned Content' : 'Empty';
      }
    } catch(e) {}
    
    results.push({
      page: i,
      ...pixelStats,
      textSummary,
      pageSize
    });
  }
  
  return results;
}
