// popup.js — handle popup state, highlight active buttons, and forward messages

async function withTab(fn) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || !/^https?:\/\//.test(tab.url)) {
    console.warn("This page is not supported:", tab?.url);
    return;
  }
  return fn(tab);
}

function send(tabId, msg) {
  chrome.tabs.sendMessage(tabId, msg, () => {
    if (chrome.runtime.lastError) {
      console.error("Message error:", chrome.runtime.lastError.message);
    } else {
      console.log("✅ Sent:", msg);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const btnEink = document.getElementById("toggleEink");
  const btnKindle = document.getElementById("toggleKindle");
  const btnFull = document.getElementById("colorFull");
  const btnSoft = document.getElementById("colorSoft");
  const btnBW = document.getElementById("colorBW");
  const btnReader = document.getElementById("toggleReader");


  let currentMode = null;   // "focus" | "kindle" | null
  let currentColor = null;  // "full" | "soft" | "bw" | null
  let readerActive = false;

  function setActive(el, active) {
    if (!el) return;
    if (active) el.classList.add("active"); else el.classList.remove("active");
  }

  function render() {
    setActive(btnEink, currentMode === "focus");
    setActive(btnKindle, currentMode === "kindle");
    setActive(btnFull, currentColor === "full");
    setActive(btnSoft, currentColor === "soft");
    setActive(btnBW, currentColor === "bw");
    setActive(btnReader, readerActive);
  }

  // Initialize from storage; default colorMode to "bw" if not set
  chrome.storage.local.get(["mode", "colorMode", "readerMode"], (s) => {
    currentMode = s.mode ?? null;
    currentColor = s.colorMode ?? "bw";
    readerActive = false;
    render();
  });

  // Reflect external changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.mode) currentMode = changes.mode.newValue ?? null;
    if (changes.colorMode) currentColor = changes.colorMode.newValue ?? null;
    if (changes.readerMode) readerActive = changes.readerMode.newValue ?? false;
    render();
  });

  // Click handlers — optimistic UI + persist + message
  btnEink?.addEventListener("click", () => {
    currentMode = currentMode === "focus" ? null : "focus";
    render();
    chrome.storage.local.set({ mode: currentMode, colorMode: currentColor });
    withTab((tab) => send(tab.id, { action: "toggleEink" }));
  });

  btnKindle?.addEventListener("click", () => {
    currentMode = currentMode === "kindle" ? null : "kindle";
    render();
    chrome.storage.local.set({ mode: currentMode, colorMode: currentColor });
    withTab((tab) => send(tab.id, { action: "toggleKindle" }));
  });

  btnFull?.addEventListener("click", () => {
    currentColor = "full";
    render();
    chrome.storage.local.set({ mode: currentMode, colorMode: currentColor });
    withTab((tab) => send(tab.id, { action: "setColorMode", value: "full" }));
  });

  btnSoft?.addEventListener("click", () => {
    currentColor = "soft";
    render();
    chrome.storage.local.set({ mode: currentMode, colorMode: currentColor });
    withTab((tab) => send(tab.id, { action: "setColorMode", value: "soft" }));
  });

  btnBW?.addEventListener("click", () => {
    currentColor = "bw";
    render();
    chrome.storage.local.set({ mode: currentMode, colorMode: currentColor });
    withTab((tab) => send(tab.id, { action: "setColorMode", value: "bw" }));
  });

  btnReader?.addEventListener("click", () => {
    readerActive = !readerActive; // optimistic toggle
    chrome.storage.local.set({ readerMode: readerActive });
    render();

    withTab(tab => {
      chrome.tabs.sendMessage(tab.id, { action: "toggleReader" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Reader toggle error:", chrome.runtime.lastError.message);
          return;
        }
        if (response && typeof response.enabled !== "undefined") {
          readerActive = response.enabled;
          render(); // ✅ 只更新 UI，不存储到全局
        }
      });
    });
  });

  console.log("✅ Popup loaded");
});
