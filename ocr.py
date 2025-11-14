#!/usr/bin/env python3
"""
EasyOCR wrapper script.

Reads an image from disk (path provided as the first CLI argument),
extracts text using EasyOCR, and prints a JSON payload to stdout.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

os.environ.setdefault("KMP_WARNINGS", "0")
os.environ.setdefault("CUDA_VISIBLE_DEVICES", "-1")

try:
    import easyocr  # type: ignore
except ImportError as exc:  # pragma: no cover - surfaced to Node server
    print(json.dumps({"error": f"EasyOCR import error: {exc}"}), file=sys.stderr)
    sys.exit(1)

LANGUAGES = ["ko", "en"]


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "이미지 경로가 필요합니다."}), file=sys.stderr)
        return 1

    image_path = Path(sys.argv[1])
    if not image_path.exists():
        print(json.dumps({"error": f"이미지 파일을 찾을 수 없습니다: {image_path}"}), file=sys.stderr)
        return 1

    try:
        reader = easyocr.Reader(LANGUAGES, gpu=False, verbose=False)
        results = reader.readtext(str(image_path), detail=0, paragraph=True)
        cleaned_lines = [line.strip() for line in results if isinstance(line, str) and line.strip()]
        text = "\n".join(cleaned_lines)
        print(json.dumps({"text": text}, ensure_ascii=False))
        return 0
    except Exception as error:  # pragma: no cover - forwarded to caller
        print(json.dumps({"error": f"OCR 실패: {error}"}), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
