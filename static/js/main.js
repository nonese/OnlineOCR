const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const browseBtn = document.getElementById("browse-btn");
const previewSection = document.getElementById("preview");
const previewImage = document.getElementById("preview-image");
const resultsSection = document.getElementById("results");
const output = document.getElementById("output");
const confidenceTag = document.getElementById("confidence");
const languageButtons = document.querySelectorAll(".language-switch__btn");

let currentLanguage = "zh";

const formatConfidence = (averageConfidence, segments) => {
  const hasAverage = typeof averageConfidence === "number" && !Number.isNaN(averageConfidence);
  if (hasAverage) {
    return `平均置信度 ${(averageConfidence * 100).toFixed(1)}%`;
  }

  if (segments && segments.length) {
    const sum = segments.reduce((acc, current) => acc + Number(current.confidence || 0), 0);
    const avg = sum / segments.length;
    if (!Number.isNaN(avg) && Number.isFinite(avg)) {
      return `平均置信度 ${(avg * 100).toFixed(1)}%`;
    }
  }

  return "暂无置信度数据";
};

const setLanguage = (language) => {
  currentLanguage = language;
  languageButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.language === language);
  });
};

const showPreview = (file) => {
  const url = URL.createObjectURL(file);
  previewImage.src = url;
  previewSection.hidden = false;
};

const clearResults = () => {
  resultsSection.hidden = true;
  output.textContent = "";
  confidenceTag.textContent = "";
};

const displayResults = (data) => {
  const textContent = data.text && data.text.trim().length ? data.text : "未检测到文本。";
  output.textContent = textContent;
  confidenceTag.textContent = formatConfidence(data.average_confidence, data.segments);
  resultsSection.hidden = false;
};

const setLoading = (state) => {
  dropZone.classList.toggle("loading", state);
  dropZone.dataset.status = state ? "正在处理…" : "";
};

const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("language", currentLanguage);
  setLoading(true);
  clearResults();

  try {
    const response = await fetch("/api/ocr", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "未知错误" }));
      throw new Error(error.error || "图片处理失败");
    }

    const data = await response.json();
    displayResults(data);
  } catch (error) {
    output.textContent = error.message;
    resultsSection.hidden = false;
  } finally {
    setLoading(false);
  }
};

const handleFiles = (files) => {
  if (!files || !files.length) return;
  const file = files[0];
  showPreview(file);
  uploadImage(file);
};

browseBtn.addEventListener("click", (event) => {
  event.preventDefault();
  fileInput.click();
});

fileInput.addEventListener("change", (event) => {
  handleFiles(event.target.files);
});

dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("dragover");
  handleFiles(event.dataTransfer.files);
});

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const { language } = button.dataset;
    if (!language || language === currentLanguage) {
      return;
    }
    setLanguage(language);
    clearResults();
  });
});

setLanguage(currentLanguage);
