(() => {
  const SlideMind = (window.SlideMind = window.SlideMind || {});
  SlideMind.utils = SlideMind.utils || {};

  SlideMind.utils.createHiddenFileInput = ({ accept = "application/pdf" } = {}) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.style.display = "none";
    document.body.appendChild(input);
    return input;
  };

  SlideMind.utils.readFileAsArrayBuffer = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });

  console.info("[SlideMind] loaded file utils/fileHelpers.js");
})();
