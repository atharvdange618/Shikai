#!/usr/bin/env python3
"""Generate Open Graph image (1200x630) for Shikai privacy policy."""

from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 1200, 630

BG_DARK = (15, 23, 42)
BG_MID = (30, 41, 59)
ACCENT = (88, 166, 255)
TEXT_WHITE = (250, 249, 246)
TEXT_DIM = (148, 163, 184)


def create_gradient(width, height, color1, color2):
    img = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(img)
    for y in range(height):
        ratio = y / height
        r = int(color1[0] + (color2[0] - color1[0]) * ratio)
        g = int(color1[1] + (color2[1] - color1[1]) * ratio)
        b = int(color1[2] + (color2[2] - color1[2]) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    return img


def draw_circle(draw, cx, cy, r, fill=None, outline=None, width=1):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill, outline=outline, width=width)


def draw_logo(img, cx, cy, size):
    draw = ImageDraw.Draw(img)
    r = size // 2
    draw_circle(draw, cx, cy, r, fill=ACCENT)
    draw_circle(draw, cx, cy, int(r * 0.7), fill=None, outline=(147, 197, 253), width=3)
    draw_circle(draw, cx, cy, int(r * 0.4), fill=None, outline=TEXT_WHITE, width=6)
    draw_circle(draw, cx, cy, int(r * 0.1), fill=TEXT_WHITE)


def main():
    img = create_gradient(WIDTH, HEIGHT, BG_DARK, BG_MID)
    draw = ImageDraw.Draw(img)

    # Grid background
    for x in range(0, WIDTH, 40):
        draw.line([(x, 0), (x, HEIGHT)], fill=(30, 41, 59), width=1)
    for y in range(0, HEIGHT, 40):
        draw.line([(0, y), (WIDTH, y)], fill=(30, 41, 59), width=1)

    # Logo
    draw_logo(img, 160, 315, 120)

    # Fonts
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    title_font = subtitle_font = body_font = None
    for fp in font_paths:
        try:
            title_font = ImageFont.truetype(fp, 64)
            subtitle_font = ImageFont.truetype(fp.replace("-Bold", ""), 30)
            body_font = ImageFont.truetype(fp.replace("-Bold", ""), 22)
            break
        except (OSError, IOError):
            continue

    if not title_font:
        title_font = subtitle_font = body_font = ImageFont.load_default()

    draw = ImageDraw.Draw(img)

    # Title
    draw.text((340, 220), "Shikai", fill=TEXT_WHITE, font=title_font)

    # Subtitle
    draw.text((340, 300), "Privacy Policy", fill=ACCENT, font=subtitle_font)

    # Tagline
    draw.text((340, 360), "A read-only GitHub companion for Android", fill=TEXT_DIM, font=body_font)

    # Bottom bar
    draw.rectangle([(0, HEIGHT - 6), (WIDTH, HEIGHT)], fill=ACCENT)

    output_path = "docs/og-image.png"
    img.save(output_path, "PNG")
    print(f"OG image saved to {output_path}")
    print(f"Dimensions: {WIDTH}x{HEIGHT}")


if __name__ == "__main__":
    main()
