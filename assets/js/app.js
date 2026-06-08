document.addEventListener("DOMContentLoaded", () => {
  // --- Loading overlay ---

  const overlay = document.getElementById("loading-overlay");

  function flashAndReload() {
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";
    setTimeout(() => location.reload(), 50);
  }

  // Fade out overlay on load if it was shown
  if (overlay.style.opacity === "1") {
    requestAnimationFrame(() => {
      overlay.style.opacity = "0";
      overlay.style.pointerEvents = "none";
    });
  }

  // --- DOM refs ---
  const confirmModal = document.getElementById("confirm-modal");
  const modalPreview = document.getElementById("modal-preview");
  const modalType = document.getElementById("modal-type");
  const confirmBtn = document.getElementById("confirm-btn");
  const cancelBtn = document.getElementById("cancel-btn");

  const deleteModal = document.getElementById("delete-modal");
  const deleteConfirmBtn = document.getElementById("delete-confirm-btn");
  const deleteCancelBtn = document.getElementById("delete-cancel-btn");

  const textarea = document.getElementById("paste-textarea");
  const fileInput = document.getElementById("file-input");
  const addBtn = document.getElementById("add-btn");
  const toast = document.getElementById("toast");
  const themeToggle = document.getElementById("theme-toggle");
  const sunIcon = document.getElementById("sun-icon");
  const moonIcon = document.getElementById("moon-icon");
  const hljsTheme = document.getElementById("hljs-theme");
  const submitForm = document.getElementById("submit-form");
  const formContentType = document.getElementById("form-content-type");
  const formContentText = document.getElementById("form-content-text");
  const formContentFile = document.getElementById("form-content-file");

  let pendingData = null;
  let pendingDeleteId = null;

  // --- Markdown setup with syntax highlighting ---

  function highlightAllCode(root) {
    root.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
  }

  marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: function (code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch {}
      }
      try {
        return hljs.highlightAuto(code).value;
      } catch {}
      return code;
    },
  });

  function renderMarkdown(text) {
    const raw = marked.parse(text);
    return DOMPurify.sanitize(raw);
  }

  // --- Dark mode ---

  function initTheme() {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      sunIcon.classList.remove("hidden");
      moonIcon.classList.add("hidden");
      hljsTheme.href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css";
    } else {
      document.documentElement.classList.remove("dark");
      sunIcon.classList.add("hidden");
      moonIcon.classList.remove("hidden");
      hljsTheme.href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css";
    }
    localStorage.setItem("theme", theme);

    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
  }

  function toggleTheme() {
    const current = document.documentElement.classList.contains("dark") ? "dark" : "light";
    applyTheme(current === "dark" ? "light" : "dark");
  }

  applyTheme(initTheme());
  themeToggle.addEventListener("click", toggleTheme);

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) {
      applyTheme(e.matches ? "dark" : "light");
    }
  });

  // --- Helpers ---

  function isURL(str) {
    try {
      const url = new URL(str);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  function detectContentType(text) {
    return isURL(text.trim()) ? "link" : "text";
  }

  function isImageFile(file) {
    return file && file.type.startsWith("image/");
  }

  function showToast(message, type = "success") {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
      toast.className = "toast";
    }, 3000);
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  // --- Render markdown in existing cards ---

  document.querySelectorAll(".markdown-content[data-raw]").forEach((el) => {
    el.innerHTML = renderMarkdown(el.getAttribute("data-raw"));
    highlightAllCode(el);
  });

  // --- Submit modal ---

  function showSubmitModal(preview, type, data) {
    modalPreview.innerHTML = preview;
    modalType.textContent = type;
    pendingData = data;
    confirmModal.classList.remove("hidden");
    highlightAllCode(modalPreview);
  }

  function hideSubmitModal() {
    confirmModal.classList.add("hidden");
    modalPreview.innerHTML = "";
    pendingData = null;
  }

  // --- Delete modal ---

  function showDeleteModal(itemId) {
    pendingDeleteId = itemId;
    deleteModal.classList.remove("hidden");
  }

  function hideDeleteModal() {
    deleteModal.classList.add("hidden");
    pendingDeleteId = null;
  }

  // --- Submit & Delete ---

  function submitContent() {
    if (!pendingData) return;

    formContentType.value = pendingData.type;
    formContentText.value = pendingData.text || "";

    if (pendingData.type === "file" && pendingData.file) {
      const dt = new DataTransfer();
      dt.items.add(pendingData.file);
      formContentFile.files = dt.files;
    } else {
      formContentFile.value = "";
    }

    hideSubmitModal();
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";
    submitForm.submit();
  }

  async function deleteItem(itemId) {
    try {
      const response = await fetch(`/item/${itemId}`, { method: "DELETE" });
      if (response.ok) {
        hideDeleteModal();
        showToast("Item deleted!");
        flashAndReload();
        return;
      } else {
        showToast("Failed to delete item", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  }

  // --- Modal events ---

  confirmBtn.addEventListener("click", submitContent);
  cancelBtn.addEventListener("click", hideSubmitModal);
  confirmModal.addEventListener("click", (e) => {
    if (e.target === confirmModal) hideSubmitModal();
  });

  deleteConfirmBtn.addEventListener("click", () => {
    if (pendingDeleteId !== null) {
      deleteItem(pendingDeleteId);
    }
    hideDeleteModal();
  });
  deleteCancelBtn.addEventListener("click", hideDeleteModal);
  deleteModal.addEventListener("click", (e) => {
    if (e.target === deleteModal) hideDeleteModal();
  });

  // --- Textarea submit ---

  addBtn.addEventListener("click", () => {
    const text = textarea.value.trim();
    if (!text) return;

    const type = detectContentType(text);
    const preview =
      type === "link"
        ? `<a href="${escapeHtml(text)}" target="_blank" class="text-blue-600 dark:text-blue-400 underline">${escapeHtml(text)}</a>`
        : `<div class="markdown-content text-gray-800 dark:text-gray-200">${renderMarkdown(text)}</div>`;

    showSubmitModal(preview, type, { type, text });
    textarea.value = "";
  });

  // --- File input ---

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    let preview;
    let label;

    if (isImageFile(file)) {
      preview = `<img src="${URL.createObjectURL(file)}" class="max-h-48 rounded" alt="Preview">`;
      label = "Image";
    } else {
      preview = `
        <div class="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-600 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
          </svg>
          <div>
            <p class="text-sm font-medium text-gray-800 dark:text-gray-200">${escapeHtml(file.name)}</p>
            <p class="text-xs text-gray-400">${file.type || "unknown"} &middot; ${formatFileSize(file.size)}</p>
          </div>
        </div>`;
      label = "File";
    }

    showSubmitModal(preview, label, { type: "file", file });
    fileInput.value = "";
  });

  // --- Paste event (document-wide) ---

  document.addEventListener("paste", (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        const preview = `<img src="${URL.createObjectURL(file)}" class="max-h-48 rounded" alt="Preview">`;
        showSubmitModal(preview, "Image", { type: "file", file });
        return;
      }
    }

    const text = e.clipboardData?.getData("text/plain");
    if (text && text.trim()) {
      if (
        document.activeElement === textarea ||
        document.activeElement === fileInput
      ) {
        return;
      }
      e.preventDefault();
      const type = detectContentType(text);
      const preview =
        type === "link"
          ? `<a href="${escapeHtml(text)}" target="_blank" class="text-blue-600 dark:text-blue-400 underline">${escapeHtml(text)}</a>`
          : `<div class="markdown-content text-gray-800 dark:text-gray-200">${renderMarkdown(text)}</div>`;
      showSubmitModal(preview, type, { type, text });
    }
  });

  // --- Delete buttons ---

  document.querySelectorAll("[data-delete-id]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      showDeleteModal(btn.getAttribute("data-delete-id"));
    });
  });

  // --- Copy text/link ---

  document.querySelectorAll("[data-copy-id]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const card = btn.closest(".clipboard-card");
      let textToCopy = "";
      const textEl = card.querySelector(".markdown-content[data-raw]");
      if (textEl) {
        textToCopy = textEl.getAttribute("data-raw");
      } else {
        const linkEl = card.querySelector("a");
        if (linkEl) textToCopy = linkEl.href;
      }
      try {
        await navigator.clipboard.writeText(textToCopy);
        showToast("Copied to clipboard!");
      } catch {
        showToast("Failed to copy", "error");
      }
    });
  });

  // --- Copy image as binary ---

  document.querySelectorAll("[data-copy-img-id]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const card = btn.closest(".clipboard-card");
      const img = card.querySelector("img");
      if (!img) return;
      try {
        const resp = await fetch(img.src);
        const blob = await resp.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
        showToast("Image copied to clipboard!");
      } catch {
        showToast("Failed to copy image", "error");
      }
    });
  });

  // --- Download ---

  document.querySelectorAll("[data-download-id]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      window.location.href = `/item/${btn.getAttribute("data-download-id")}/download`;
    });
  });
});
