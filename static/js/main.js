const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const browseBtn = document.getElementById("browse-btn");
const previewSection = document.getElementById("preview");
const previewImage = document.getElementById("preview-image");
const resultsSection = document.getElementById("results");
const output = document.getElementById("output");
const confidenceTag = document.getElementById("confidence");

const formatConfidence = (segments) => {
  if (!segments || !segments.length) return "No text detected";
  const avg =
    segments.reduce((acc, current) => acc + Number(current.confidence || 0), 0) / segments.length;
  return `Avg confidence ${(avg * 100).toFixed(1)}%`;
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
  output.textContent = data.text || "No text detected.";
  confidenceTag.textContent = formatConfidence(data.segments);
  resultsSection.hidden = false;
};

const setLoading = (state) => {
  dropZone.classList.toggle("loading", state);
  dropZone.dataset.status = state ? "Processing..." : "";
};

const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  setLoading(true);
  clearResults();

  try {
    const response = await fetch("/api/ocr", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || "Failed to process image");
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
