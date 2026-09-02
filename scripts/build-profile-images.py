#!/usr/bin/env python3
"""Copy, compress, and wire student images into profiles.20260902-v1.js"""

import json
import pathlib
import re
import shutil
import subprocess
import unicodedata
from urllib.parse import urlencode

ROOT = pathlib.Path("/Volumes/T7/RCA/for DD web")
RESOURCES = ROOT / "resources/Folder for students"
WEB = ROOT / "Web"
MEDIA = WEB / "media/people"
PROFILES = WEB / "js/profiles.20260902-v1.js"

FOLDER_TO_NAME = {
    "Ana Vigil Escalera Carriles": "Ana Vigil Escalera Carriles",
    "Fangdi （Andy）Liu": "Fangdi (Andy) Liu",
    "Gia Jiayu Liu": "Jiayu (Gia) Liu",
    "Minchi Chiu": "Min Chi Chiu",
    "Júlia Halasyova": "Julia Halasy",
    "Júlia Halasyova": "Julia Halasy",
    "Chao Chen": "Chen Chao",
    "Chengyu Li": "Li Chengyu",
}

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".JPG", ".JPEG", ".PNG", ".WEBP"}


def slugify(name: str) -> str:
    name = unicodedata.normalize("NFKD", name)
    name = name.encode("ascii", "ignore").decode("ascii")
    name = re.sub(r"[^a-zA-Z0-9]+", "-", name.lower()).strip("-")
    return name or "person"


def collect_images(folder: pathlib.Path) -> list[pathlib.Path]:
    files = []
    for path in folder.rglob("*"):
        if path.name.startswith("._"):
            continue
        if path.suffix in IMAGE_EXT and path.is_file():
            files.append(path)
    return sorted(files, key=lambda p: (p.stat().st_size, p.name.lower()))


def compress_image(src: pathlib.Path, dest: pathlib.Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(".tmp.jpg")
    shutil.copy2(src, tmp)
    subprocess.run(["sips", "-Z", "2560", str(tmp)], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(
        ["sips", "-s", "format", "jpeg", "-s", "formatOptions", "92", str(tmp)],
        check=False,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    if tmp.exists():
        tmp.replace(dest)
    else:
        shutil.copy2(src, dest)


def assign_images(paths, slug):
    if not paths:
        return None

    # Ana keeps curated mapping if already on disk.
    if slug == "ana-vigil-escalera-carriles":
        return {
            "portrait": f"media/people/{slug}/gallery-04.jpg",
            "featured": f"media/people/{slug}/hero.jpg",
            "gallery": [
                f"media/people/{slug}/gallery-03.jpg",
                f"media/people/{slug}/portrait.jpg",
                f"media/people/{slug}/gallery-01.jpg",
                f"media/people/{slug}/gallery-02.jpg",
            ],
        }

    selected = paths[:6]
    out_dir = MEDIA / slug
    out_dir.mkdir(parents=True, exist_ok=True)

    written = []
    for index, src in enumerate(selected, start=1):
        dest = out_dir / f"image-{index:02d}.jpg"
        compress_image(src, dest)
        written.append(dest)

    if not written:
        return None

    portrait = written[-1]
    featured = written[0]
    gallery = written[1:-1]

    return {
        "portrait": f"media/people/{slug}/{portrait.name}",
        "featured": f"media/people/{slug}/{featured.name}",
        "gallery": [f"media/people/{slug}/{path.name}" for path in gallery],
    }


def rednote_profile_url(rednote: str, existing: str = "") -> str:
    if existing and existing.startswith("http") and "search_result" in existing:
        return existing
    if existing and existing.startswith("http") and "oia.xiaohongshu.com" not in existing:
        if "red_id=" not in existing:
            return existing
    if not rednote:
        return ""
    handle = rednote.strip().lstrip("@")
    if re.fullmatch(r"[a-f0-9]{24}", handle, re.I):
        return f"https://www.xiaohongshu.com/user/profile/{handle}"
    query = urlencode({"keyword": handle, "type": "user", "source": "web_explore_feed"})
    return f"https://www.xiaohongshu.com/search_result?{query}"


def patch_profiles(image_map):
    text = PROFILES.read_text(encoding="utf-8")

    for name, images in image_map.items():
        block_key = json.dumps(name, ensure_ascii=False)
        pattern = (
            re.escape(block_key)
            + r": \{[\s\S]*?project: \{[\s\S]*?"
            + r"(imagesDrive: [^,\n]+,)(\s*\n    \}\n  \},)"
        )
        match = re.search(pattern, text)
        if not match:
            print("skip block", name)
            continue

        images_js = "      images: {\n"
        images_js += f'        portrait: {json.dumps(images["portrait"], ensure_ascii=False)},\n'
        images_js += f'        featured: {json.dumps(images["featured"], ensure_ascii=False)},\n'
        images_js += "        gallery: [\n"
        for item in images["gallery"]:
            images_js += f'          {json.dumps(item, ensure_ascii=False)},\n'
        if images["gallery"]:
            images_js = images_js.rstrip(",\n") + "\n"
        images_js += "        ]\n      },\n"

        start = match.start(1)
        block_prefix = text[match.start():start]
        block_prefix = re.sub(r"\s*images: \{[\s\S]*?\}\s*,?\n", "\n", block_prefix)
        replacement = block_prefix + images_js + match.group(1) + match.group(2)
        text = text[: match.start()] + replacement + text[match.end() :]

    text = re.sub(
        r'(rednote: "([^"]*)",\n    rednoteUrl: )"[^"]*"',
        lambda m: f'{m.group(1)}{json.dumps(rednote_profile_url(m.group(2)), ensure_ascii=False)}',
        text,
    )

    PROFILES.write_text(text, encoding="utf-8")


def main() -> None:
    image_map = {}
    for folder in sorted(RESOURCES.iterdir()):
        if not folder.is_dir():
            continue
        profile_name = FOLDER_TO_NAME.get(folder.name, folder.name)
        images = collect_images(folder)
        if not images:
            print("no images:", folder.name)
            continue
        slug = slugify(profile_name)
        mapping = assign_images(images, slug)
        if mapping:
            image_map[profile_name] = mapping
            print("processed:", profile_name, len(images), "->", slug)

    patch_profiles(image_map)
    print("updated", PROFILES)


if __name__ == "__main__":
    main()
