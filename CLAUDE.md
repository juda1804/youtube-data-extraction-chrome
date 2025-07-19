# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome Extension (Manifest V3) that monitors YouTube notifications and scrapes César Langreo channel posts, sending data to n8n webhooks for automation. Built with vanilla JavaScript ES6+ modules, no external dependencies or build process required.

## Development Commands

### Installation & Setup
```bash
# Setup icons and validate extension files
./setup.sh

# Load extension in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" and select this directory
```

### Testing & Debugging
```javascript
// In background service worker console (chrome://extensions/ -> Service Worker)
quickTest()                    // Basic functionality test
runAllTests()                  // Comprehensive test suite
youtubeDB.getStats()           // Database statistics
youtubeDB.exportData()         // Export all data
youtubeDB.clearAllData()       // Clear database (testing only)

// Storage debugging
chrome.storage.local.get(null).then(console.log)  // View all settings
chrome.alarms.getAll().then(console.log)          // View active alarms
```

### Common Development Tasks
- **Reload extension**: chrome://extensions/ -> Reload button
- **View logs**: F12 -> Extensions tab -> Background script
- **Test webhook**: Use popup "Test" button
- **Manual scraping**: Popup "📊 Scrape Now" button

## Architecture Overview

### Core Components
- **background.js**: Service worker handling HTTP requests, alarms, and database testing
- **content.js**: YouTube page monitoring for notifications and posts scraping
- **popup.js**: Configuration UI for webhook URL, intervals, and manual controls
- **database.js**: IndexedDB wrapper with custom implementation (no external deps)

### Data Flow
1. Content script monitors YouTube notifications/posts
2. Data filtered by activation date and duplicates
3. Background service worker sends to n8n webhook
4. IndexedDB stores posts/sessions with 30-day retention

### Key Files Structure
```
manifest.json          # Extension configuration (Manifest V3)
background.js          # Service worker (ES6 modules)
content.js            # YouTube page interaction
popup.html/js         # Configuration interface
database.js           # IndexedDB wrapper
lib/idb.js           # Custom IndexedDB helper
test-indexeddb.js    # Testing utilities
```

### Storage & State Management
- **IndexedDB**: Posts, sessions, unlimited storage (custom wrapper in database.js)
- **Chrome Storage**: Webhook URL, enable/disable state, intervals
- **Activation Date**: Prevents processing old posts when auto-scraping enabled

### Special Features
- **1-minute optimized mode**: Reuses tabs for better performance
- **Activation date filtering**: Only processes posts newer than auto-scraping start
- **Duplicate prevention**: Post IDs track processed content
- **Session tracking**: Comprehensive scraping analytics

## Development Notes

### No Build Process
- Pure vanilla JavaScript ES6+ with modules
- Direct file modification and extension reload for development
- No package.json, webpack, or external dependencies

### Debugging Access
- Background console: chrome://extensions/ -> Service Worker
- Content script: F12 on YouTube pages
- Popup: F12 on popup window (inspect popup)

### Colombia Timezone Handling
The extension includes specific timezone handling for Colombian dates, particularly for activation date functionality that filters posts based on local Colombian time.

### Performance Considerations
- Special 1-minute mode optimizes resource usage
- IndexedDB with automatic cleanup (30-day retention, 100 session limit)
- Tab reuse strategy for high-frequency scraping