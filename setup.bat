@echo off
REM YouTube to n8n Chrome Extension Setup Script (Windows)
REM This script downloads icons and sets up the complete extension environment

echo 🚀 Setting up YouTube to n8n Chrome Extension...
echo.

REM Function to check if a command exists
where curl >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  curl not found. Cannot download icons automatically.
    goto create_fallback
)

echo 🎨 Setting up extension icons...
echo 📥 Downloading YouTube icon...

REM Try to download YouTube icon
curl -L -o temp_icon.png "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/512px-YouTube_full-color_icon_%282017%29.svg.png" >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Failed to download icon. Creating simple fallback icons...
    goto create_fallback
)

echo ✅ Icon downloaded successfully!

REM Check if ImageMagick is available
where magick >nul 2>nul
if %errorlevel% neq 0 (
    where convert >nul 2>nul
    if %errorlevel% neq 0 (
        echo ⚠️  ImageMagick not found. Cannot resize downloaded icon.
        del temp_icon.png >nul 2>nul
        goto create_fallback
    )
    set CONVERT_CMD=convert
) else (
    set CONVERT_CMD=magick
)

echo 🔧 Resizing icons to required dimensions...

REM Create all required sizes
%CONVERT_CMD% temp_icon.png -resize 16x16 icon16.png >nul 2>nul
%CONVERT_CMD% temp_icon.png -resize 48x48 icon48.png >nul 2>nul
%CONVERT_CMD% temp_icon.png -resize 128x128 icon128.png >nul 2>nul

REM Clean up temp file
del temp_icon.png >nul 2>nul

REM Verify files were created
if exist icon16.png if exist icon48.png if exist icon128.png (
    echo ✅ Icon files created successfully!
    echo    - icon16.png ^(16x16^) ✓
    echo    - icon48.png ^(48x48^) ✓
    echo    - icon128.png ^(128x128^) ✓
    goto validate_extension
)

echo ⚠️  Some icon files failed to create. Creating fallback icons...

:create_fallback
echo 📝 Creating simple fallback icons...
REM Create simple colored rectangles as fallback (requires ImageMagick)
where magick >nul 2>nul
if %errorlevel% neq 0 (
    where convert >nul 2>nul
    if %errorlevel% neq 0 (
        echo ❌ ImageMagick not found. Cannot create icons automatically.
        echo    Please create icon files manually ^(see ICON_INSTRUCTIONS.md^)
        goto validate_extension
    )
    set CONVERT_CMD=convert
) else (
    set CONVERT_CMD=magick
)

%CONVERT_CMD% -size 16x16 xc:#FF0000 -pointsize 8 -fill white -gravity center -annotate +0+0 "YN" icon16.png >nul 2>nul
%CONVERT_CMD% -size 48x48 xc:#FF0000 -pointsize 24 -fill white -gravity center -annotate +0+0 "Y→N" icon48.png >nul 2>nul
%CONVERT_CMD% -size 128x128 xc:#FF0000 -pointsize 64 -fill white -gravity center -annotate +0+0 "Y→N" icon128.png >nul 2>nul

if exist icon16.png if exist icon48.png if exist icon128.png (
    echo ✅ Fallback icons created successfully!
) else (
    echo ❌ Failed to create fallback icons. Please create manually.
)

:validate_extension
echo.
echo 🔍 Validating extension files...

set missing_files=
if not exist manifest.json set missing_files=%missing_files% manifest.json
if not exist background.js set missing_files=%missing_files% background.js
if not exist content.js set missing_files=%missing_files% content.js
if not exist popup.html set missing_files=%missing_files% popup.html
if not exist popup.js set missing_files=%missing_files% popup.js

if "%missing_files%"=="" (
    echo ✅ All extension files present!
) else (
    echo ❌ Missing required files:%missing_files%
    echo ⚠️  Extension may not work properly.
)

echo.
echo 📋 Next steps:
echo 1. Open Chrome and go to chrome://extensions/
echo 2. Enable 'Developer mode' ^(toggle in top-right^)
echo 3. Click 'Load unpacked' and select this folder
echo 4. Click the extension icon in your toolbar
echo 5. Enter your n8n webhook URL and enable monitoring
echo 6. Visit YouTube and test the notification capture
echo.
echo 📖 Documentation:
echo    - README.md - Complete setup and usage guide
echo    - LOGGING_GUIDE.md - Real-time data viewing guide
echo    - TESTING_GUIDE.md - Step-by-step testing instructions
echo    - ICON_INSTRUCTIONS.md - Manual icon creation guide
echo.

if exist icon16.png if exist icon48.png if exist icon128.png (
    echo 🎉 Setup complete! Your YouTube to n8n extension is ready to use!
) else (
    echo ⚠️  Setup completed with warnings. Check icon files before loading extension.
)

echo.
echo Press any key to exit...
pause >nul 