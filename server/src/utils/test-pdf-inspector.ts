/**
 * PDF Inspection and Structural Quality Verification Tool
 * Parses PDF binary structures, extracts /ToUnicode CMaps,
 * verifies A4 dimensions (595.28 x 841.89 pt), validates page counts,
 * detects blank pages, and verifies page-by-page text flow.
 *
 * Run: npx tsx src/utils/test-pdf-inspector.ts
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

export interface PageInspectionResult {
  pageNumber: number;
  text: string;
  charCount: number;
  headings: string[];
  isBlank: boolean;
}

export interface PdfInspectionResult {
  filePath: string;
  fileName: string;
  isValidPdf: boolean;
  hasMagicHeader: boolean;
  hasEofTrailer: boolean;
  version: string;
  pageCount: number;
  isStandardA4: boolean;
  pageDimensions: Array<{ widthPt: number; heightPt: number; widthMm: number; heightMm: number }>;
  pages: PageInspectionResult[];
  hasBlankPages: boolean;
  fileSizeBytes: number;
  extractedAllText: string;
}

/**
 * Inspect a PDF Buffer and return comprehensive structural and textual metrics.
 */
export function inspectPdfBuffer(buffer: Buffer, fileName = 'document.pdf', filePath = ''): PdfInspectionResult {
  const pdfString = buffer.toString('binary');

  // 1. Header & Trailer Verification
  const headerMatch = buffer.subarray(0, 16).toString('utf-8').match(/%PDF-(\d+\.\d+)/);
  const hasMagicHeader = !!headerMatch;
  const version = headerMatch ? headerMatch[1] : 'unknown';

  const trailerSnippet = buffer.subarray(Math.max(0, buffer.length - 128)).toString('utf-8');
  const hasEofTrailer = trailerSnippet.includes('%%EOF');

  // 2. Objects and Streams Extraction
  const objects: Record<string, string> = {};
  const objRegex = /(\d+)\s+(\d+)\s+obj([\s\S]*?)endobj/g;
  let m: RegExpExecArray | null;
  while ((m = objRegex.exec(pdfString)) !== null) {
    objects[m[1]] = m[3];
  }

  // 3. Multi-Font ToUnicode CMap Parsing
  const fontCmaps: Record<string, Record<string, string>> = {};
  const fontBlocks = pdfString.match(/\/Font\s*<<([\s\S]*?)>>/g) || [];

  fontBlocks.forEach((fb) => {
    const fontRegex = /\/([F\w]+)\s+(\d+)\s+0\s+R/g;
    let fm: RegExpExecArray | null;
    while ((fm = fontRegex.exec(fb)) !== null) {
      const fontName = fm[1];
      const fontObjId = fm[2];
      const fontDef = objects[fontObjId] || '';
      const toUnicodeMatch = fontDef.match(/\/ToUnicode\s+(\d+)\s+0\s+R/);
      if (toUnicodeMatch) {
        const tuId = toUnicodeMatch[1];
        const tuObj = objects[tuId] || '';
        const sm = tuObj.match(/stream\r?\n([\s\S]*?)\r?\nendstream/);
        if (sm) {
          try {
            const cmapText = zlib.inflateSync(Buffer.from(sm[1], 'binary')).toString('utf-8');
            const cmap: Record<string, string> = {};

            // 1. Scoped parse for beginbfchar ... endbfchar
            const bfcharBlocks = cmapText.match(/beginbfchar([\s\S]*?)endbfchar/g) || [];
            for (const block of bfcharBlocks) {
              const charMatches = block.match(/<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>/g) || [];
              for (const cm of charMatches) {
                const parts = cm.match(/<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>/);
                if (parts) {
                  cmap[parts[1].toLowerCase()] = String.fromCharCode(parseInt(parts[2], 16));
                }
              }
            }

            // 2. Scoped parse for beginbfrange ... endbfrange
            const bfrangeBlocks = cmapText.match(/beginbfrange([\s\S]*?)endbfrange/g) || [];
            for (const block of bfrangeBlocks) {
              const rangeMatches = block.match(/<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>/g) || [];
              for (const rm of rangeMatches) {
                const parts = rm.match(/<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>/);
                if (parts) {
                  let target = parseInt(parts[3], 16);
                  for (let g = parseInt(parts[1], 16); g <= parseInt(parts[2], 16); g++) {
                    cmap[g.toString(16).padStart(parts[1].length, '0').toLowerCase()] = String.fromCharCode(target++);
                  }
                }
              }
            }
            fontCmaps[fontName] = cmap;
          } catch {}
        }
      }
    }
  });

  // 4. Page Hierarchy and Dimensions
  const pageObjIds: string[] = [];
  for (const [id, content] of Object.entries(objects)) {
    if (content.includes('/Type /Page') && !content.includes('/Type /Pages')) {
      pageObjIds.push(id);
    }
  }

  // If no explicit Page objects, fallback to count in Pages catalog
  const countMatch = pdfString.match(/\/Count\s+(\d+)/);
  const totalPages = pageObjIds.length > 0 ? pageObjIds.length : countMatch ? parseInt(countMatch[1], 10) : 1;

  // MediaBox extraction
  const pageDimensions: Array<{ widthPt: number; heightPt: number; widthMm: number; heightMm: number }> = [];
  let isStandardA4 = true;

  const mediaBoxRegex = /\/MediaBox\s*\[\s*([\d\.\s]+)\s*\]/g;
  let mbMatch: RegExpExecArray | null;
  while ((mbMatch = mediaBoxRegex.exec(pdfString)) !== null) {
    const nums = mbMatch[1].trim().split(/\s+/).map(Number);
    if (nums.length >= 4) {
      const widthPt = nums[2];
      const heightPt = nums[3];
      const widthMm = parseFloat(((widthPt / 72) * 25.4).toFixed(1));
      const heightMm = parseFloat(((heightPt / 72) * 25.4).toFixed(1));

      pageDimensions.push({ widthPt, heightPt, widthMm, heightMm });

      // Standard A4 is 595.28 pt x 841.89 pt (tolerance ± 2pt)
      if (Math.abs(widthPt - 595.28) > 2 || Math.abs(heightPt - 841.89) > 2) {
        isStandardA4 = false;
      }
    }
  }

  // 5. Page-by-Page Multi-Font Text Extraction
  const pages: PageInspectionResult[] = [];
  let allDecodedText = '';

  const decodeStreamText = (streamText: string): string => {
    let activeFont = '';
    let extracted = '';

    // Tokenize stream by font changes, text operators, and positioning
    const tokens = streamText.split(
      /(?=\/[F\w]+\s+[\d\.]+\s+Tf)|(?<=Tf)|(?=\[[\s\S]*?\]\s*TJ)|(?<=\]\s*TJ)|(?=<[0-9a-fA-F]+>\s*T[jJ])|(?<=[0-9a-fA-F]+>\s*T[jJ])|(?=ET\b)|(?<=ET\b)|(?=Tm\b)|(?<=Tm\b)/
    );

    tokens.forEach((tok) => {
      const fontMatch = tok.match(/\/([F\w]+)\s+[\d\.]+\s+Tf/);
      if (fontMatch) {
        activeFont = fontMatch[1];
      }

      const activeCmap = fontCmaps[activeFont] || {};

      if (tok.includes('ET') || tok.includes('Tm')) {
        extracted += ' ';
      }

      // Handle Tj operator
      const tjMatch = tok.match(/<([0-9a-fA-F]+)>\s*T[jJ]/);
      if (tjMatch) {
        const hex = tjMatch[1];
        for (let c = 0; c < hex.length; c += 4) {
          const g = hex.substr(c, 4).toLowerCase();
          extracted += activeCmap[g] || '';
        }
      }

      // Handle TJ array operator
      const tjArrMatch = tok.match(/\[([\s\S]*?)\]\s*TJ/);
      if (tjArrMatch) {
        const hexMatches = tjArrMatch[1].match(/<([0-9a-fA-F]+)>/g) || [];
        hexMatches.forEach((hm) => {
          const hex = hm.replace(/[<>]/g, '');
          for (let c = 0; c < hex.length; c += 4) {
            const g = hex.substr(c, 4).toLowerCase();
            extracted += activeCmap[g] || '';
          }
        });
      }

      // Handle literal strings
      const litMatch = tok.match(/\((.*?)\)\s*T[jJ]/);
      if (litMatch) {
        extracted += litMatch[1];
      }
    });

    return extracted.length > 0 ? extracted : streamText;
  };

  pageObjIds.forEach((pId, idx) => {
    const pageContent = objects[pId];
    let pageRawStream = '';

    // Follow /Contents reference
    const contentsMatch = pageContent.match(/\/Contents\s+(\d+)\s+0\s+R/);
    if (contentsMatch && objects[contentsMatch[1]]) {
      const sObj = objects[contentsMatch[1]];
      const sm = sObj.match(/stream\r?\n([\s\S]*?)\r?\nendstream/);
      if (sm) {
        try {
          pageRawStream = zlib.inflateSync(Buffer.from(sm[1], 'binary')).toString('utf-8');
        } catch {
          pageRawStream = sm[1];
        }
      }
    }

    const decoded = decodeStreamText(pageRawStream);
    const cleanText = decoded
      .replace(/[^a-zA-Z0-9\s,\.\-:\/@\(\)\+•#_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    allDecodedText += cleanText + '\n';

    // Extract potential headings
    const headings: string[] = [];
    const knownHeadings = [
      'Professional Summary',
      'Executive Profile',
      'Professional Experience',
      'Experience & Leadership',
      'Work Experience',
      'Education',
      'Projects',
      'Key Projects',
      'Featured Projects',
      'Technical Skills',
      'Expertise',
      'Honors & Certifications',
      'Honors, Awards & Certifications',
      'Languages',
    ];

    for (const h of knownHeadings) {
      if (cleanText.toLowerCase().includes(h.toLowerCase())) {
        headings.push(h);
      }
    }

    // A page is considered blank if it has fewer than 20 readable alphanumeric characters
    const isBlank = cleanText.length < 20;

    pages.push({
      pageNumber: idx + 1,
      text: cleanText,
      charCount: cleanText.length,
      headings,
      isBlank,
    });
  });

  const hasBlankPages = pages.some((p) => p.isBlank);

  return {
    filePath,
    fileName,
    isValidPdf: hasMagicHeader && hasEofTrailer,
    hasMagicHeader,
    hasEofTrailer,
    version,
    pageCount: totalPages,
    isStandardA4,
    pageDimensions,
    pages,
    hasBlankPages,
    fileSizeBytes: buffer.length,
    extractedAllText: allDecodedText,
  };
}

/**
 * Inspect a PDF file from disk.
 */
export function inspectPdfFile(filePath: string): PdfInspectionResult {
  const buffer = fs.readFileSync(filePath);
  return inspectPdfBuffer(buffer, path.basename(filePath), filePath);
}

// ─────────────────────────────────────────────────────────────
// Standalone Runner
// ─────────────────────────────────────────────────────────────
async function main() {
  const qaDir = path.resolve(__dirname, '../../test_qa_output');
  if (!fs.existsSync(qaDir)) {
    console.log('No test_qa_output directory found. Run test-qa-diagnostics.ts first.');
    return;
  }

  const files = fs.readdirSync(qaDir).filter((f) => f.endsWith('.pdf'));
  console.log(`\nInspecting ${files.length} generated PDF files in ${qaDir}...\n`);

  let allValid = true;
  let allA4 = true;
  let anyBlank = false;

  for (const file of files) {
    const fullPath = path.join(qaDir, file);
    const result = inspectPdfFile(fullPath);

    if (!result.isValidPdf) allValid = false;
    if (!result.isStandardA4) allA4 = false;
    if (result.hasBlankPages) anyBlank = true;

    const dimStr =
      result.pageDimensions.length > 0
        ? `${result.pageDimensions[0].widthMm} x ${result.pageDimensions[0].heightMm} mm (${result.pageDimensions[0].widthPt} x ${result.pageDimensions[0].heightPt} pt)`
        : 'N/A';

    console.log(`[${result.fileName}]`);
    console.log(`  Pages: ${result.pageCount} | Size: ${(result.fileSizeBytes / 1024).toFixed(1)} KB | Dim: ${dimStr}`);
    console.log(`  Valid PDF: ${result.isValidPdf ? '✓' : '✗'} (v${result.version}) | Standard A4: ${result.isStandardA4 ? '✓' : '✗'} | Blank pages: ${result.hasBlankPages ? 'FAIL' : 'None'}`);

    result.pages.forEach((p) => {
      console.log(`    Page ${p.pageNumber}: ${p.charCount} chars | Headings: [${p.headings.join(', ') || 'None'}]`);
    });
    console.log('');
  }

  console.log('======================================================');
  console.log(`Inspection Summary:`);
  console.log(`  All PDFs Valid: ${allValid ? 'YES' : 'NO'}`);
  console.log(`  All Standard A4 (210 x 297 mm): ${allA4 ? 'YES' : 'NO'}`);
  console.log(`  Any Unexpected Blank Pages: ${anyBlank ? 'YES (Defect!)' : 'NO (Clean)'}`);
  console.log('======================================================\n');
}

if (require.main === module) {
  main().catch(console.error);
}
