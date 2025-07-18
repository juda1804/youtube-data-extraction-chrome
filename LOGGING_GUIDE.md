# Logging Guide: YouTube to n8n Extension

This guide shows you how to view real-time data extraction logs while configuring your extension.

## 🔍 How to View Logs

### 1. YouTube Page Console (Data Extraction)
**See what notifications are being detected:**

1. **Open YouTube** (`https://www.youtube.com`)
2. **Open Developer Console**: Press `F12` → `Console` tab
3. **Look for logs starting with**:
   - `🚀 YouTube Notification Monitor: Content script loaded`
   - `🔔 YouTube Notification Detected` (grouped logs with extracted data)
   - `🔍 Found X notification elements in panel`

**What you'll see:**
```
🔔 YouTube Notification Detected
📊 Extracted Data: {id: "notification_...", type: "notification", ...}
🆔 ID: notification_New_video_2024-01-15
📝 Type: notification
📰 Title: New video from Channel Name
⏰ Time: 2 minutes ago
🔗 Link: https://www.youtube.com/watch?v=...
🌐 Page URL: https://www.youtube.com
```

### 2. Extension Background Console (Webhook Activity)
**See webhook requests and n8n communication:**

1. **Go to Chrome Extensions**: `chrome://extensions/`
2. **Find your extension** → Click `inspect views: background page`
3. **Look for logs starting with**:
   - `🚀 YouTube to n8n Background Service Worker: Initialized`
   - `📨 Background: Notification Received` (grouped logs)
   - `🚀 Sending to n8n` (webhook requests)

**What you'll see:**
```
📨 Background: Notification Received
📊 Data received from content script: {...}
⚙️ Current configuration: {enabled: true, hasWebhookUrl: false, ...}
⚠️ No webhook URL configured, skipping notification
💡 Configure webhook URL in extension popup to enable sending to n8n
```

### 3. Extension Popup Console (Configuration)
**See extension setup and configuration:**

1. **Click extension icon** in toolbar
2. **Right-click in popup** → `Inspect` → `Console` tab
3. **Look for initialization logs**

## 📊 Log Types Explained

### ✅ **Success Logs**
- `🔔 YouTube Notification Detected` - New notification found
- `✅ New notification found, sending to background...` - Data being sent
- `🎉 Notification sent successfully to n8n` - Webhook succeeded

### ⚠️ **Warning Logs**  
- `⏭️ Notification already processed, skipping` - Duplicate prevention
- `⚠️ No webhook URL configured` - Need to set up webhook
- `⏸️ Extension is disabled` - Extension turned off

### ❌ **Error Logs**
- `❌ Failed to extract data from notification element` - YouTube DOM changed
- `❌ Error sending to n8n` - Network/webhook issues
- `❌ Error handling notification` - General errors

## 🧪 Testing Without n8n

**You can test data extraction without configuring n8n:**

1. Load extension in Chrome
2. Visit YouTube and open console (F12)
3. Look for notification detection logs
4. You'll see "No webhook URL configured" - this is expected
5. All extracted data will be logged for you to review

## 🔧 Common Debugging Steps

### Not Seeing Any Logs?
1. **Refresh YouTube page** after loading extension
2. **Check extension is enabled** in `chrome://extensions/`
3. **Look in correct console** (YouTube page, not extension popup)

### No Notifications Being Detected?
1. **Check you have YouTube notifications** (bell icon with number)
2. **Try clicking the notification bell** to open panel
3. **Visit channels with community posts**
4. **Subscribe to active channels** and enable notifications

### Webhook Not Working?
1. **Check webhook URL format** (must start with http/https)
2. **Test webhook URL** using the "Test" button in popup
3. **Verify n8n webhook is running** and accessible

## 🎯 What to Look For

**Before configuring n8n webhook:**
- ✅ Content script loads on YouTube
- ✅ Notifications are detected and logged
- ✅ Data extraction shows all required fields
- ⚠️ "No webhook URL configured" messages (expected)

**After configuring n8n webhook:**
- ✅ Webhook URL saved successfully
- ✅ Test webhook succeeds
- ✅ Real notifications sent to n8n
- ✅ n8n receives data in correct format

## 📋 Sample Test Process

1. **Load extension** and verify no errors
2. **Open YouTube** and check console for content script loading
3. **Navigate around YouTube** and watch for notification detection
4. **Configure webhook URL** in extension popup
5. **Test webhook** and verify success
6. **Wait for real notifications** and monitor both consoles

---

**💡 Tip**: Keep both the YouTube console and extension background console open while testing to see the complete data flow from detection to webhook delivery. 