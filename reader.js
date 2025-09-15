// reader.js — Safari 风格阅读模式（带图片 & 美化排版）

function applyReaderMode() {
    // 尝试使用 Mozilla Readability
    if (typeof Readability !== "undefined") {
      try {
        const documentClone = document.cloneNode(true);
        const article = new Readability(documentClone).parse();
        if (article && article.content) {
          // 如果成功解析，构建阅读模式界面
          // 如果已有 readerContainer，先删除
          let oldContainer = document.getElementById("reader-mode-container");
          if (oldContainer) oldContainer.remove();
        
          // 创建外层容器（只负责滚动与居中留白）
          const readerContainer = document.createElement("div");
          readerContainer.id = "reader-mode-container";
          Object.assign(readerContainer.style, {
            position: "fixed",
            inset: "0",
            background: "#f5f7fa",
            color: "#000",
            overflowY: "auto",
            zIndex: "999999",
            fontSize: "1.1rem",
            lineHeight: "1.8",
            fontFamily: "Georgia, serif",
            padding: "2.5rem 0",        // 让卡片上下留白，不挤在边缘
            display: "block"
          });

          // 内部“白色卡片”，负责包住全部正文
          const contentBox = document.createElement("div");
          Object.assign(contentBox.style, {
            maxWidth: "860px",
            width: "100%",
            margin: "0 auto",
            padding: "2rem 2.25rem",
            // background: "#fff",  // ❌ 去掉纯白背景
            borderRadius: "14px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            overflow: "hidden"
          });
          
          // 插入标题和内容
          const titleElem = document.createElement("h1");
          titleElem.innerText = article.title || "";
          Object.assign(titleElem.style, { fontSize: "2rem", margin: "1.5rem 0", fontWeight: "bold" });
          contentBox.appendChild(titleElem);

          contentBox.innerHTML += article.content;

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

          readerContainer.appendChild(contentBox);
          document.body.appendChild(readerContainer);

          // 隐藏原始内容
          Array.from(document.body.children).forEach(child => {
            if (child.id !== "reader-mode-container") child.style.display = "none";
          });

          return;
        }
      } catch (e) {
        // 解析失败，继续使用旧方法
      }
    }

    // 智能选择正文容器（fallback）
    function findMainContent() {
      const candidates = document.querySelectorAll(
        "article, main, .post, .article, .story, .entry-content, #content"
      );
      let best = null;
      let bestScore = 0;
  
      candidates.forEach(c => {
        const paragraphs = c.querySelectorAll("p");
        let score = 0;
        paragraphs.forEach(p => {
          const len = p.innerText.trim().length;
          if (len > 50) score += len; // 长段落加分
        });
        if (score > bestScore) {
          bestScore = score;
          best = c;
        }
      });
  
      return best || document.body;
    }
  
    const mainContent = findMainContent();
  
    // 如果已有 readerContainer，先删除
    let oldContainer = document.getElementById("reader-mode-container");
    if (oldContainer) oldContainer.remove();
  
    // 创建外层容器（只负责滚动与居中留白）
    const readerContainer = document.createElement("div");
    readerContainer.id = "reader-mode-container";
    Object.assign(readerContainer.style, {
      position: "fixed",
      inset: "0",
      background: "#f5f7fa",
      color: "#000",
      overflowY: "auto",
      zIndex: "999999",
      fontSize: "1.1rem",
      lineHeight: "1.8",
      fontFamily: "Georgia, serif",
      padding: "2.5rem 0",        // 让卡片上下留白，不挤在边缘
      display: "block"
    });

    // 内部“白色卡片”，负责包住全部正文
    const contentBox = document.createElement("div");
    Object.assign(contentBox.style, {
      maxWidth: "860px",          // 比之前更宽
      width: "100%",
      margin: "0 auto",
      padding: "2rem 2.25rem",
      background: "#fff",
      borderRadius: "14px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
      overflow: "hidden"          // 图片等元素不溢出阴影
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
  
    // 提取正文相关元素
    const elements = Array.from(
      mainContent.querySelectorAll("h1, h2, h3, p, img, ul, ol, blockquote, table, figure, pre, code")
    ).filter(el => {
      if (el.tagName.toLowerCase() === "img") {
        return el.src && !el.src.includes("logo") && !el.src.includes("icon");
      }
      return el.innerText.trim().length > 0 || el.tagName.toLowerCase() !== "p";
    });
  
    // 添加正文元素
    elements.forEach(el => {
      if (el.tagName.toLowerCase() === "img") {
        const img = document.createElement("img");
        img.src = el.src;
        Object.assign(img.style, {
          maxWidth: "100%",
          margin: "1.5rem 0",
          borderRadius: "6px"
        });
        contentBox.appendChild(img);
      } else {
        const clone = document.createElement(el.tagName.toLowerCase());
        clone.innerText = el.innerText;
  
        // 样式优化
        if (el.tagName.toLowerCase() === "h1") {
          Object.assign(clone.style, { fontSize: "2rem", margin: "1.5rem 0", fontWeight: "bold" });
        }
        if (el.tagName.toLowerCase() === "h2") {
          Object.assign(clone.style, { fontSize: "1.5rem", margin: "1.2rem 0", fontWeight: "600" });
        }
        if (el.tagName.toLowerCase() === "p") {
          Object.assign(clone.style, { fontSize: "1.1rem", lineHeight: "1.8", margin: "1rem 0" });
        }
        if (el.tagName.toLowerCase() === "ul" || el.tagName.toLowerCase() === "ol") {
          Object.assign(clone.style, { margin: "1rem 2rem", lineHeight: "1.7" });
        }
        if (el.tagName.toLowerCase() === "blockquote") {
          Object.assign(clone.style, {
            margin: "1.5rem",
            padding: "0.8rem 1.2rem",
            borderLeft: "4px solid #ccc",
            color: "#555",
            fontStyle: "italic",
            background: "#f9f9f9"
          });
        }
        if (el.tagName.toLowerCase() === "table") {
          Object.assign(clone.style, {
            width: "100%",
            borderCollapse: "collapse",
            margin: "1.5rem 0"
          });
          clone.querySelectorAll("td, th").forEach(cell => {
            Object.assign(cell.style, {
              border: "1px solid #ccc",
              padding: "0.5rem"
            });
          });
        }
        if (el.tagName.toLowerCase() === "pre" || el.tagName.toLowerCase() === "code") {
          Object.assign(clone.style, {
            background: "#f4f4f4",
            padding: "0.8rem 1rem",
            borderRadius: "6px",
            fontFamily: "monospace",
            overflowX: "auto"
          });
        }
  
        contentBox.appendChild(clone);
      }
    });
  
    readerContainer.appendChild(contentBox);
    document.body.appendChild(readerContainer);
  
    // 隐藏原始内容
    Array.from(document.body.children).forEach(child => {
      if (child.id !== "reader-mode-container") child.style.display = "none";
    });
  }
  
  // -------- 独立函数：退出 --------
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
  
  // -------- 独立监听器 --------
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggleReader") {
      const on = !!document.getElementById("reader-mode-container");
      if (on) {
        disableReaderMode();
      } else {
        applyReaderMode();
      }
      sendResponse({ status: "done", enabled: !on });
      return;
    }
    if (message.action === "getReaderState") {
      const on = !!document.getElementById("reader-mode-container");
      sendResponse({ enabled: on });
      return;
    }
  });