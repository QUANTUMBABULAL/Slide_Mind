const openButton = document.getElementById("open-chatgpt");

openButton.addEventListener("click", () => {
  chrome.tabs.create({ url: "https://chatgpt.com/" });
});
