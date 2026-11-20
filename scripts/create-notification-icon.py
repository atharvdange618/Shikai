#!/usr/bin/env python3
"""Generate the Android notification icon (96x96, white on transparent).

Android draws notification icons from the alpha channel only, so this is a
one-color silhouette of logo-simple.svg: the lens disk in white with the
viewfinder ring and center dot cut out.
"""

from PIL import Image, ImageDraw

SIZE = 96
SCALE = 8
VIEWBOX = 512

WHITE = (255, 255, 255, 255)
CLEAR = (0, 0, 0, 0)


def circle(draw, r, fill, k):
    c = VIEWBOX / 2 * k
    draw.ellipse([c - r * k, c - r * k, c + r * k, c + r * k], fill=fill)


def main():
    big = SIZE * SCALE
    k = big / VIEWBOX
    img = Image.new("RGBA", (big, big), CLEAR)
    draw = ImageDraw.Draw(img)

    circle(draw, 200, WHITE, k)
    circle(draw, 86, CLEAR, k)
    circle(draw, 74, WHITE, k)
    circle(draw, 16, CLEAR, k)

    output_path = "assets/images/notification-icon.png"
    img.resize((SIZE, SIZE), Image.LANCZOS).save(output_path)
    print(f"Saved {output_path}")


if __name__ == "__main__":
    main()
