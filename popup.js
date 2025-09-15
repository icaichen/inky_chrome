// popup.js — per-tab state; reader button driven by content.js, not storage

async function withTab(fn) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || !/^https?:\/\//.test(tab.url)) {
    console.warn("This page is not supported:", tab?.url);
    return;
  }
  return fn(tab);
}

function send(tabId, msg, cb) {
  chrome.tabs.sendMessage(tabId, msg, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Message error:", chrome.runtime.lastError.message);
      cb?.(undefined);
    } else {
      cb?.(response);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const btnEink   = document.getElementById("toggleEink");
  const btnKindle = document.getElementById("toggleKindle");
  const btnReader = document.getElementById("toggleReader");
  const colorSelect = document.getElementById("colorSelect");

  let currentMode  = null;   // "focus" | "kindle" | null  —— 来自 storage
  let currentColor = null;   // "full" | "soft" | "bw" | null —— 来自 storage
  let readerActive = false;  // ✅ 仅来自“当前标签页”的真实状态

  const setActive = (el, on) => el && (on ? el.classList.add("active") : el.classList.remove("active"));

  function render() {
    setActive(btnEink,   currentMode === "focus");
    setActive(btnKindle, currentMode === "kindle");
    setActive(btnReader, readerActive);

    // 下拉框永远可见；无模式时显示空值（点了也不会生效）
    colorSelect.style.display = "block";
    colorSelect.value = !currentMode ? "" : (currentColor ?? "");
  }

  // ---- 初始化：模式/颜色仍沿用 storage，阅读模式改成只看“当前页回报” ----
  chrome.storage.local.get(["mode", "colorMode"], (s) => {
    currentMode  = s.mode ?? null;
    currentColor = s.colorMode ?? null;
    render();

    // 同步“当前标签页”的实际阅读状态
    withTab(tab => {
      send(tab.id, { action: "getState" }, (resp) => {
        // 期望 content.js 返回 { mode, colorMode, readerEnabled }
        if (resp && typeof resp.readerEnabled === "boolean") {
          readerActive = resp.readerEnabled;
          // 可选：也用返回值修正 UI（不改 storage）
          if (resp.mode !== undefined)  currentMode  = resp.mode;
          if (resp.colorMode !== undefined) currentColor = resp.colorMode;
        } else {
          // 无回应或未实现 getState：默认认为阅读关闭
          readerActive = false;
        }
        render();
      });
    });
  });

  // 外部修改（仅关心模式/颜色；不再监听 readerMode）
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.mode) {
      currentMode = changes.mode.newValue ?? null;
      if (!currentMode) currentColor = null;
    }
    if (changes.colorMode) {
      currentColor = changes.colorMode.newValue ?? null;
    }
    render();
  });

  // ---- 点击处理 ----
  btnEink?.addEventListener("click", () => {
    currentMode = currentMode === "focus" ? null : "focus";
    if (!currentMode) currentColor = null;
    chrome.storage.local.set({ mode: currentMode, colorMode: currentColor });
    render();
    withTab(tab => send(tab.id, { action: "toggleEink" }));
  });

  btnKindle?.addEventListener("click", () => {
    currentMode = currentMode === "kindle" ? null : "kindle";
    if (!currentMode) currentColor = null;
    chrome.storage.local.set({ mode: currentMode, colorMode: currentColor });
    render();
    withTab(tab => send(tab.id, { action: "toggleKindle" }));
  });

  colorSelect?.addEventListener("change", () => {
    if (!currentMode) { // 无模式时不允许选择颜色
      colorSelect.value = "";
      currentColor = null;
      render();
      return;
    }
    currentColor = colorSelect.value || null;
    chrome.storage.local.set({ mode: currentMode, colorMode: currentColor });
    render();
    withTab(tab => send(tab.id, { action: "setColorMode", value: currentColor }));
  });

  btnReader?.addEventListener("click", () => {
    // 只让当前页去切换，并以回包为准高亮按钮；不写 storage
    withTab(tab => {
      send(tab.id, { action: "toggleReader" }, (resp) => {
        if (resp && typeof resp.enabled === "boolean") {
          readerActive = resp.enabled;
          render();
        }
      });
    });
  });

  console.log("✅ Popup loaded (per-tab reader state)");
});