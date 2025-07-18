# Icon Files Instructions

The extension requires three icon files referenced in `manifest.json`:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels) 
- `icon128.png` (128x128 pixels)

## Quick Solution: Create Simple Icons

You can create simple placeholder icons using any of these methods:

### Method 1: Online Icon Generator
1. Visit https://www.favicon-generator.org/ or similar
2. Upload any image or create a simple design
3. Download the generated icons
4. Rename them to match the required filenames

### Method 2: Using Image Editor
1. Open any image editor (Photoshop, GIMP, Paint, etc.)
2. Create new images with the required dimensions
3. Add a simple design (e.g., "Y→N" text, YouTube logo, etc.)
4. Save as PNG files with the correct names

### Method 3: Use Automated Setup Script
Run the provided setup script to automatically download and create proper icons:

```bash
# Make script executable and run
chmod +x setup.sh
./setup.sh
```

This script will:
- Download a YouTube-style icon from the web
- Resize it to all required dimensions (16x16, 48x48, 128x128)
- Create fallback icons if download fails
- Set up the complete extension environment

### Method 4: Manual Script Commands
If you prefer to run commands manually:

```bash
# Download an icon and create all sizes
curl -o temp_icon.png "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/512px-YouTube_full-color_icon_%282017%29.svg.png"

# Create required sizes with ImageMagick
convert temp_icon.png -resize 16x16 icon16.png
convert temp_icon.png -resize 48x48 icon48.png
convert temp_icon.png -resize 128x128 icon128.png

# Clean up
rm temp_icon.png
```

### Method 5: Use Chrome's Default
If you don't create icons, Chrome will use a default puzzle piece icon, which works but looks unprofessional.

## Recommended Design
For a YouTube to n8n extension, consider:
- YouTube red (#FF0000) background
- White text/symbols
- Simple "Y→N" text or arrow symbol
- Keep it recognizable at small sizes

Place the icon files in the root directory alongside `manifest.json`. 