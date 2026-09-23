from argparse import ArgumentParser
from pathlib import Path
from shutil import copy2, which
from subprocess import run

from PIL import Image


SOURCE = Path("/Users/artemmokin/Desktop/Тася работы")
PROJECT = Path(__file__).resolve().parents[1]
REVIEW = Path("/private/tmp/tasya-source-review")
FULL_ROOT = PROJECT / "img" / "works"
SMALL_ROOT = PROJECT / "img" / "s" / "works"
VIDEO_ROOT = PROJECT / "assets" / "video"
COLLECTIONS = {
    "bashnya/stickers": (SOURCE / "Стикерпак", "sticker"),
    "bashnya/illustrations": (SOURCE / "Иллюстрации", "illustration"),
}


IMAGES = {
    "bashnya/product-manager-path": SOURCE / "Frame 2087329558.png",
    "bashnya/resume-01": SOURCE / "Frame 372.png",
    "bashnya/resume-02": SOURCE / "Frame 373.png",
    "bashnya/resume-03": SOURCE / "Frame 375.png",
    "bashnya/resume-04": SOURCE / "Frame 376.png",
    "bashnya/resume-05": SOURCE / "Frame 377.png",
    "bashnya/resume-06": SOURCE / "Frame 380.png",
    "bashnya/resume-07": SOURCE / "Frame 381.png",
    "bashnya/brandbook-01": SOURCE / "Slide 16_9 - 33.png",
    "bashnya/brandbook-02": SOURCE / "Slide 16_9 - 34.png",
    "bashnya/brandbook-03": SOURCE / "Slide 16_9 - 35.png",
    "bashnya/brandbook-04": SOURCE / "Slide 16_9 - 36.png",
    "bashnya/brandbook-05": SOURCE / "Slide 16_9 - 37.png",
    "bashnya/social-may": SOURCE / "Slide 62.jpg",
    "bashnya/social-hard-skills": SOURCE / "Slide 7.jpg",
    "bashnya/social-content-plan": SOURCE / "Slide 70.png",
    "bashnya/social-subscription": SOURCE / "Slide 79.jpg",
    "bashnya/social-vacancy": SOURCE / "Slide 80.png",
    "bashnya/python-course-01": REVIEW / "a4-39-1.png",
    "bashnya/python-course-02": REVIEW / "a4-40-1.png",
    "doggo/services-01": SOURCE / "2026-09-23 12.39.09.jpg",
    "doggo/services-02": SOURCE / "2026-09-23 12.39.13.jpg",
    "doggo/services-03": SOURCE / "2026-09-23 12.39.19.jpg",
    "doggo/services-04": SOURCE / "2026-09-23 12.39.24.jpg",
    "doggo/services-05": SOURCE / "2026-09-23 12.39.27.jpg",
    "doggo/services-06": SOURCE / "2026-09-23 12.39.31.jpg",
    "doggo/services-07": SOURCE / "2026-09-23 12.39.35.jpg",
    "doggo/hello-doggo": SOURCE / "2026-09-23 12.39.46.jpg",
    "doggo/window-art-01": SOURCE / "2026-09-23 12.39.50.jpg",
    "doggo/window-art-02": SOURCE / "2026-09-23 12.40.03.jpg",
    "doggo/puppyclub-site": SOURCE / "Screenshot 2026-09-23 at 12.40.39.png",
    "doggo/doggo-site": SOURCE / "Screenshot 2026-09-23 at 12.40.54.png",
    "doggo/city-screen-poster": REVIEW / "2026-09-23 12.38.54.mp4.png",
    "doggo/outdoor-billboard-poster": REVIEW / "2026-09-23 12.39.02.mp4.png",
    "dayz/pattern": SOURCE / "2026-09-23 12.39.39.jpg",
    "dayz/logo": SOURCE / "2026-09-23 12.39.42.jpg",
}


VIDEOS = {
    "doggo-city-screen.mp4": SOURCE / "2026-09-23 12.38.54.mp4",
    "doggo-outdoor-billboard.mp4": SOURCE / "2026-09-23 12.39.02.mp4",
}


def prepare_generated_sources() -> None:
    REVIEW.mkdir(parents=True, exist_ok=True)

    pdftoppm = which("pdftoppm")
    for number in (39, 40):
        rendered = REVIEW / f"a4-{number}-1.png"
        if rendered.exists():
            continue
        if not pdftoppm:
            raise RuntimeError("Для импорта PDF нужен pdftoppm (Poppler)")
        run(
            [pdftoppm, "-png", "-r", "120", str(SOURCE / f"A4 - {number}.pdf"), str(REVIEW / f"a4-{number}")],
            check=True,
        )

    missing_video_posters = [source for source in VIDEOS.values() if not (REVIEW / f"{source.name}.png").exists()]
    if missing_video_posters:
        quicklook = which("qlmanage")
        if not quicklook:
            raise RuntimeError("Для создания постеров MP4 нужен qlmanage")
        run([quicklook, "-t", "-s", "900", "-o", str(REVIEW), *map(str, missing_video_posters)], check=True)


def convert(source: Path, key: str) -> tuple[int, list[int]]:
    if not source.exists():
        raise FileNotFoundError(source)

    with Image.open(source) as opened:
        image = opened.convert("RGBA" if "A" in opened.getbands() else "RGB")
        full_width = min(image.width, 2000)
        if image.width > full_width:
            full_height = round(image.height * full_width / image.width)
            full = image.resize((full_width, full_height), Image.Resampling.LANCZOS)
        else:
            full = image.copy()

        full_path = FULL_ROOT / f"{key}.webp"
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full.save(full_path, "WEBP", quality=88, method=6)

        widths: list[int] = []
        for width in (600, 1200):
            if width >= full.width:
                continue
            height = round(full.height * width / full.width)
            resized = full.resize((width, height), Image.Resampling.LANCZOS)
            small_path = SMALL_ROOT / f"{key}-{width}.webp"
            small_path.parent.mkdir(parents=True, exist_ok=True)
            resized.save(small_path, "WEBP", quality=84, method=6)
            widths.append(width)
    return full.width, widths


def import_collections() -> dict[str, tuple[int, list[int]]]:
    metadata: dict[str, tuple[int, list[int]]] = {}
    for directory_key, (source_dir, filename_prefix) in COLLECTIONS.items():
        sources = sorted(source_dir.glob("*.png"))
        if not sources:
            raise FileNotFoundError(source_dir)
        for index, source in enumerate(sources, start=1):
            key = f"{directory_key}/{filename_prefix}-{index:02d}"
            metadata[f"works/{key}"] = convert(source, key)
    return metadata


def main() -> None:
    parser = ArgumentParser()
    parser.add_argument("--collections-only", action="store_true")
    args = parser.parse_args()

    metadata: dict[str, tuple[int, list[int]]] = {}
    if not args.collections_only:
        prepare_generated_sources()
        for key, source in IMAGES.items():
            metadata[f"works/{key}"] = convert(source, key)

        VIDEO_ROOT.mkdir(parents=True, exist_ok=True)
        for name, source in VIDEOS.items():
            copy2(source, VIDEO_ROOT / name)

    metadata.update(import_collections())

    for key, (width, sizes) in metadata.items():
        print(f'{key}: full={width}, sizes={sizes}')


if __name__ == "__main__":
    main()
