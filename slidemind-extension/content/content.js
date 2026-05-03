(() => {
  const SlideMind = (window.SlideMind = window.SlideMind || {});

  const hasDeps = () =>
    SlideMind.startDomWatcher &&
    SlideMind.initUI &&
    SlideMind.ensurePanelMounted &&
    SlideMind.initBridge &&
    SlideMind.pdfEngine &&
    SlideMind.pdfState &&
    SlideMind.utils &&
    SlideMind.constants;

  const waitForDeps = (attemptsLeft = 60) => new Promise((resolve, reject) => {
    if (hasDeps()) {
      resolve();
      return;
    }

    if (attemptsLeft <= 0) {
      reject(new Error("SlideMind dependencies not ready"));
      return;
    }

    window.setTimeout(() => {
      waitForDeps(attemptsLeft - 1).then(resolve).catch(reject);
    }, 50);
  });

  const waitForElement = (id, attemptsLeft = 60) => new Promise((resolve, reject) => {
    const element = document.getElementById(id);
    if (element) {
      resolve(element);
      return;
    }

    if (attemptsLeft <= 0) {
      reject(new Error(`SlideMind element not found: ${id}`));
      return;
    }

    window.setTimeout(() => {
      waitForElement(id, attemptsLeft - 1).then(resolve).catch(reject);
    }, 50);
  });

  const setPageInfo = () => {
    const info = document.getElementById("slidemind-page-info");
    if (!info) {
      return;
    }

    const state = SlideMind.pdfState;
    const pdfDoc = state?.getPdfDoc?.();
    if (!pdfDoc) {
      info.textContent = "No PDF loaded";
      return;
    }

    const name = state.getCurrentFileName();
    info.textContent = `${name} - Page ${state.getCurrentPage()} / ${state.getTotalPages()}`;
  };

  const wireControls = () => {
    const uploadButton = document.getElementById("slidemind-upload-btn");
    const prevButton = document.getElementById("slidemind-prev-btn");
    const nextButton = document.getElementById("slidemind-next-btn");
    const fileInput = document.getElementById("slidemind-pdf-upload");

    if (uploadButton && uploadButton.dataset.bound !== "true") {
      uploadButton.dataset.bound = "true";
      uploadButton.addEventListener("click", () => {
        console.info("[SlideMind] upload button clicked");
        const input = document.getElementById("slidemind-pdf-upload");
        if (!input) {
          console.warn("SlideMind upload input missing.");
          return;
        }
        input.value = "";
        input.click();
      });
    }

    if (fileInput && fileInput.dataset.bound !== "true") {
      fileInput.dataset.bound = "true";
      fileInput.addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        if (!file) {
          return;
        }

        try {
          await SlideMind.pdfEngine.loadPDF(file);
          setPageInfo();
        } catch (error) {
          console.error("SlideMind failed to load PDF.", error);
          setPageInfo();
        }
      });
    }

    if (prevButton && prevButton.dataset.bound !== "true") {
      prevButton.dataset.bound = "true";
      prevButton.addEventListener("click", async () => {
        try {
          if (!SlideMind.pdfState.getPdfDoc()) {
            console.warn("SlideMind: No PDF uploaded.");
            setPageInfo();
            return;
          }

          await SlideMind.pdfEngine.prevPage();
          setPageInfo();
        } catch (error) {
          console.error("SlideMind failed to render previous page.", error);
        }
      });
    }

    if (nextButton && nextButton.dataset.bound !== "true") {
      nextButton.dataset.bound = "true";
      nextButton.addEventListener("click", async () => {
        try {
          if (!SlideMind.pdfState.getPdfDoc()) {
            console.warn("SlideMind: No PDF uploaded.");
            setPageInfo();
            return;
          }

          await SlideMind.pdfEngine.nextPage();
          setPageInfo();
        } catch (error) {
          console.error("SlideMind failed to render next page.", error);
        }
      });
    }
  };

  const ensureInjected = async () => {
    SlideMind.initUI();
    SlideMind.initBridge();

    try {
      await waitForElement("slidemind-pdf-canvas");
      await SlideMind.pdfEngine.initializePDFEngine();
    } catch (error) {
      console.error("[SlideMind] PDF engine init error", error);
    }

    wireControls();
    setPageInfo();
    SlideMind.__injected = true;
  };

  const startWatchdog = () => {
    SlideMind.ensurePanelMounted();
    wireControls();

    window.setInterval(() => {
      const remounted = SlideMind.ensurePanelMounted();
      if (remounted) {
        wireControls();
        setPageInfo();
      }
    }, 1500);
  };

  const start = () => {
    SlideMind.startDomWatcher({ onReady: ensureInjected });
    ensureInjected();
    startWatchdog();
  };

  waitForDeps()
    .then(start)
    .catch((error) => {
      console.error("SlideMind failed to start.", error);
    });

  console.info("[SlideMind] loaded file content/content.js");
})();
