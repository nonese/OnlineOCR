import io
import os
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from typing import Dict, List

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


LANGUAGE_MAP: Dict[str, List[str]] = {
    "en": ["en"],
    "zh": ["ch_sim", "en"],
}
DEFAULT_LANGUAGE = "en"


@lru_cache(maxsize=None)
def _get_reader(language_code: str) -> "easyocr.Reader":
    languages = LANGUAGE_MAP.get(language_code, LANGUAGE_MAP[DEFAULT_LANGUAGE])
    return easyocr.Reader(languages, gpu=False)


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

    requested_language = request.form.get("language", DEFAULT_LANGUAGE).lower()
    if requested_language not in LANGUAGE_MAP:
        requested_language = DEFAULT_LANGUAGE

    saved_path = _save_upload(uploaded_file)

    image_bytes = saved_path.read_bytes()
    image_stream = io.BytesIO(image_bytes)

    reader = _get_reader(requested_language)
    results = reader.readtext(image_stream.read(), detail=1, paragraph=True)

    segments = []
    for result in results:
        if len(result) == 3:
            bbox, text, confidence = result
        elif len(result) == 2:
            bbox, text = result
            confidence = None
        else:
            # Skip unexpected result shapes to avoid breaking the API response.
            continue

        segments.append(
            {
                "bbox": bbox,
                "text": text,
                "confidence": float(confidence) if confidence is not None else None,
            }
        )

    extracted_text = "\n".join([segment["text"] for segment in segments]) if segments else ""

    response = {
        "text": extracted_text,
        "segments": segments,
        "filename": uploaded_file.filename,
        "language": requested_language,
    }
    return jsonify(response)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
