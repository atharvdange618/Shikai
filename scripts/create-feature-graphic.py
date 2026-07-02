#!/usr/bin/env python3
"""Generate Play Store feature graphic (1024x500) for Shikai."""

from PIL import Image, ImageDraw, ImageFont
import math

WIDTH, HEIGHT = 1024, 500

# Colors
BG_DARK = (15, 23, 42)       # Deep navy
BG_MID = (30, 41, 59)        # Slate
ACCENT = (88, 166, 255)      # GitHub blue
ACCENT_LIGHT = (147, 197, 253)  # Light blue
TEXT_WHITE = (250, 249, 246)  # Off-white
TEXT_DIM = (148, 163, 184)    # Slate-400
HIGHLIGHT = (59, 130, 246)   # Blue-500


def create_gradient(width, height, color1, color2, direction="horizontal"):
    """Create a gradient image."""
    img = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(img)

    for i in range(width if direction == "horizontal" else height):
        ratio = i / (width if direction == "horizontal" else height)
        r = int(color1[0] + (color2[0] - color1[0]) * ratio)
        g = int(color1[1] + (color2[1] - color1[1]) * ratio)
        b = int(color1[2] + (color2[2] - color1[2]) * ratio)
        if direction == "horizontal":
            draw.line([(i, 0), (i, height)], fill=(r, g, b))
        else:
            draw.line([(0, i), (width, i)], fill=(r, g, b))
    return img


def draw_circle(draw, cx, cy, r, fill=None, outline=None, width=1):
    """Draw a circle."""
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill, outline=outline, width=width)


def draw_logo(img, cx, cy, size):
    """Draw the Shikai logo."""
    draw = ImageDraw.Draw(img)
    r = size // 2

    # Outer circle with gradient feel
    draw_circle(draw, cx, cy, r, fill=ACCENT)
    # Inner accent ring
    draw_circle(draw, cx, cy, int(r * 0.7), fill=None, outline=ACCENT_LIGHT, width=3)
    # Lens/viewfinder circle
    draw_circle(draw, cx, cy, int(r * 0.4), fill=None, outline=TEXT_WHITE, width=6)
    # Center dot
    draw_circle(draw, cx, cy, int(r * 0.1), fill=TEXT_WHITE)


def draw_decorative_grid(draw, width, height):
    """Draw subtle grid lines in the background."""
    grid_color = (30, 41, 59)
    spacing = 40
    for x in range(0, width, spacing):
        draw.line([(x, 0), (x, height)], fill=grid_color, width=1)
    for y in range(0, height, spacing):
        draw.line([(0, y), (width, y)], fill=grid_color, width=1)


def draw_glow(img, cx, cy, radius, color, alpha=30):
    """Draw a soft glow effect."""
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for r in range(radius, 0, -2):
        a = int(alpha * (r / radius))
        draw_circle(draw, cx, cy, r, fill=(*color, a))
    img.paste(Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB"))


def main():
    # Create base with vertical gradient
    img = create_gradient(WIDTH, HEIGHT, BG_DARK, BG_MID, "vertical")
    draw = ImageDraw.Draw(img)

    # Subtle grid
    draw_decorative_grid(draw, WIDTH, HEIGHT)

    # Glow effects
    draw_glow(img, 200, 250, 200, ACCENT, alpha=20)
    draw_glow(img, 800, 250, 150, HIGHLIGHT, alpha=15)

    # Draw logo on the left
    logo_x, logo_y = 200, 250
    draw_logo(img, logo_x, logo_y, 180)

    # Try to use a good font, fallback to default
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
    ]

    title_font = None
    subtitle_font = None
    tagline_font = None

    for fp in font_paths:
        try:
            title_font = ImageFont.truetype(fp, 72)
            subtitle_font = ImageFont.truetype(fp.replace("-Bold", ""), 28)
            tagline_font = ImageFont.truetype(fp, 22)
            break
        except (OSError, IOError):
            continue

    if title_font is None:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
        tagline_font = ImageFont.load_default()

    # Title text
    draw = ImageDraw.Draw(img)
    title_x = 340

    # "Shikai" title
    draw.text((title_x, 170), "Shikai", fill=TEXT_WHITE, font=title_font)

    # Tagline
    draw.text((title_x, 260), "Your read-only GitHub companion", fill=ACCENT_LIGHT, font=subtitle_font)

    # Feature highlights
    features = ["Repos", "Contributions", "Activity", "Themes"]
    feature_x = title_x
    feature_y = 330

    for i, feat in enumerate(features):
        # Pill background
        bbox = draw.textbbox((0, 0), feat, font=tagline_font)
        pill_w = bbox[2] - bbox[0] + 24
        pill_h = bbox[3] - bbox[1] + 14

        pill_x = feature_x
        pill_y = feature_y

        # Draw pill
        draw.rounded_rectangle(
            [pill_x, pill_y, pill_x + pill_w, pill_y + pill_h],
            radius=12,
            fill=(30, 58, 95),
            outline=ACCENT,
            width=1
        )
        draw.text((pill_x + 12, pill_y + 4), feat, fill=TEXT_WHITE, font=tagline_font)

        feature_x += pill_w + 12

    # Decorative dots on the right
    for i in range(5):
        for j in range(3):
            dx = 820 + i * 30
            dy = 180 + j * 30
            alpha = max(0, 255 - (i + j) * 40)
            draw_circle(draw, dx, dy, 3, fill=(*ACCENT, alpha) if alpha > 0 else None)

    # Save
    output_path = "assets/images/feature-graphic.png"
    img.save(output_path, "PNG")
    print(f"Feature graphic saved to {output_path}")
    print(f"Dimensions: {WIDTH}x{HEIGHT}")


if __name__ == "__main__":
    main()
