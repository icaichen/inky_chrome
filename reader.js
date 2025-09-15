console.log("✅ reader.js loaded");

// reader.js — Safari 风格阅读模式

function applyReaderMode() {
    // 提取标题
    const title = document.querySelector("h1")?.innerText || document.title;
  
    // 提取段落
    const paragraphs = Array.from(document.querySelectorAll("p"))
      .map(p => p.innerText)
      .filter(text => text.trim().length > 0);
  
    // 如果已经有 readerContainer，先删除再重建
    let oldContainer = document.getElementById("reader-mode-container");
    if (oldContainer) oldContainer.remove();
  
    // 创建阅读容器
    const readerContainer = document.createElement("div");
    readerContainer.id = "reader-mode-container";
    Object.assign(readerContainer.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "#fff",
      color: "#000",
      overflowY: "auto",
      padding: "2rem",
      zIndex: "999999",
      fontSize: "1.1rem",
      lineHeight: "1.6",
      fontFamily: "Georgia, serif"
    });
  
    // 关闭按钮
    const closeButton = document.createElement("button");
    closeButton.innerText = "退出阅读模式";
    Object.assign(closeButton.style, {
      position: "fixed",
      top: "1rem",
      right: "1rem",
      zIndex: "1000000",
      padding: "0.5rem 1rem",
      fontSize: "1rem",
      cursor: "pointer"
    });
    closeButton.addEventListener("click", disableReaderMode);
    readerContainer.appendChild(closeButton);
  
    // 添加标题
    const titleElem = document.createElement("h1");
    titleElem.innerText = title;
    Object.assign(titleElem.style, {
      marginBottom: "1.5rem",
      fontSize: "2rem",
      fontWeight: "bold"
    });
    readerContainer.appendChild(titleElem);
  
    // 添加正文段落
    paragraphs.forEach(text => {
      const p = document.createElement("p");
      p.innerText = text;
      p.style.marginBottom = "1rem";
      readerContainer.appendChild(p);
    });
  
    // 隐藏外围内容，但保留主体，避免全白
    ["header","nav","aside","footer"].forEach(sel => {
      document.querySelectorAll(sel).forEach(el => el.style.display = "none");
    });
  
    document.body.appendChild(readerContainer);
  
    // 通知其他模式（Kindle / Focus / Color）重新应用
    const event = new CustomEvent("readerModeActivated");
    document.dispatchEvent(event);
  }
  
  function disableReaderMode() {
    const readerContainer = document.getElementById("reader-mode-container");
    if (readerContainer) {
      readerContainer.remove();
    }
    // 恢复原始内容
    Array.from(document.body.children).forEach(child => {
      child.style.display = "";
    });
  }
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("📩 Received message:", message);
    if (message.action === "toggleReader") {
      const readerContainer = document.getElementById("reader-mode-container");
      if (readerContainer) {
        disableReaderMode();
      } else {
        applyReaderMode();
      }
      sendResponse({ status: "done" });
    }
  });