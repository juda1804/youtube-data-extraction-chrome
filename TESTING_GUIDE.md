# Testing Guide: YouTube to n8n Extension

This guide will help you test the extension to ensure it's working correctly.

## Prerequisites for Testing

1. **Chrome Extension Loaded**: Extension should be loaded in Chrome
2. **n8n Instance**: Running n8n instance with webhook capability
3. **YouTube Account**: Logged into YouTube with active subscriptions
4. **Test Webhook**: n8n workflow set up to receive webhooks

## Phase 1: Basic Installation Testing

### 1.1 Extension Loading Test
- [ ] Extension appears in `chrome://extensions/`
- [ ] Extension icon visible in toolbar (or extensions menu)
- [ ] No errors in Chrome extensions page
- [ ] Popup opens when clicking extension icon

### 1.2 Configuration UI Test
- [ ] Popup displays correctly with all UI elements
- [ ] Webhook URL input field accepts text
- [ ] Enable/disable checkbox works
- [ ] Save button responds to clicks
- [ ] Status indicator shows current state

## Phase 2: n8n Integration Testing

### 2.1 Set Up Test n8n Workflow

Create a simple n8n workflow:
```
Webhook Node → Set Node → HTTP Request to webhook.site
```

1. **Add Webhook Node**:
   - Method: `POST`
   - Path: `/youtube-test`
   - Response Mode: `Respond immediately`

2. **Add Set Node** (optional, for data processing):
   - Add any data transformations you need

3. **Add HTTP Request Node** (for external verification):
   - Method: `POST`
   - URL: `https://webhook.site/your-unique-url` (get from webhook.site)

### 2.2 Webhook Configuration Test
- [ ] Copy n8n webhook URL to extension
- [ ] Click "Save" - should show success message
- [ ] Status should change to "Active - Monitoring YouTube notifications"

### 2.3 Test Webhook Function
- [ ] Click "Test" button in extension popup
- [ ] Should show "Test webhook sent successfully!"
- [ ] Check n8n workflow - should receive test data
- [ ] Check webhook.site - should receive forwarded data
- [ ] Last success timestamp should update

## Phase 3: YouTube Monitoring Testing

### 3.1 Content Script Loading Test
1. **Open Developer Console**:
   - Go to YouTube (`https://www.youtube.com`)
   - Press F12 → Console tab
   - Look for: `"YouTube Notification Monitor: Content script loaded"`

### 3.2 Notification Detection Test

**Setup for Testing**:
1. Subscribe to active YouTube channels
2. Enable notifications for some channels
3. Use channels that post frequently

**Testing Methods**:

#### Method A: Wait for Natural Notifications
- [ ] Visit YouTube home page
- [ ] Wait for new video notifications to appear
- [ ] Check browser console for extension messages
- [ ] Verify data sent to n8n

#### Method B: Trigger Notifications Manually
- [ ] Click YouTube notification bell
- [ ] Open notification panel
- [ ] Check console for: `"Notification badge detected"`
- [ ] Verify notification extraction messages

#### Method C: Community Posts
- [ ] Visit channels with community posts
- [ ] Scroll through community tab
- [ ] Check for community post detection messages

### 3.3 Data Validation Test

When notifications are captured, verify:
- [ ] Data appears in n8n workflow
- [ ] JSON structure matches expected format:
  ```json
  {
    "timestamp": "ISO date string",
    "source": "youtube-chrome-extension",
    "notification": {
      "id": "unique_id",
      "type": "notification|community_post",
      "title": "notification title",
      "time": "relative time",
      "thumbnail": "image URL",
      "link": "YouTube URL",
      "timestamp": "ISO date string",
      "url": "current page URL"
    }
  }
  ```

## Phase 4: Edge Case Testing

### 4.1 Extension State Management
- [ ] Disable extension → re-enable → still works
- [ ] Change webhook URL → old URL stops receiving data
- [ ] Clear browser data → extension resets properly

### 4.2 YouTube Navigation Testing
- [ ] Navigate between YouTube pages (Home → Subscriptions → Watch)
- [ ] Extension continues working after navigation
- [ ] No duplicate notifications sent

### 4.3 Error Handling Testing
- [ ] Invalid webhook URL → appropriate error message
- [ ] Network offline → extension handles gracefully
- [ ] n8n instance down → no crashes, retries work

## Phase 5: Performance Testing

### 5.1 Resource Usage
- [ ] Check Chrome Task Manager → extension uses minimal CPU/memory
- [ ] No memory leaks during extended usage
- [ ] YouTube performance not noticeably affected

### 5.2 Notification Processing
- [ ] Multiple rapid notifications handled correctly
- [ ] No duplicate notifications sent
- [ ] Processed notification tracking working

## Debugging Common Issues

### Extension Not Loading
```bash
# Check Chrome console for errors
chrome://extensions/ → Developer mode → inspect views: background page
```

### Content Script Not Working
```javascript
// Check in YouTube console
console.log('Extension status check');
// Should see content script messages
```

### n8n Not Receiving Data
1. Verify webhook URL format
2. Check n8n webhook node configuration
3. Test webhook directly with curl:
```bash
curl -X POST "your-webhook-url" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### YouTube Changes
- YouTube frequently updates their interface
- Check browser console for errors
- Extension may need updates for new YouTube layout

## Test Checklist Summary

**Installation & Setup** ✅
- [ ] Extension loads correctly
- [ ] UI works properly  
- [ ] Configuration saves

**n8n Integration** ✅
- [ ] Webhook URL configuration
- [ ] Test webhook works
- [ ] Data reaches n8n

**YouTube Monitoring** ✅
- [ ] Content script loads
- [ ] Notifications detected
- [ ] Data captured correctly

**Edge Cases & Performance** ✅
- [ ] Error handling works
- [ ] Navigation supported
- [ ] Performance acceptable

## Success Criteria

The extension is working correctly when:
1. ✅ No errors in Chrome console
2. ✅ Test webhook succeeds
3. ✅ Real YouTube notifications appear in n8n
4. ✅ Data format matches specification
5. ✅ No performance issues observed

---

**Note**: YouTube's interface changes frequently. If notifications stop being detected, the selectors in `content.js` may need updating. 