from PIL import Image
from pathlib import Path

for f in Path(".").glob("*"):
    try:
        img = Image.open(f)
        print(f"{f.name:40} {img.format:5} {img.mode}")
    except Exception:
        pass
