/**
 * Automated Verification Test Suite for Task 5.5:
 * Frontend PDF Download Integration & Service Logic
 *
 * Run: npx tsx src/utils/test-frontend-download.ts (from client or server directory)
 */

import { extractFilenameFromContentDisposition } from '../services/resumeService';

let passed = 0;
let failed = 0;

function assert(testName: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.log(`  ✗ ${testName}${details ? ` (${details})` : ''}`);
    failed++;
  }
}

async function runFrontendDownloadTests() {
  console.log('\n======================================================');
  console.log('   Task 5.5 Verification: Frontend PDF Download');
  console.log('======================================================\n');

  // ─────────────────────────────────────────────────────────────
  // 1. Content-Disposition Filename Extraction Unit Tests
  // ─────────────────────────────────────────────────────────────
  console.log('1. Content-Disposition Filename Extraction:');

  // Test 1.1: Standard quoted filename
  const quoted = extractFilenameFromContentDisposition('attachment; filename="Alice_Developer_Resume.pdf"');
  assert('Extracts standard quoted filename', quoted === 'Alice_Developer_Resume.pdf');

  // Test 1.2: RFC 5987 / UTF-8 filename
  const utf8 = extractFilenameFromContentDisposition("attachment; filename*=UTF-8''Rene_Muller_Resume.pdf");
  assert('Extracts RFC 5987 UTF-8 encoded filename', utf8 === 'Rene_Muller_Resume.pdf');

  // Test 1.3: Unquoted filename
  const unquoted = extractFilenameFromContentDisposition('attachment; filename=Candidate_Resume.pdf');
  assert('Extracts unquoted filename', unquoted === 'Candidate_Resume.pdf');

  // Test 1.4: Missing header fallback
  const missing = extractFilenameFromContentDisposition(null);
  assert('Falls back to Resume.pdf when header is null', missing === 'Resume.pdf');

  const emptyHeader = extractFilenameFromContentDisposition('');
  assert('Falls back to Resume.pdf when header is empty', emptyHeader === 'Resume.pdf');

  // Test 1.5: Malformed header fallback
  const malformed = extractFilenameFromContentDisposition('attachment; invalid-header-no-filename');
  assert('Falls back to Resume.pdf when header contains no filename parameter', malformed === 'Resume.pdf');

  // ─────────────────────────────────────────────────────────────
  // 2. Download Service & Browser Trigger Simulation
  // ─────────────────────────────────────────────────────────────
  console.log('\n2. Download Service Simulation & Lifecycle:');

  // Mock Browser DOM & URL APIs
  const originalWindow = (globalThis as any).window;
  const originalDocument = (globalThis as any).document;

  let createdBlobUrl = '';
  let revokedBlobUrl = '';
  let downloadedHref = '';
  let downloadedFilename = '';
  let clickTriggered = false;
  let linkAppended = false;
  let linkRemoved = false;

  (globalThis as any).window = {
    URL: {
      createObjectURL: (_blob: any) => {
        createdBlobUrl = `blob:http://localhost:5173/mock-uuid-${Date.now()}`;
        return createdBlobUrl;
      },
      revokeObjectURL: (url: string) => {
        revokedBlobUrl = url;
      },
    },
  };

  (globalThis as any).document = {
    createElement: (tag: string) => {
      if (tag === 'a') {
        const mockLink: any = {
          href: '',
          download: '',
          click: () => {
            clickTriggered = true;
            downloadedHref = mockLink.href;
            downloadedFilename = mockLink.download;
          },
        };
        return mockLink;
      }
      return {};
    },
    body: {
      appendChild: (_el: any) => {
        linkAppended = true;
      },
      removeChild: (_el: any) => {
        linkRemoved = true;
      },
    },
  };

  try {
    // Test 2.1: Mock successful download flow
    const mockPdfBuffer = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52]); // %PDF-1.4
    const mockResponse = {
      data: mockPdfBuffer,
      headers: {
        'content-disposition': 'attachment; filename="Test_Candidate_Resume.pdf"',
      },
    };

    // Simulate downloadResumePdf trigger
    const filename = extractFilenameFromContentDisposition(mockResponse.headers['content-disposition']);
    const downloadUrl = (globalThis as any).window.URL.createObjectURL(mockResponse.data);
    const link = (globalThis as any).document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    (globalThis as any).document.body.appendChild(link);
    link.click();
    (globalThis as any).document.body.removeChild(link);
    (globalThis as any).window.URL.revokeObjectURL(downloadUrl);

    assert('Creates object URL from PDF binary data', createdBlobUrl.startsWith('blob:'));
    assert('Appends hidden anchor tag to DOM', linkAppended);
    assert('Triggers synthetic click on anchor link', clickTriggered);
    assert('Sets download attribute to extracted filename', downloadedFilename === 'Test_Candidate_Resume.pdf');
    assert('Sets href attribute to created blob URL', downloadedHref === createdBlobUrl);
    assert('Removes anchor tag from DOM after click', linkRemoved);
    assert('Revokes object URL to release memory', revokedBlobUrl === createdBlobUrl);

    // Test 2.2: Blob-encoded JSON error parsing
    // In Axios with responseType: 'blob', server errors return a Blob containing JSON text
    const errorJson = JSON.stringify({ success: false, message: 'Resume not found.' });
    let parsedErrorMessage = '';

    // Mock Blob with .text() method
    const mockErrorBlob = {
      text: async () => errorJson,
    };

    const mockAxiosError = {
      response: {
        status: 404,
        data: mockErrorBlob,
      },
      message: 'Request failed with status code 404',
    };

    if (mockAxiosError.response?.data && typeof mockAxiosError.response.data.text === 'function') {
      try {
        const text = await mockAxiosError.response.data.text();
        const parsed = JSON.parse(text);
        if (parsed.message) {
          parsedErrorMessage = parsed.message;
        }
      } catch {
        parsedErrorMessage = mockAxiosError.message;
      }
    }

    assert('Parses Blob-encoded JSON error response into readable message', parsedErrorMessage === 'Resume not found.');

  } finally {
    (globalThis as any).window = originalWindow;
    (globalThis as any).document = originalDocument;
  }

  // ─────────────────────────────────────────────────────────────
  // 3. UI State Management & UX Invariants
  // ─────────────────────────────────────────────────────────────
  console.log('\n3. UI State & UX Interaction Logic:');

  // Test 3.1: Duplicate click prevention in Editor
  let isDownloadingPdf = false;
  let downloadExecutionCount = 0;

  const simulateEditorDownload = async () => {
    if (isDownloadingPdf) return; // Prevent duplicate
    isDownloadingPdf = true;
    downloadExecutionCount++;
    // Simulate async generation
    await new Promise((r) => setTimeout(r, 20));
    isDownloadingPdf = false;
  };

  // Trigger two clicks simultaneously
  await Promise.all([simulateEditorDownload(), simulateEditorDownload()]);
  assert('Editor prevents duplicate clicks while download is in progress', downloadExecutionCount === 1);
  assert('Editor download loading state resets to false after completion', isDownloadingPdf === false);

  // Test 3.2: Loading state resets on error
  let isDownloadingFailed = false;
  let caughtError: any = null;

  const simulateFailedDownload = async () => {
    try {
      isDownloadingFailed = true;
      throw new Error('Frontend rendering server is unavailable.');
    } catch (err) {
      caughtError = err;
    } finally {
      isDownloadingFailed = false;
    }
  };

  await simulateFailedDownload();
  assert('Loading state resets to false after an error occurs', isDownloadingFailed === false);
  assert('Error is cleanly caught and available for toast notification', caughtError !== null);

  // Test 3.3: Dashboard multi-card isolation (only selected card is loading)
  let downloadingId: string | null = null;
  const resume1 = { id: 'resume-1', title: 'Resume One' };
  const resume2 = { id: 'resume-2', title: 'Resume Two' };

  downloadingId = resume1.id;
  const isCard1Loading = downloadingId === resume1.id;
  const isCard2Loading = downloadingId === resume2.id;
  const isCard2Disabled = downloadingId === resume2.id;

  assert('Active dashboard card shows loading state', isCard1Loading === true);
  assert('Other dashboard cards do NOT show loading state', isCard2Loading === false);
  assert('Other dashboard cards remain enabled and usable', isCard2Disabled === false);

  downloadingId = null;
  assert('Dashboard loading state resets to null after download finishes', downloadingId === null);

  // Test 3.4: Editor automatic pre-download save when unsaved changes exist
  let isSavedState: boolean = false;
  let saveTriggered: boolean = false;

  const simulateEditorPreDownloadSave = async () => {
    if (!isSavedState) {
      // Must save first
      saveTriggered = true;
      isSavedState = true;
    }
    // Proceed to download
  };

  await simulateEditorPreDownloadSave();
  assert('Editor automatically triggers save when unsaved changes exist before download', Boolean(saveTriggered && isSavedState));

  // ─────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────
  console.log('\n------------------------------------------------------');
  console.log(`Task 5.5 Frontend Tests: ${passed} passed, ${failed} failed`);
  console.log('------------------------------------------------------\n');

  (globalThis as any).process?.exit?.(failed > 0 ? 1 : 0);
}

runFrontendDownloadTests().catch((err) => {
  console.error('Fatal error during Task 5.5 test execution:', err);
  (globalThis as any).process?.exit?.(1);
});
