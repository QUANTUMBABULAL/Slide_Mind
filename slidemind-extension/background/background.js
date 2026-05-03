chrome.runtime.onInstalled.addListener(() => {
  console.info("SlideMind installed.");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") {
    return false;
  }

  if (message.type === "SLIDEMIND_PING") {
    sendResponse({ ok: true, timestamp: Date.now() });
    return true;
  }

  // TODO: Route background actions like storage, capture, and ChatGPT automation.
  return false;
});
