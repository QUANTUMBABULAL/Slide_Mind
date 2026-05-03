(() => {
  const SlideMind = (window.SlideMind = window.SlideMind || {});

  SlideMind.annotationLayer = {
    createAnnotationLayer: () => {
      // TODO: Build canvas overlay for pen drawing.
      return {
        attach: () => {},
        detach: () => {},
        clear: () => {}
      };
    }
  };

  console.info("[SlideMind] loaded file pdf/annotationLayer.js");
})();
