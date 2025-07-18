#!/bin/bash

# YouTube to n8n Chrome Extension Setup Script
# This script downloads icons and sets up the complete extension environment

echo "🚀 Setting up YouTube to n8n Chrome Extension..."
echo ""

# Function to create fallback icons
create_fallback_icons() {
    echo "📝 Creating fallback icons..."
    if command -v convert >/dev/null 2>&1; then
        # Create simple red square icons with white text
        convert -size 16x16 xc:"#FF0000" -pointsize 8 -fill white -gravity center -annotate +0+0 "YN" icon16.png
        convert -size 48x48 xc:"#FF0000" -pointsize 24 -fill white -gravity center -annotate +0+0 "Y→N" icon48.png
        convert -size 128x128 xc:"#FF0000" -pointsize 64 -fill white -gravity center -annotate +0+0 "Y→N" icon128.png
        echo "✅ Fallback icons created successfully!"
    else
        echo "❌ ImageMagick not found. Cannot create icons automatically."
        echo "   Please see ICON_INSTRUCTIONS.md for manual creation."
        return 1
    fi
}

# Function to download and process YouTube icon
setup_icons() {
    echo "🎨 Setting up extension icons..."
    
    # Check if curl is available
    if command -v curl >/dev/null 2>&1; then
        echo "📥 Downloading YouTube icon..."
        
        # Try to download YouTube icon
        if curl -L -o temp_icon.png "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/512px-YouTube_full-color_icon_%282017%29.svg.png" 2>/dev/null; then
            echo "✅ Icon downloaded successfully!"
            
            # Check if ImageMagick is available for resizing
            if command -v convert >/dev/null 2>&1; then
                echo "🔧 Resizing icons to required dimensions..."
                
                # Create all required sizes
                convert temp_icon.png -resize 16x16 icon16.png 2>/dev/null
                convert temp_icon.png -resize 48x48 icon48.png 2>/dev/null
                convert temp_icon.png -resize 128x128 icon128.png 2>/dev/null
                
                # Clean up temp file
                rm -f temp_icon.png
                
                # Verify files were created
                if [[ -f "icon16.png" && -f "icon48.png" && -f "icon128.png" ]]; then
                    echo "✅ Icon files created successfully!"
                    echo "   - icon16.png (16x16) ✓"
                    echo "   - icon48.png (48x48) ✓" 
                    echo "   - icon128.png (128x128) ✓"
                    return 0
                else
                    echo "⚠️  Some icon files failed to create. Using fallback..."
                    rm -f temp_icon.png
                    create_fallback_icons
                fi
            else
                echo "⚠️  ImageMagick not found. Cannot resize downloaded icon."
                rm -f temp_icon.png
                create_fallback_icons
            fi
        else
            echo "⚠️  Failed to download icon. Using fallback..."
            create_fallback_icons
        fi
    else
        echo "⚠️  curl not found. Cannot download icon automatically."
        create_fallback_icons
    fi
}

# Function to validate extension files
validate_extension() {
    echo ""
    echo "🔍 Validating extension files..."
    
    local missing_files=()
    local required_files=("manifest.json" "background.js" "content.js" "popup.html" "popup.js")
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -eq 0 ]]; then
        echo "✅ All extension files present!"
    else
        echo "❌ Missing required files:"
        for file in "${missing_files[@]}"; do
            echo "   - $file"
        done
        echo "⚠️  Extension may not work properly."
        return 1
    fi
}

# Function to check system requirements
check_requirements() {
    echo "🔧 Checking system requirements..."
    
    local warnings=()
    
    # Check for curl
    if ! command -v curl >/dev/null 2>&1; then
        warnings+=("curl (for downloading icons)")
    fi
    
    # Check for ImageMagick
    if ! command -v convert >/dev/null 2>&1; then
        warnings+=("ImageMagick (for icon processing)")
    fi
    
    if [[ ${#warnings[@]} -eq 0 ]]; then
        echo "✅ All requirements met!"
    else
        echo "⚠️  Optional tools not found:"
        for warning in "${warnings[@]}"; do
            echo "   - $warning"
        done
        echo "   Extension will work, but setup may be limited."
    fi
    echo ""
}

# Main setup process
main() {
    check_requirements
    setup_icons
    validate_extension
    
    echo ""
    echo "📋 Next steps:"
    echo "1. Open Chrome and go to chrome://extensions/"
    echo "2. Enable 'Developer mode' (toggle in top-right)"
    echo "3. Click 'Load unpacked' and select this folder"
    echo "4. Click the extension icon in your toolbar"
    echo "5. Enter your n8n webhook URL and enable monitoring"
    echo "6. Visit YouTube and test the notification capture"
    echo ""
         echo "📖 Documentation:"
     echo "   - README.md - Complete setup and usage guide"
     echo "   - LOGGING_GUIDE.md - Real-time data viewing guide"
     echo "   - TESTING_GUIDE.md - Step-by-step testing instructions"
     echo "   - ICON_INSTRUCTIONS.md - Manual icon creation guide"
    echo ""
    
    if [[ -f "icon16.png" && -f "icon48.png" && -f "icon128.png" ]]; then
        echo "🎉 Setup complete! Your YouTube to n8n extension is ready to use!"
    else
        echo "⚠️  Setup completed with warnings. Check icon files before loading extension."
    fi
}

# Run main setup
main 