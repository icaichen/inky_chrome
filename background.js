// background.js — persist state, re-apply on navigation/activation, badge indicator

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["mode", "colorMode"], (s) => {
    if (s.mode === undefined) chrome.storage.local.set({ mode: null });
    // Do not default any color mode; keep it unset until user chooses
    if (s.colorMode === undefined) chrome.storage.local.set({ colorMode: null });
  });
});
chrome.runtime.onStartup.addListener(() => { updateBadgeFromStorage(); });

function isHttp(url) { return /^https?:\/\//.test(url || ""); }
function safeSend(tabId, msg) {
  try { chrome.tabs.sendMessage(tabId, msg, () => { void chrome.runtime.lastError; }); } catch(_) {}
}
function applyToTab(tabId, url) {
  if (!isHttp(url)) return; // ignore chrome://newtab 等
  chrome.storage.local.get(["mode", "colorMode"], ({ mode, colorMode }) => {
    safeSend(tabId, { action: "forceApply", mode, colorMode });
  });
}

// 页面加载完成时尝试恢复
chrome.webNavigation.onCompleted.addListener(({ tabId, url }) => { applyToTab(tabId, url); });
// 激活标签时尝试恢复
chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => { if (tab) applyToTab(tab.id, tab.url); });
});

// 监听 SPA 页面，捕捉 history state 更新
chrome.webNavigation.onHistoryStateUpdated.addListener(({ tabId, url }) => { applyToTab(tabId, url); });

// 徽标同步
chrome.storage.onChanged.addListener((changes) => {
  if (changes.mode || changes.colorMode) updateBadgeFromStorage();
});
function updateBadgeFromStorage() {
  chrome.storage.local.get(["mode"], ({ mode }) => {
    const text = mode === "kindle" ? "K" : mode === "focus" ? "E" : "";
    chrome.action.setBadgeText({ text });
    if (text) chrome.action.setBadgeBackgroundColor({ color: "#222" });
  });
}
