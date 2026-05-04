(() => {
  const SlideMind = (window.SlideMind = window.SlideMind || {});

  const CANVAS_ID = "slidemind-pdf-canvas";
  const CONTAINER_ID = "slidemind-canvas-container";
  const PDF_JS_VERSION = "4.8.69";
  const PDF_JS_CDN_BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDF_JS_VERSION}`;

  let canvasRef = null;
  let contextRef = null;

  const ensureCanvas = () => {
    const canvas = document.getElementById(CANVAS_ID);
    if (!canvas) {
      throw new Error("SlideMind canvas not found");
    }
    return canvas;
  };

  const getFitWidthScale = (page, baseScale = 1) => {
    const container = document.getElementById(CONTAINER_ID);
    const baseViewport = page.getViewport({ scale: 1 });
    const availableWidth = container?.clientWidth || baseViewport.width;
    return (availableWidth / baseViewport.width) * baseScale;
  };

  const getState = () => SlideMind.pdfState;

  const loadPdfJsFromCdn = async () => {
    if (window.pdfjsLib) {
      return;
    }

    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${PDF_JS_CDN_BASE}/pdf.min.js`;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Failed to load PDF.js from CDN"));
      document.head.appendChild(script);
    });

    if (!window.pdfjsLib) {
      throw new Error("PDF.js script loaded but window.pdfjsLib is still unavailable");
    }
  };

  SlideMind.pdfEngine = {
    initializePDFEngine: async () => {
      if (!window.pdfjsLib) {
        console.warn("[SlideMind] local pdf.min.js missing. Loading PDF.js from CDN fallback.");
        await loadPdfJsFromCdn();
      }

      window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDF_JS_CDN_BASE}/pdf.worker.min.js`;
      console.info("[SlideMind] pdfjs available");

      canvasRef = ensureCanvas();
      contextRef = canvasRef.getContext("2d");
      if (!contextRef) {
        const error = new Error("SlideMind canvas context not available");
        console.error("[SlideMind] PDF.js initialization failed", error);
        throw error;
      }

      console.info("[SlideMind] PDF.js initialized successfully");
      return true;
    },
    loadPDF: async (file) => {
      if (!file) {
        throw new Error("No PDF file selected.");
      }

      const state = getState();
      if (!state) {
        throw new Error("PDF state not available.");
      }

      if (!window.pdfjsLib) {
        await SlideMind.pdfEngine.initializePDFEngine();
      }

      const buffer = await SlideMind.utils.readFileAsArrayBuffer(file);
      const loadingTask = window.pdfjsLib.getDocument({ data: buffer });
      const pdfDoc = await loadingTask.promise;

      state.reset();
      state.setPdfDoc(pdfDoc);
      state.setTotalPages(pdfDoc.numPages);
      state.setCurrentPage(1);
      state.setZoomLevel(1);
      state.setCurrentFileName(file.name || "Untitled PDF");

      await SlideMind.pdfEngine.renderPage(1);
      return state.getSnapshot();
    },
    renderPage: async (pageNumber) => {
      const state = getState();
      if (!state || !state.getPdfDoc()) {
        throw new Error("PDF not loaded.");
      }

      const pdfDoc = state.getPdfDoc();
      const safePage = Math.min(Math.max(1, pageNumber), pdfDoc.numPages);
      const page = await pdfDoc.getPage(safePage);
      const canvas = canvasRef || ensureCanvas();
      const context = contextRef || canvas.getContext("2d");

      const scale = getFitWidthScale(page, state.getZoomLevel());
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;
      state.setCurrentPage(safePage);
      return state.getSnapshot();
    },
    nextPage: async () => {
      const state = getState();
      if (!state || !state.getPdfDoc()) {
        throw new Error("PDF not loaded.");
      }

      const pdfDoc = state.getPdfDoc();
      const next = Math.min(state.getCurrentPage() + 1, pdfDoc.numPages);
      return SlideMind.pdfEngine.renderPage(next);
    },
    prevPage: async () => {
      const state = getState();
      if (!state || !state.getPdfDoc()) {
        throw new Error("PDF not loaded.");
      }

      const prev = Math.max(state.getCurrentPage() - 1, 1);
      return SlideMind.pdfEngine.renderPage(prev);
    }
  };

  console.info("[SlideMind] loaded file pdf/pdfEngine.js");
})();
