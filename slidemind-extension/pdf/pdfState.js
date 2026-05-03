(() => {
  const SlideMind = (window.SlideMind = window.SlideMind || {});

  const state = {
    pdfDoc: null,
    currentPage: 1,
    totalPages: 0,
    zoomLevel: 1,
    currentFileName: ""
  };

  SlideMind.pdfState = {
    getPdfDoc: () => state.pdfDoc,
    setPdfDoc: (pdfDoc) => {
      state.pdfDoc = pdfDoc;
    },
    getCurrentPage: () => state.currentPage,
    setCurrentPage: (pageNumber) => {
      state.currentPage = pageNumber;
    },
    getTotalPages: () => state.totalPages,
    setTotalPages: (totalPages) => {
      state.totalPages = totalPages;
    },
    getZoomLevel: () => state.zoomLevel,
    setZoomLevel: (zoomLevel) => {
      state.zoomLevel = zoomLevel;
    },
    getCurrentFileName: () => state.currentFileName,
    setCurrentFileName: (fileName) => {
      state.currentFileName = fileName;
    },
    reset: () => {
      state.pdfDoc = null;
      state.currentPage = 1;
      state.totalPages = 0;
      state.zoomLevel = 1;
      state.currentFileName = "";
    },
    getSnapshot: () => ({
      pdfDoc: state.pdfDoc,
      currentPage: state.currentPage,
      totalPages: state.totalPages,
      zoomLevel: state.zoomLevel,
      currentFileName: state.currentFileName
    })
  };

  console.info("[SlideMind] loaded file pdf/pdfState.js");
})();
