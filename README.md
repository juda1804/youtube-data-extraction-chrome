# YouTube to n8n Chrome Extension

A powerful Chrome extension that captures YouTube notifications and scrapes specific channel content, sending all data to n8n webhooks for automation workflows.

## 🚀 Features

### ✨ Core Functionality
- **Real-time YouTube notification monitoring** - Captures notifications as they appear
- **César Langreo posts scraping** - Automated extraction of community posts
- **Configurable auto-scraping** - Custom intervals from 1 minute to 24 hours
- **Smart tab management** - Optimized 1-minute mode with tab reuse
- **Webhook integration** - Seamless n8n workflow integration
- **Duplicate prevention** - Intelligent filtering to avoid repeated data

### 🎯 Scraping Targets
- **Notification Bell** - YouTube notification dropdown content
- **Community Posts** - Text, images, likes, timestamps
- **Channel Posts** - Specific channel content (César Langreo)

### ⚙️ Configuration Options
- **Webhook URL** - Your n8n webhook endpoint
- **Enable/Disable** - Toggle extension functionality
- **Auto-scraping intervals** - 1 min to 1440 min (24 hours)
- **Manual scraping** - On-demand content extraction

## 📦 Installation

### Option 1: Chrome Web Store (Coming Soon)
1. Visit Chrome Web Store
2. Search for "YouTube to n8n"
3. Click "Add to Chrome"

### Option 2: Developer Mode
1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/youtube-to-n8n-extension.git
   cd youtube-to-n8n-extension
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (top right toggle)

4. Click "Load unpacked" and select the extension folder

5. The extension icon should appear in your toolbar

## 🔧 Setup & Configuration

### 1. n8n Webhook Setup
1. Create a new workflow in n8n
2. Add a "Webhook" trigger node
3. Copy the webhook URL (e.g., `https://your-n8n.com/webhook/youtube-extension`)

### 2. Extension Configuration
1. Click the extension icon in Chrome toolbar
2. Paste your webhook URL
3. Enable the extension
4. Configure scraping interval (optional)

### 3. Test Connection
1. Click "Test" button to verify webhook connectivity
2. Check n8n for received test data

## 📊 Usage

### Real-time Notifications
- Visit YouTube with the extension enabled
- Notifications are automatically captured and sent to n8n
- Check browser console (F12) for detailed logs

### César Langreo Scraping

#### Manual Scraping
1. Click "📊 Scrape Now" button
2. Extension extracts current posts
3. Data is sent to your n8n webhook

#### Auto-scraping
1. Check "Enable auto-scraping"
2. Set desired interval (5-1440 minutes)
3. Extension runs automatically in background

#### Special 1-Minute Mode
- When interval = 1 minute, extension optimizes by:
  - Keeping browser tab open permanently
  - Reloading page instead of creating new tabs
  - Reducing resource usage and improving speed

## 📄 Data Structure

### Notification Data
```json
{
  "timestamp": "2024-01-20T16:30:00.000Z",
  "source": "youtube-chrome-extension",
  "notification": {
    "id": "notification_unique_id",
    "type": "notification",
    "title": "Video title or notification text",
    "time": "2 hours ago",
    "thumbnail": "https://img.youtube.com/...",
    "link": "https://www.youtube.com/watch?v=...",
    "url": "https://www.youtube.com/notifications"
  }
}
```

### Scraped Posts Data
```json
{
  "timestamp": "2024-01-20T16:30:00.000Z",
  "source": "youtube-chrome-extension-scraper",
  "type": "cesar_langreo_posts",
  "data": {
    "channel": "César Langreo",
    "postsCount": 3,
    "scrapedAt": "2024-01-20T16:30:00.000Z",
    "sourceUrl": "https://www.youtube.com/c/CésarLangreo/posts",
    "posts": [
      {
        "id": "cesar_langreo_1706634600_0_PostContent",
        "channel": "César Langreo",
        "author": "César Langreo",
        "content": "Post text content...",
        "publishedTime": "hace 2 horas",
        "likes": "15",
        "images": ["https://yt3.ggpht.com/image1.jpg"],
        "extractedAt": "2024-01-20T16:30:00.000Z",
        "sourceUrl": "https://www.youtube.com/c/CésarLangreo/posts"
      }
    ]
  }
}
```

## 🛠️ Technical Details

### Architecture
- **Manifest V3** - Latest Chrome extension standard
- **Service Worker** - Background processing
- **Content Scripts** - YouTube page interaction
- **Popup Interface** - User configuration

### Permissions Required
- `tabs` - Tab management for scraping
- `activeTab` - Current tab access
- `storage` - Configuration persistence
- `alarms` - Scheduled scraping
- `scripting` - Content injection

### Browser Support
- ✅ Chrome 88+
- ✅ Chromium-based browsers (Edge, Brave, etc.)
- ❌ Firefox (Manifest V3 not fully supported)

## 🔍 Debugging & Troubleshooting

### Enable Debug Logging
1. Open Chrome DevTools (F12)
2. Go to "Extensions" tab
3. Find "YouTube to n8n" background script
4. View real-time logs

### Common Issues

#### "No webhook URL configured"
- Ensure webhook URL is saved in extension popup
- Verify URL format: `https://your-domain.com/webhook/path`

#### "Test failed" errors
- Check n8n webhook is active and accessible
- Verify network connectivity
- Check webhook URL for typos

#### Scraping not working
- Ensure César Langreo channel URL is accessible
- Check if YouTube layout has changed
- Verify Chrome has necessary permissions

#### Auto-scraping not triggering
- Check if alarms permission is granted
- Verify interval is set correctly (1-1440 minutes)
- Background script must remain active

### Debug Commands
```javascript
// In background console
chrome.storage.local.get(null).then(console.log); // View all settings
chrome.alarms.getAll().then(console.log); // View active alarms
```

## 📝 Configuration Examples

### Ultra-fast monitoring (1-minute optimized)
```
Interval: 1 minute
Use case: Real-time monitoring
Resource usage: Optimized (tab reuse)
```

### High-frequency monitoring (Testing)
```
Interval: 5 minutes
Use case: Development/testing
Resource usage: High
```

### Standard monitoring
```
Interval: 60 minutes (1 hour)
Use case: Regular content updates
Resource usage: Medium
```

### Daily checks
```
Interval: 1440 minutes (24 hours)
Use case: Daily summaries
Resource usage: Low
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **n8n Documentation**: https://docs.n8n.io/
- **Chrome Extensions Guide**: https://developer.chrome.com/docs/extensions/
- **Issues & Support**: [GitHub Issues](https://github.com/your-username/youtube-to-n8n-extension/issues)

## 🏷️ Version History

### v1.0.0 (Current)
- ✅ Real-time YouTube notification monitoring
- ✅ César Langreo posts scraping
- ✅ Configurable auto-scraping intervals (1-1440 min)
- ✅ Optimized 1-minute mode with tab reuse
- ✅ Webhook testing and configuration
- ✅ Duplicate prevention system
- ✅ Background service worker implementation

---

## 📞 Support

If you need help or have questions:

1. Check the [troubleshooting section](#-debugging--troubleshooting)
2. Review [configuration examples](#-configuration-examples)
3. Open an [issue on GitHub](https://github.com/your-username/youtube-to-n8n-extension/issues)

**Made with ❤️ for automation enthusiasts** 