(() => {
  const SlideMind = (window.SlideMind = window.SlideMind || {});

  SlideMind.startDomWatcher = ({ onReady } = {}) => {
    const triggerReady = () => {
      if (typeof onReady === "function") {
        onReady();
      }
    };

    if (document.readyState === "interactive" || document.readyState === "complete") {
      triggerReady();
      return;
    }

    const onLoad = () => {
      triggerReady();
      window.removeEventListener("DOMContentLoaded", onLoad);
    };

    window.addEventListener("DOMContentLoaded", onLoad);

    const observer = new MutationObserver(() => {
      if (document.body) {
        triggerReady();
        observer.disconnect();
      }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
  };

  console.info("[SlideMind] loaded file content/domWatcher.js");
})();
