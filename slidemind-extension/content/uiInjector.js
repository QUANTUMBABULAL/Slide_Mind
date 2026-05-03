(() => {
  const SlideMind = (window.SlideMind = window.SlideMind || {});

  const ROOT_ID = "slidemind-root";
  const PANEL_ID = "slidemind-panel";
  const ACTIVE_CLASS = "slidemind-active";

  const clampWidth = (value) => Math.min(700, Math.max(260, value));

  const setPanelWidth = (value) => {
    const widthPx = `${clampWidth(value)}px`;
    SlideMind.panelWidthPx = widthPx;
    document.documentElement.style.setProperty("--slidemind-panel-width", widthPx);
    document.body.classList.add(ACTIVE_CLASS);
    document.body.style.paddingLeft = widthPx;
    const panel = document.getElementById(PANEL_ID);
    if (panel) {
      panel.style.width = widthPx;
    }
    return widthPx;
  };

  const applyBodyPadding = () => {
    const fallback =
      (SlideMind.constants && SlideMind.constants.PANEL_WIDTH_PX) || "320px";
    const widthPx = SlideMind.panelWidthPx || fallback;
    const numericWidth = Number.parseInt(widthPx, 10) || 320;
    setPanelWidth(numericWidth);
  };

  const buildPanel = () => {
    const root = document.createElement("div");
    root.id = ROOT_ID;

    const panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.style.width = SlideMind.panelWidthPx || "320px";

    const header = document.createElement("header");
    const title = document.createElement("h1");
    title.textContent = "SlideMind";

    const subtitle = document.createElement("p");
    subtitle.textContent = "AI study workspace (beta)";

    header.append(title, subtitle);

    const hiddenInput = document.createElement("input");
    hiddenInput.type = "file";
    hiddenInput.id = "slidemind-pdf-upload";
    hiddenInput.accept = "application/pdf";
    hiddenInput.className = "slidemind-hidden-input";

    const controls = document.createElement("div");
    controls.className = "slidemind-controls";

    const buttons = [
      { id: "slidemind-upload-btn", label: "Upload PDF", variant: "primary" },
      { id: "slidemind-prev-btn", label: "Prev" },
      { id: "slidemind-next-btn", label: "Next" },
      { id: "slidemind-pen-btn", label: "Pen" },
      { id: "slidemind-ask-btn", label: "Ask AI", variant: "primary" }
    ];

    buttons.forEach((config) => {
      const button = document.createElement("button");
      button.type = "button";
      button.id = config.id;
      button.className = `slidemind-button${config.variant ? " " + config.variant : ""}`;
      button.textContent = config.label;
      controls.appendChild(button);
    });

    const pageInfo = document.createElement("div");
    pageInfo.id = "slidemind-page-info";
    pageInfo.className = "slidemind-page-info";
    pageInfo.textContent = "No PDF loaded";

    const canvasContainer = document.createElement("div");
    canvasContainer.id = "slidemind-canvas-container";
    canvasContainer.className = "slidemind-canvas-container";

    const canvas = document.createElement("canvas");
    canvas.id = "slidemind-pdf-canvas";
    canvas.className = "slidemind-canvas";
    canvasContainer.appendChild(canvas);

    const resizer = document.createElement("div");
    resizer.id = "slidemind-resizer";
    resizer.style.position = "absolute";
    resizer.style.top = "0";
    resizer.style.right = "0";
    resizer.style.width = "6px";
    resizer.style.height = "100%";
    resizer.style.cursor = "col-resize";
    resizer.style.background = "rgba(255, 255, 255, 0.05)";

    panel.append(header, hiddenInput, controls, pageInfo, canvasContainer, resizer);
    root.appendChild(panel);
    return root;
  };

  const attachResizeHandlers = () => {
    const panel = document.getElementById(PANEL_ID);
    const resizer = document.getElementById("slidemind-resizer");
    if (!panel || !resizer || resizer.dataset.bound === "true") {
      return;
    }

    resizer.dataset.bound = "true";
    let startX = 0;
    let startWidth = 0;
    let resizeTimer = null;

    const onMouseMove = (event) => {
      const nextWidth = clampWidth(startWidth + (event.clientX - startX));
      setPanelWidth(nextWidth);
      console.info(`[SlideMind] resize width: ${nextWidth}`);

      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }

      resizeTimer = window.setTimeout(() => {
        const state = SlideMind.pdfState;
        if (state?.getPdfDoc?.()) {
          SlideMind.pdfEngine.renderPage(state.getCurrentPage()).catch((error) => {
            console.error("SlideMind failed to rerender after resize.", error);
          });
        }
      }, 120);
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    resizer.addEventListener("mousedown", (event) => {
      event.preventDefault();
      startX = event.clientX;
      startWidth = panel.getBoundingClientRect().width;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  };

  SlideMind.initUI = () => {
    if (document.getElementById(PANEL_ID)) {
      applyBodyPadding();
      return;
    }

    applyBodyPadding();
    const root = buildPanel();
    document.body.appendChild(root);
    attachResizeHandlers();
    SlideMind.__panelMounted = true;
    console.info("[SlideMind] panel mounted");
  };

  SlideMind.ensurePanelMounted = () => {
    const rootExists = document.getElementById(ROOT_ID);
    if (rootExists) {
      applyBodyPadding();
      return false;
    }

    const wasMounted = Boolean(SlideMind.__panelMounted);
    applyBodyPadding();
    const root = buildPanel();
    document.body.appendChild(root);
    attachResizeHandlers();
    SlideMind.__panelMounted = true;

    if (wasMounted) {
      console.info("[SlideMind] panel remounted after DOM refresh");
    } else {
      console.info("[SlideMind] panel mounted");
    }

    return true;
  };

  console.info("[SlideMind] loaded file content/uiInjector.js");
})();
