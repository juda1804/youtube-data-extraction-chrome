// YouTube to n8n Background Service Worker
(() => {
  'use strict';

  // Configuration keys
  const STORAGE_KEYS = {
    WEBHOOK_URL: 'n8n_webhook_url',
    ENABLED: 'extension_enabled',
    LAST_SUCCESS: 'last_success_timestamp'
  };

  // Default configuration
  const DEFAULT_CONFIG = {
    [STORAGE_KEYS.ENABLED]: true,
    [STORAGE_KEYS.WEBHOOK_URL]: '',
    [STORAGE_KEYS.LAST_SUCCESS]: null
  };

  // Track César Langreo tab for 1-minute mode
  let cesarLangreoTabId = null;

  // Helper functions for tab management
  async function tabExists(tabId) {
    try {
      await chrome.tabs.get(tabId);
      return true;
    } catch {
      return false;
    }
  }

  async function findExistingTab(url) {
    try {
      const tabs = await chrome.tabs.query({ url: url });
      return tabs.length > 0 ? tabs[0] : null;
    } catch {
      return null;
    }
  }

  // Initialize extension
  chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install' || details.reason === 'update') {
      await initializeExtension();
    }
  });

  // Initialize extension configuration
  async function initializeExtension() {
    try {
      const stored = await chrome.storage.local.get(Object.keys(DEFAULT_CONFIG));
      const config = { ...DEFAULT_CONFIG, ...stored };
      await chrome.storage.local.set(config);
      console.log('Extension initialized with config:', config);
    } catch (error) {
      console.error('Error initializing extension:', error);
    }
  }

  // Handle messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'notification_detected') {
      handleNotificationDetected(message.data);
    } else if (message.action === 'get_config') {
      getConfiguration().then(sendResponse);
      return true; // Indicates async response
    } else if (message.action === 'update_config') {
      updateConfiguration(message.config).then(sendResponse);
      return true; // Indicates async response
    } else if (message.action === 'test_webhook') {
      testWebhook(message.webhookUrl).then(sendResponse);
      return true; // Indicates async response
    } else if (message.action === 'scrape_cesar_langreo') {
      scrapeCesarLangreoPosts().then(sendResponse);
      return true; // Indicates async response
    } else if (message.action === 'toggle_auto_scraping') {
      toggleAutoScraping(message.enabled, message.intervalMinutes).then(sendResponse);
      return true; // Indicates async response
    }
  });

  // Handle detected notification
  async function handleNotificationDetected(notificationData) {
    try {
      console.group('📨 Background: Notification Received');
      console.log('📊 Data received from content script:', notificationData);
      
      const config = await getConfiguration();
      console.log('⚙️ Current configuration:', {
        enabled: config[STORAGE_KEYS.ENABLED],
        hasWebhookUrl: !!config[STORAGE_KEYS.WEBHOOK_URL],
        webhookUrl: config[STORAGE_KEYS.WEBHOOK_URL] ? 
          config[STORAGE_KEYS.WEBHOOK_URL].substring(0, 50) + '...' : 'Not set'
      });
      
      if (!config[STORAGE_KEYS.ENABLED]) {
        console.warn('⏸️ Extension is disabled, skipping notification');
        console.groupEnd();
        return;
      }

      if (!config[STORAGE_KEYS.WEBHOOK_URL]) {
        console.warn('⚠️ No webhook URL configured, skipping notification');
        console.log('💡 Configure webhook URL in extension popup to enable sending to n8n');
        console.groupEnd();
        return;
      }

      console.log('✅ Configuration valid, processing notification...');
      
      const success = await sendToN8n(notificationData, config[STORAGE_KEYS.WEBHOOK_URL]);
      
      if (success) {
        await chrome.storage.local.set({
          [STORAGE_KEYS.LAST_SUCCESS]: new Date().toISOString()
        });
        console.log('🎉 Notification sent successfully to n8n');
      } else {
        console.error('❌ Failed to send notification to n8n');
      }
      
      console.groupEnd();
    } catch (error) {
      console.error('❌ Error handling notification:', error);
      console.groupEnd();
    }
  }

  // Send data to n8n webhook
  async function sendToN8n(data, webhookUrl) {
    try {
      const payload = {
        timestamp: new Date().toISOString(),
        source: 'youtube-chrome-extension',
        notification: data
      };

      console.group('🚀 Sending to n8n');
      console.log('🔗 Webhook URL:', webhookUrl.substring(0, 50) + '...');
      console.log('📦 Payload:', payload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 HTTP Response Status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json().catch(() => ({ status: 'ok' }));
      console.log('✅ n8n response:', result);
      console.groupEnd();
      return true;
    } catch (error) {
      console.error('❌ Error sending to n8n:', error);
      console.groupEnd();
      return false;
    }
  }

  // Get current configuration
  async function getConfiguration() {
    try {
      const stored = await chrome.storage.local.get(Object.keys(DEFAULT_CONFIG));
      return { ...DEFAULT_CONFIG, ...stored };
    } catch (error) {
      console.error('Error getting configuration:', error);
      return DEFAULT_CONFIG;
    }
  }

  // Update configuration
  async function updateConfiguration(newConfig) {
    try {
      await chrome.storage.local.set(newConfig);
      console.log('Configuration updated:', newConfig);
      return { success: true };
    } catch (error) {
      console.error('Error updating configuration:', error);
      return { success: false, error: error.message };
    }
  }

  // Test webhook connection
  async function testWebhook(webhookUrl) {
    try {
      if (!webhookUrl) {
        return { success: false, error: 'No webhook URL provided' };
      }

      const testData = {
        id: 'test_notification',
        type: 'test',
        title: 'Test notification from YouTube extension',
        time: 'now',
        thumbnail: '',
        link: '',
        timestamp: new Date().toISOString(),
        url: 'https://www.youtube.com/test'
      };

      const success = await sendToN8n(testData, webhookUrl);
      
      if (success) {
        await chrome.storage.local.set({
          [STORAGE_KEYS.LAST_SUCCESS]: new Date().toISOString()
        });
        return { success: true, message: 'Test webhook sent successfully' };
      } else {
        return { success: false, error: 'Failed to send test webhook' };
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle extension icon click
  chrome.action.onClicked.addListener((tab) => {
    // This will open the popup (defined in manifest.json)
    // No additional action needed here
  });

  // Monitor tab updates to detect YouTube navigation
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com')) {
      // YouTube page loaded, content script will handle monitoring
      console.log('YouTube page loaded:', tab.url);
    }
  });

  // Initialize auto-scraping on startup
  initializeAutoScraping();

  // César Langreo scraping functionality
  async function scrapeCesarLangreoPosts() {
    try {
      console.group('🔍 Scraping César Langreo Posts');
      console.log('🌐 Target URL: https://www.youtube.com/c/CésarLangreo/posts');
      
      // Check if we're in 1-minute mode
      const config = await chrome.storage.local.get(['scraping_interval_minutes']);
      const isOneMinuteMode = config.scraping_interval_minutes === 1;
      
      let tab = null;
      
      if (isOneMinuteMode) {
        console.log('⚡ 1-minute mode: Reusing existing tab');
        
        // Try to use saved tab
        if (cesarLangreoTabId && await tabExists(cesarLangreoTabId)) {
          tab = await chrome.tabs.get(cesarLangreoTabId);
          console.log('🔄 Reloading existing tab');
          await chrome.tabs.reload(tab.id);
          await chrome.tabs.update(tab.id, { active: false });
        } else {
          // Look for existing tab by URL
          tab = await findExistingTab('https://www.youtube.com/c/CésarLangreo/posts');
          if (tab) {
            console.log('🔍 Found existing tab by URL');
            cesarLangreoTabId = tab.id;
            await chrome.tabs.reload(tab.id);
            await chrome.tabs.update(tab.id, { active: false });
          } else {
            // Create new tab (first time)
            console.log('🆕 Creating new persistent tab');
            tab = await chrome.tabs.create({
              url: 'https://www.youtube.com/c/CésarLangreo/posts',
              active: false
            });
            cesarLangreoTabId = tab.id;
          }
        }
      } else {
        // Normal mode: create temporary tab
        console.log('🔄 Normal mode: Creating temporary tab');
        tab = await chrome.tabs.create({
          url: 'https://www.youtube.com/c/CésarLangreo/posts',
          active: false
        });
      }
      
      console.log('⏳ Waiting for page to load...');
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds for loading
      
      // Inject script to extract posts data
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractPostsData
      });
      
      // Close tab only if NOT in 1-minute mode
      if (!isOneMinuteMode) {
        await chrome.tabs.remove(tab.id);
        console.log('🗑️ Tab closed');
      } else {
        console.log('📌 Tab kept open for reuse');
      }
      
      const extractedData = results[0]?.result;
      
      if (extractedData && extractedData.posts.length > 0) {
        console.log(`✅ Extracted ${extractedData.posts.length} posts`);
        console.log('📊 Extracted data:', extractedData);
        
        // Check for new posts and send to n8n
        const newPosts = await filterNewPosts(extractedData.posts);
        if (newPosts.length > 0) {
          console.log(`🆕 Found ${newPosts.length} new posts, sending to n8n...`);
          const success = await sendScrapedDataToN8n(extractedData);
          
          if (success) {
            await updateLastScrapingTime();
            await saveProcessedPosts(extractedData.posts);
            console.log('🎉 Scraping completed successfully');
          }
        } else {
          console.log('⏭️ No new posts found');
        }
        
        console.groupEnd();
        return { success: true, postsCount: extractedData.posts.length, newPosts: newPosts.length };
      } else {
        console.warn('⚠️ No posts extracted or extraction failed');
        console.groupEnd();
        return { success: false, error: 'No posts found or extraction failed' };
      }
      
    } catch (error) {
      console.error('❌ Error scraping César Langreo posts:', error);
      console.groupEnd();
      return { success: false, error: error.message };
    }
  }

  // Function to extract posts data (injected into the page)
  function extractPostsData() {
    const posts = [];
    
    try {
      // Wait for content to be fully loaded
      const postElements = document.querySelectorAll('ytd-backstage-post-renderer, ytd-post-renderer');
      console.log(`Found ${postElements.length} post elements`);
      
      postElements.forEach((post, index) => {
        try {
          const authorElement = post.querySelector('#author-text a, #author-text');
          const contentElement = post.querySelector('#content-text, .ytd-expander #content');
          const timeElement = post.querySelector('#published-time-text a, #published-time-text');
          const likesElement = post.querySelector('#vote-count-middle, [aria-label*="like"]');
          const imageElements = post.querySelectorAll('img[src*="yt"], img[src*="google"]');
          
          const author = authorElement ? authorElement.textContent.trim() : 'César Langreo';
          const content = contentElement ? contentElement.textContent.trim() : '';
          const time = timeElement ? timeElement.textContent.trim() : '';
          const likes = likesElement ? likesElement.textContent.trim() : '0';
          const images = Array.from(imageElements)
            .map(img => img.src)
            .filter(src => src && !src.includes('data:') && src.includes('http'));
          
          if (content || author) {
            const postId = `cesar_langreo_${Date.now()}_${index}_${content.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '')}`;
            
            posts.push({
              id: postId,
              channel: 'César Langreo',
              author: author,
              content: content,
              publishedTime: time,
              likes: likes,
              images: images,
              extractedAt: new Date().toISOString(),
              sourceUrl: window.location.href
            });
          }
        } catch (error) {
          console.error('Error extracting individual post:', error);
        }
      });
      
      return {
        channel: 'César Langreo',
        postsCount: posts.length,
        posts: posts,
        scrapedAt: new Date().toISOString(),
        sourceUrl: 'https://www.youtube.com/c/CésarLangreo/posts'
      };
      
    } catch (error) {
      console.error('Error in extractPostsData:', error);
      return { channel: 'César Langreo', postsCount: 0, posts: [], error: error.message };
    }
  }

  // Auto-scraping management
  async function toggleAutoScraping(enabled, intervalMinutes = 60) {
    try {
      if (enabled) {
        // Validate interval
        const interval = Math.max(1, Math.min(1440, intervalMinutes || 60));
        
        // Clear existing alarm first
        await chrome.alarms.clear('scrapeCesarLangreo');
        
        // Create alarm with configurable interval
        await chrome.alarms.create('scrapeCesarLangreo', {
          delayInMinutes: 1,
          periodInMinutes: interval
        });
        
        const intervalText = formatIntervalText(interval);
        console.log(`✅ Auto-scraping enabled (every ${intervalText})`);
      } else {
        // Clear the alarm
        await chrome.alarms.clear('scrapeCesarLangreo');
        console.log('❌ Auto-scraping disabled');
        
        // Reset tab tracking
        cesarLangreoTabId = null;
      }
      
      // Save the settings
      await chrome.storage.local.set({ 
        auto_scraping_enabled: enabled,
        scraping_interval_minutes: intervalMinutes || 60
      });
      
      return { success: true, enabled: enabled };
    } catch (error) {
      console.error('Error toggling auto-scraping:', error);
      return { success: false, error: error.message };
    }
  }

  // Format interval text for display
  function formatIntervalText(minutes) {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else if (minutes === 60) {
      return '1 hour';
    } else if (minutes % 60 === 0) {
      return `${minutes / 60} hours`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
  }

  // Initialize auto-scraping based on saved settings
  async function initializeAutoScraping() {
    try {
      const config = await chrome.storage.local.get(['auto_scraping_enabled', 'scraping_interval_minutes']);
      if (config.auto_scraping_enabled) {
        const interval = config.scraping_interval_minutes || 60;
        await toggleAutoScraping(true, interval);
        const intervalText = formatIntervalText(interval);
        console.log(`🔄 Auto-scraping restored from settings (every ${intervalText})`);
      }
    } catch (error) {
      console.error('Error initializing auto-scraping:', error);
    }
  }

  // Handle alarms (for auto-scraping)
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'scrapeCesarLangreo') {
      console.log('⏰ Auto-scraping triggered by alarm');
      await scrapeCesarLangreoPosts();
    }
  });

  // Filter new posts (avoid duplicates)
  async function filterNewPosts(posts) {
    try {
      const stored = await chrome.storage.local.get(['processed_posts']);
      const processedPosts = stored.processed_posts || [];
      
      return posts.filter(post => !processedPosts.includes(post.id));
    } catch (error) {
      console.error('Error filtering new posts:', error);
      return posts; // Return all posts if error
    }
  }

  // Save processed post IDs
  async function saveProcessedPosts(posts) {
    try {
      const stored = await chrome.storage.local.get(['processed_posts']);
      const processedPosts = stored.processed_posts || [];
      
      const newIds = posts.map(post => post.id);
      const updatedProcessed = [...new Set([...processedPosts, ...newIds])];
      
      // Keep only last 100 IDs to prevent storage bloat
      const trimmedProcessed = updatedProcessed.slice(-100);
      
      await chrome.storage.local.set({ processed_posts: trimmedProcessed });
    } catch (error) {
      console.error('Error saving processed posts:', error);
    }
  }

  // Send scraped data to n8n
  async function sendScrapedDataToN8n(data) {
    try {
      const config = await getConfiguration();
      const webhookUrl = config[STORAGE_KEYS.WEBHOOK_URL];
      
      if (!webhookUrl) {
        console.warn('⚠️ No webhook URL configured for scraped data');
        return false;
      }

      const payload = {
        timestamp: new Date().toISOString(),
        source: 'youtube-chrome-extension-scraper',
        type: 'cesar_langreo_posts',
        data: data
      };

      console.group('🚀 Sending scraped data to n8n');
      console.log('🔗 Webhook URL:', webhookUrl.substring(0, 50) + '...');
      console.log('📦 Payload:', payload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 HTTP Response Status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json().catch(() => ({ status: 'ok' }));
      console.log('✅ n8n response:', result);
      console.groupEnd();
      return true;
    } catch (error) {
      console.error('❌ Error sending scraped data to n8n:', error);
      console.groupEnd();
      return false;
    }
  }

  // Update last scraping timestamp
  async function updateLastScrapingTime() {
    try {
      await chrome.storage.local.set({
        last_scraping_time: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating last scraping time:', error);
    }
  }

  console.log('🚀 YouTube to n8n Background Service Worker: Initialized');
  console.log('💡 Check this console for webhook requests and n8n communication');
  console.log('🔧 Open extension popup to configure webhook URL');
  console.log('📊 César Langreo scraping system ready');
})();