"""
将 public/img/items/<name>_raw.png（黑底）抠成 <name>.png（透明背景）。
策略：基于亮度阈值 + 渐变软化边缘，避免硬抠产生锯齿。
"""
import sys
from pathlib import Path
from PIL import Image, ImageFilter

ITEMS_DIR = Path(__file__).resolve().parent.parent / "public" / "img" / "items"
NAMES = ["city", "heroes", "battle", "map", "profile", "chronicle"]

LO = 18    # 亮度 <=18: 完全透明
HI = 55    # 亮度 >=55: 完全不透明；之间线性渐变


def luminance(r: int, g: int, b: int) -> int:
    return (r * 299 + g * 587 + b * 114) // 1000


def strip(name: str) -> None:
    src = ITEMS_DIR / f"{name}_raw.png"
    dst = ITEMS_DIR / f"{name}.png"
    if not src.exists():
        print(f"[{name}] SKIP: {src} not found")
        return
    im = Image.open(src).convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            lum = luminance(r, g, b)
            if lum <= LO:
                a = 0
            elif lum >= HI:
                a = 255
            else:
                a = int(255 * (lum - LO) / (HI - LO))
            px[x, y] = (r, g, b, a)
    # 对 alpha 通道做轻微高斯模糊以软化锯齿
    r_, g_, b_, a_ = im.split()
    a_ = a_.filter(ImageFilter.GaussianBlur(radius=0.8))
    im = Image.merge("RGBA", (r_, g_, b_, a_))
    im.save(dst, "PNG")
    print(f"[{name}] -> {dst.name}  size={dst.stat().st_size}")


def main() -> int:
    if not ITEMS_DIR.exists():
        print(f"items dir not found: {ITEMS_DIR}")
        return 1
    for n in NAMES:
        strip(n)
    return 0


if __name__ == "__main__":
    sys.exit(main())
