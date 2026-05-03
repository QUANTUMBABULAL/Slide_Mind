(() => {
  const SlideMind = (window.SlideMind = window.SlideMind || {});

  const CANVAS_ID = "slidemind-pdf-canvas";
  const CONTAINER_ID = "slidemind-canvas-container";

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

  SlideMind.pdfEngine = {
    initializePDFEngine: async () => {
      if (!window.pdfjsLib) {
        const error = new Error("window.pdfjsLib missing from libs/pdf.min.js");
        console.error("[SlideMind] PDF.js initialization failed", error);
        throw error;
      }

      window.pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("libs/pdf.worker.min.js");
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
