import io
import os
from datetime import datetime
from pathlib import Path
from typing import List

from flask import Flask, jsonify, render_template, request

try:
    import easyocr  # type: ignore
except ModuleNotFoundError as exc:
    raise SystemExit(
        "easyocr is required to run this application. Install dependencies via 'pip install -r requirements.txt'."
    ) from exc


BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = Flask(__name__)


def _init_reader() -> "easyocr.Reader":
    languages: List[str] = ["en"]
    return easyocr.Reader(languages, gpu=False)


READER = _init_reader()


def _save_upload(file_storage) -> Path:
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    extension = Path(file_storage.filename or "uploaded").suffix or ".png"
    filename = f"upload_{timestamp}{extension}"
    save_path = UPLOAD_DIR / filename
    file_storage.save(save_path)
    return save_path


@app.route("/")
def index():
    return render_template("index.html")


@app.post("/api/ocr")
def perform_ocr():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    uploaded_file = request.files["image"]
    if uploaded_file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    saved_path = _save_upload(uploaded_file)

    image_bytes = saved_path.read_bytes()
    image_stream = io.BytesIO(image_bytes)

    results = READER.readtext(image_stream.read(), detail=1, paragraph=True)

    extracted_text = "\n".join([text for _, text, _ in results]) if results else ""

    response = {
        "text": extracted_text,
        "segments": [
            {"bbox": bbox, "text": text, "confidence": float(confidence)}
            for bbox, text, confidence in results
        ],
        "filename": uploaded_file.filename,
    }
    return jsonify(response)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
