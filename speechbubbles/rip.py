from pathlib import Path
from PIL import Image

# Folder containing PNGs
INPUT_FOLDER = Path(".")

# Treat pixels within this distance of white as background.
# Increase to remove more off-white backgrounds.
WHITE_THRESHOLD = 30


def is_near_white(r, g, b):
    # Euclidean distance from pure white (255,255,255)
    return ((255 - r) ** 2 +
            (255 - g) ** 2 +
            (255 - b) ** 2) ** 0.5 <= WHITE_THRESHOLD


def remove_white_background(image_path):
    img = Image.open(image_path).convert("RGBA")
    pixels = img.load()

    width, height = img.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]

            if is_near_white(r, g, b):
                # Set RGB to black to avoid white halos
                pixels[x, y] = (0, 0, 0, 0)

    output_path = image_path.with_name(f"{image_path.stem}.png")
    img.save(output_path)
    print(f"Saved: {output_path}")


def main():
    pngs = sorted(INPUT_FOLDER.glob("*.png"))

    if not pngs:
        print("No PNG files found.")
        return

    for png in pngs:
        remove_white_background(png)


if __name__ == "__main__":
    main()
