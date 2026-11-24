#!/usr/bin/env python3
"""Extract exam question images from `1 IQ Tese Original.pdf` into `iq test back-end/public/exam-images/`."""

from io import BytesIO
from pathlib import Path
import sys
from PIL import Image
import pypdf

PAGE_TO_FILENAME = {
    1: "cover_hero.jpg",
    3: "module_1_cover.jpg",
    5: "s1_q1_sequence.jpg",
    6: "s1_q2_memory_preview.jpg",
    7: "s1_q2_empty_grid.jpg",
    8: "s1_q3_letter_grid.jpg",
    9: "s1_q4_triangles.jpg",
    10: "s1_q5_memory_recall.jpg",
    11: "s1_q6_animals.jpg",
    12: "s1_q7_overlapping_numbers.jpg",
    13: "s1_q8_dots.jpg",
    14: "s1_q9_colors.jpg",
    15: "module_2_cover.jpg",
    19: "module_3_cover.jpg",
    21: "s3_q1_equation.jpg",
    22: "s3_q7_lock.jpg",
    23: "module_4_cover.jpg",
}


def extract_images(pdf_path: Path, output_dir: Path) -> None:
    if not pdf_path.exists():
        raise FileNotFoundError(f"Source PDF not found: {pdf_path}")

    output_dir.mkdir(parents=True, exist_ok=True)
    reader = pypdf.PdfReader(str(pdf_path))

    for page_num, filename in PAGE_TO_FILENAME.items():
        if page_num < 1 or page_num > len(reader.pages):
            raise IndexError(f"Page {page_num} out of range for {pdf_path} ({len(reader.pages)} pages)")

        page = reader.pages[page_num - 1]
        images = list(page.images)
        if not images:
            raise ValueError(f"No embedded images found on page {page_num}")

        raw_bytes = images[0].data
        with Image.open(BytesIO(raw_bytes)) as img:
            img.verify()

        target_path = output_dir / filename
        with Image.open(BytesIO(raw_bytes)) as img:
            if img.format == "JPEG":
                target_path.write_bytes(raw_bytes)
            else:
                img.convert("RGB").save(target_path, format="JPEG", quality=95)

        if not target_path.exists() or target_path.stat().st_size == 0:
            raise RuntimeError(f"Failed to write non-empty JPEG: {target_path}")

        print(f"Extracted page {page_num} -> {target_path} ({target_path.stat().st_size} bytes)")


def main() -> int:
    repo_root = Path(__file__).resolve().parents[2]
    pdf_path = Path(sys.argv[1]) if len(sys.argv) > 1 else repo_root / "1 IQ Tese Original.pdf"
    output_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else repo_root / "iq test back-end" / "public" / "exam-images"
    extract_images(pdf_path, output_dir)
    print(f"Successfully extracted {len(PAGE_TO_FILENAME)} JPEG images.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
