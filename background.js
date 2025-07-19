// YouTube to n8n Background Service Worker
import youtubeDB from './database.js';

// Simple testing functions directly in background for debugging
async function quickTest() {
  console.log('🚀 Running quick IndexedDB test...');
  
  try {
    await youtubeDB.initialize();
    console.log('✅ Database initialized');
    
    const stats = await youtubeDB.getStats();
    console.log(`📊 Current stats: ${stats.totalPosts} posts, ${stats.totalSessions} sessions`);
    
    const testPost = {
      id: `quick_test_${Date.now()}`,
      channel: 'Quick Test',
      author: 'Test',
      content: 'Quick test post',
      publishedTime: 'hace 1 minuto',
      likes: '0',
      images: [],
      extractedAt: new Date().toISOString(),
      sourceUrl: 'https://test.com'
    };
    
    const sessionId = await youtubeDB.createSession('quick-test', new Date(), 1);
    await youtubeDB.savePosts([testPost], sessionId);
    
    const newStats = await youtubeDB.getStats();
    console.log(`📊 After test: ${newStats.totalPosts} posts, ${newStats.totalSessions} sessions`);
    
    console.log('✅ Quick test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    return false;
  }
}

async function runBasicTests() {
  console.log('🧪 Running basic IndexedDB tests...');
  console.log('=' .repeat(40));
  
  let passedTests = 0;
  let totalTests = 0;
  
  try {
    // Test 1: Database initialization
    console.log('\n📋 Test 1: Database Initialization');
    totalTests++;
    await youtubeDB.initialize();
    console.log('✅ Test 1 passed: Database initialized successfully');
    passedTests++;
    
    // Test 2: Get stats
    console.log('\n📋 Test 2: Get Database Statistics');
    totalTests++;
    const stats = await youtubeDB.getStats();
    console.log(`📊 Database Stats: ${stats.totalPosts} posts, ${stats.totalSessions} sessions`);
    console.log('✅ Test 2 passed: Statistics retrieved successfully');
    passedTests++;
    
    // Test 3: Create session
    console.log('\n📋 Test 3: Session Creation');
    totalTests++;
    const sessionId = await youtubeDB.createSession('test', new Date(), 60);
    if (sessionId && sessionId.startsWith('session_')) {
      console.log(`✅ Test 3 passed: Session created with ID: ${sessionId}`);
      passedTests++;
    } else {
      console.log('❌ Test 3 failed: Session creation failed');
    }
    
    // Test 4: Save test post
    console.log('\n📋 Test 4: Save Test Post');
    totalTests++;
    const testPost = {
      id: `test_post_${Date.now()}`,
      channel: 'Test Channel',
      author: 'Test Author',
      content: 'Test post content for verification',
      publishedTime: 'hace 1 hora',
      likes: '5',
      images: [],
      extractedAt: new Date().toISOString(),
      sourceUrl: 'https://test.com'
    };
    
    await youtubeDB.savePosts([testPost], sessionId);
    const newStats = await youtubeDB.getStats();
    console.log(`✅ Test 4 passed: Post saved, total posts: ${newStats.totalPosts}`);
    passedTests++;
    
    // Test 5: Check post exists
    console.log('\n📋 Test 5: Post Processing Check');
    totalTests++;
    const isProcessed = await youtubeDB.isPostProcessed(testPost.id);
    if (isProcessed) {
      console.log('✅ Test 5 passed: Post correctly marked as processed');
      passedTests++;
    } else {
      console.log('❌ Test 5 failed: Post not found in database');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed with error:', error);
  }
  
  // Final results
  console.log('\n' + '=' .repeat(40));
  console.log(`🏆 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! IndexedDB implementation is working correctly.');
  } else {
    console.log(`⚠️ ${totalTests - passedTests} tests failed. Please review the implementation.`);
  }
  
  return { passed: passedTests, total: totalTests, success: passedTests === totalTests };
}

// Testing function for cache summary and UI
async function testCacheSummary() {
  console.log('🧪 Testing Cache Summary & UI...');
  
  try {
    // First ensure we have some test data
    await youtubeDB.initialize();
    
    // Create test data if none exists
    const stats = await youtubeDB.getStats();
    if (stats.totalPosts === 0) {
      console.log('📝 Creating test data...');
      
      const testPosts = [
        {
          id: 'test_cache_1',
          channel: 'César Langreo',
          author: 'César Langreo',
          content: 'Test post for cache summary verification',
          publishedTime: 'hace 1 hora',
          likes: '5',
          images: [],
          extractedAt: new Date().toISOString(),
          sourceUrl: 'https://test.com'
        },
        {
          id: 'test_cache_2',
          channel: 'César Langreo', 
          author: 'César Langreo',
          content: 'Another test post for UI testing',
          publishedTime: 'hace 2 horas',
          likes: '8',
          images: [],
          extractedAt: new Date().toISOString(),
          sourceUrl: 'https://test.com'
        }
      ];
      
      const sessionId = await youtubeDB.createSession('ui-test', new Date(), 60);
      await youtubeDB.savePosts(testPosts, sessionId);
      console.log('✅ Test data created');
    }
    
    // Test the getDBStats function
    console.log('🔍 Testing getDBStats() function...');
    const dbStats = await getDBStats();
    
    console.log('📊 getDBStats() result:');
    console.log(`  ✓ success: ${dbStats.success}`);
    console.log(`  ✓ cacheSize: ${dbStats.cacheSize}`);
    console.log(`  ✓ maxSize: ${dbStats.maxSize}`);
    console.log(`  ✓ allIds: ${dbStats.allIds?.length} items`);
    console.log(`  ✓ sampleIds: ${dbStats.sampleIds?.length} items`);
    console.log(`  ✓ totalSessions: ${dbStats.totalSessions}`);
    console.log(`  ✓ databaseSize: ${dbStats.databaseSize}`);
    
         if (dbStats.success && dbStats.cacheSize !== undefined && dbStats.allIds) {
       console.log('✅ Cache Summary Test PASSED');
       console.log('💡 Now test in popup:');
       console.log('  1. Click extension icon');
       console.log('  2. Click "📊 Show Info" - should show real numbers');
       console.log('  3. Click "📋 Recent Posts" - should expand (CSP-compliant)');
       console.log('  4. Click "🗂️ All Cached Posts" - should expand');
       return true;
     } else {
       console.log('❌ Cache Summary Test FAILED');
       return false;
     }
    
  } catch (error) {
    console.error('❌ Cache Summary Test ERROR:', error);
    return false;
  }
}

// Expose testing functions globally
globalThis.quickTest = quickTest;
globalThis.runBasicTests = runBasicTests;
globalThis.testCacheSummary = testCacheSummary;

// Expose for debugging in service worker console
globalThis.youtubeDB = youtubeDB;

// Timezone utilities for Colombia (UTC-5)
function getNowInColombia() {
  const now = new Date();
  // Colombia está en UTC-5 (no cambia por horario de verano)
  const colombiaOffset = -5 * 60; // -5 horas en minutos
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (colombiaOffset * 60000));
}

function toColombiaTime(date) {
  const colombiaOffset = -5 * 60; // -5 horas en minutos
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (colombiaOffset * 60000));
}

(() => {
  'use strict';

  // Configuration keys
  const STORAGE_KEYS = {
    WEBHOOK_URL: 'n8n_webhook_url',
    ENABLED: 'extension_enabled',
    LAST_SUCCESS: 'last_success_timestamp',
    AUTO_SCRAPING: 'auto_scraping_enabled',
    SCRAPING_INTERVAL: 'scraping_interval_minutes',
    LAST_SCRAPING: 'last_scraping_time'
  };

  // Default configuration
  const DEFAULT_CONFIG = {
    [STORAGE_KEYS.ENABLED]: true,
    [STORAGE_KEYS.WEBHOOK_URL]: '',
    [STORAGE_KEYS.LAST_SUCCESS]: null,
    [STORAGE_KEYS.AUTO_SCRAPING]: false,
    [STORAGE_KEYS.SCRAPING_INTERVAL]: 60,
    [STORAGE_KEYS.LAST_SCRAPING]: null
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
      await youtubeDB.initialize();
    }
  });

  // Initialize on startup
  chrome.runtime.onStartup.addListener(async () => {
    await youtubeDB.initialize();
    console.log('🔄 Extension startup - IndexedDB initialized');
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
    } else if (message.action === 'clear_cache') {
      clearProcessedPostsCache().then(sendResponse);
      return true; // Indicates async response
    } else if (message.action === 'get_cache_info') {
      getCacheInfo().then(sendResponse);
      return true; // Indicates async response
    } else if (message.action === 'get_db_stats') {
      getDBStats().then(sendResponse);
      return true; // Indicates async response
    } else if (message.action === 'cleanup_database') {
      cleanupDatabase(message.daysToKeep).then(sendResponse);
      return true; // Indicates async response
    } else if (message.action === 'save_activation_date') {
      saveActivationDate().then(sendResponse);
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
      // Get all storage keys, not just DEFAULT_CONFIG keys
      const allKeys = Object.values(STORAGE_KEYS);
      const stored = await chrome.storage.local.get(allKeys);
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
      // Ensure database is initialized
      await youtubeDB.initialize();
      
      console.group('🔍 Scraping César Langreo Posts');
      console.log('🌐 Target URL: https://www.youtube.com/c/CésarLangreo/posts');
      
      // Get configuration and activation date
      const config = await chrome.storage.local.get([
        'scraping_interval_minutes', 
        'auto_scraping_activation_date'
      ]);
      const isOneMinuteMode = config.scraping_interval_minutes === 1;
      // Read activation date (already saved in Colombia timezone)
      const activationDate = config.auto_scraping_activation_date ? 
        new Date(config.auto_scraping_activation_date) : new Date(0);
      
      console.log(`📅 Activation date filter (Colombia timezone): ${activationDate.toISOString()}`);
      
      // Create scraping session
      const sessionId = await youtubeDB.createSession(
        'auto', 
        activationDate, 
        config.scraping_interval_minutes || 60
      );
      
      const startTime = Date.now();
      
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

      console.log('🔍 Results:', results);
      
      // Close tab only if NOT in 1-minute mode
      if (!isOneMinuteMode) {
        await chrome.tabs.remove(tab.id);
        console.log('🗑️ Tab closed');
      } else {
        console.log('📌 Tab kept open for reuse');
      }
      
      const extractedData = results[0]?.result;

      console.log('🔍 Extracted data:', extractedData);
      
      if (extractedData && extractedData.posts.length > 0) {
        console.log(`✅ Extracted ${extractedData.posts.length} posts`);
        console.log('📊 Extracted data:', extractedData);
        
        // Update session with found posts count
        await youtubeDB.updateSession(sessionId, {
          postsFound: extractedData.posts.length
        });
        
        // Filter new posts using IndexedDB
        const newPosts = await youtubeDB.filterNewPosts(extractedData.posts, activationDate);
        
        await youtubeDB.updateSession(sessionId, {
          postsNew: newPosts.length
        });
        
        if (newPosts.length > 0) {
          console.log(`🆕 Found ${newPosts.length} new posts, sending to n8n...`);
          
          // Save to IndexedDB first
          await youtubeDB.savePosts(newPosts, sessionId);
          
          // Send to n8n (only new posts)
          const success = await sendScrapedDataToN8n({
            ...extractedData,
            posts: newPosts
          });
          
          if (success) {
            // Mark posts as sent to n8n
            const postIds = newPosts.map(p => p.id);
            await youtubeDB.markPostsSentToN8n(postIds);
            
            await updateLastScrapingTime();
            console.log('🎉 Scraping completed successfully');
            
            // Mark session as completed
            await youtubeDB.updateSession(sessionId, {
              status: 'completed',
              duration: Date.now() - startTime
            });
          } else {
            await youtubeDB.updateSession(sessionId, {
              status: 'error',
              error: 'Failed to send to n8n',
              duration: Date.now() - startTime
            });
          }
        } else {
          console.log('⏭️ No new posts found');
          await youtubeDB.updateSession(sessionId, {
            status: 'completed',
            duration: Date.now() - startTime
          });
        }
        
        console.groupEnd();
        return { success: true, postsCount: extractedData.posts.length, newPosts: newPosts.length };
      } else {
        console.warn('⚠️ No posts extracted or extraction failed');
        await youtubeDB.updateSession(sessionId, {
          status: 'error',
          error: 'No posts extracted',
          duration: Date.now() - startTime
        });
        console.groupEnd();
        return { success: false, error: 'No posts found or extraction failed' };
      }
      
    } catch (error) {
      console.error('❌ Error scraping César Langreo posts:', error);
      
      // Try to update session with error (if sessionId exists)
      try {
        if (typeof sessionId !== 'undefined') {
          await youtubeDB.updateSession(sessionId, {
            status: 'error',
            error: error.message,
            duration: typeof startTime !== 'undefined' ? Date.now() - startTime : 0
          });
        }
      } catch (sessionError) {
        console.error('Error updating session:', sessionError);
      }
      
      console.groupEnd();
      return { success: false, error: error.message };
    }
  }

  // Function to extract posts data (injected into the page)
  function extractPostsData() {
    const posts = [];
    
    // Simple hash function for consistent IDs
    function simpleHash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(36);
    }
    
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
            // Create deterministic ID based on stable content (not timestamp)
            console.log('🔍 Content:', content);
            const postId = `cesar_langreo_${simpleHash(content)}`;
            console.log('🔍 Post ID:', postId);

            
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
        [STORAGE_KEYS.AUTO_SCRAPING]: enabled,
        [STORAGE_KEYS.SCRAPING_INTERVAL]: intervalMinutes || 60
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
      const config = await chrome.storage.local.get([STORAGE_KEYS.AUTO_SCRAPING, STORAGE_KEYS.SCRAPING_INTERVAL]);
      if (config[STORAGE_KEYS.AUTO_SCRAPING]) {
        const interval = config[STORAGE_KEYS.SCRAPING_INTERVAL] || 60;
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

  // ==================== LEGACY FUNCTIONS (DEPRECATED) ====================
  // These functions are kept for backward compatibility but are no longer used
  // The extension now uses IndexedDB through youtubeDB instead

  // DEPRECATED: Filter new posts (avoid duplicates) - now handled by youtubeDB.filterNewPosts()
  async function filterNewPosts(posts) {
    console.warn('⚠️ filterNewPosts() is deprecated, use youtubeDB.filterNewPosts() instead');
    
    try {
      const stored = await chrome.storage.local.get(['processed_posts']);
      const processedPosts = stored.processed_posts || [];
      
      console.log(`🗂️ Cached posts: ${processedPosts.length} IDs`);
      console.log(`📋 Current posts: ${posts.length} found`);
      
      const newPosts = posts.filter(post => !processedPosts.includes(post.id));
      
      console.log(`🆕 New posts after filtering: ${newPosts.length}`);
      if (newPosts.length > 0) {
        console.log('🆔 New post IDs:', newPosts.map(p => p.id));
      }
      if (processedPosts.length > 0) {
        console.log('💾 Sample cached IDs:', processedPosts.slice(-3));
      }
      
      return newPosts;
    } catch (error) {
      console.error('Error filtering new posts:', error);
      return posts; // Return all posts if error
    }
  }

  // DEPRECATED: Save processed post IDs - now handled by youtubeDB.savePosts()
  async function saveProcessedPosts(posts) {
    console.warn('⚠️ saveProcessedPosts() is deprecated, use youtubeDB.savePosts() instead');
    
    try {
      const stored = await chrome.storage.local.get(['processed_posts']);
      const processedPosts = stored.processed_posts || [];
      
      const newIds = posts.map(post => post.id);
      const updatedProcessed = [...new Set([...processedPosts, ...newIds])];
      
      // Keep only last 100 IDs to prevent storage bloat
      const trimmedProcessed = updatedProcessed.slice(-100);
      
      console.log(`💾 Saving processed posts:`);
      console.log(`   📝 Adding ${newIds.length} new IDs`);
      console.log(`   📊 Total unique: ${updatedProcessed.length} → ${trimmedProcessed.length} (after trim)`);
      console.log(`   🆔 New IDs being saved:`, newIds);
      
      await chrome.storage.local.set({ processed_posts: trimmedProcessed });
      
      // Verify save worked
      const verification = await chrome.storage.local.get(['processed_posts']);
      console.log(`✅ Save verified: ${verification.processed_posts?.length || 0} IDs in storage`);
      
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

  // Get IndexedDB statistics
  async function getDBStats() {
    try {
      await youtubeDB.initialize();
      const stats = await youtubeDB.getStats();
      
      // Extract post IDs for popup compatibility
      const allIds = stats.recentPosts.map(post => post.id);
      const sampleIds = allIds.slice(0, 5); // Last 5 posts
      
      // Get all posts if we need complete list
      let allPostIds = allIds;
      if (stats.totalPosts > 10) {
        // Get all posts for complete list
        const allPosts = await youtubeDB.db.getAll('posts');
        allPostIds = allPosts.map(post => post.id);
      }
      
      return { 
        success: true, 
        // Legacy format for popup compatibility
        cacheSize: stats.totalPosts,
        maxSize: 'unlimited',
        allIds: allPostIds,
        sampleIds: sampleIds,
        // Additional IndexedDB stats
        totalSessions: stats.totalSessions,
        lastCleanup: stats.lastCleanup,
        databaseSize: stats.databaseSize,
        // Raw stats for advanced debugging
        rawStats: stats
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return { success: false, error: error.message };
    }
  }

  // Cleanup old database entries
  async function cleanupDatabase(daysToKeep = 30) {
    try {
      await youtubeDB.initialize();
      const deletedCount = await youtubeDB.cleanupOldData(daysToKeep);
      console.log(`🧹 Database cleanup completed: ${deletedCount} old posts removed`);
      return { success: true, deletedCount };
    } catch (error) {
      console.error('Error cleaning up database:', error);
      return { success: false, error: error.message };
    }
  }

  // Save activation date for filtering old posts (Colombia timezone)
  async function saveActivationDate() {
    try {
      const activationDate = getNowInColombia().toISOString();
      await chrome.storage.local.set({ 
        auto_scraping_activation_date: activationDate 
      });
      console.log(`📅 Activation date saved (Colombia timezone): ${activationDate}`);
      return { success: true, activationDate };
    } catch (error) {
      console.error('Error saving activation date:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear processed posts cache
  async function clearProcessedPostsCache() {
    try {
      const before = await chrome.storage.local.get(['processed_posts']);
      await chrome.storage.local.remove(['processed_posts']);
      
      console.log(`🗑️ Cache cleared: removed ${before.processed_posts?.length || 0} cached post IDs`);
      
      return { 
        success: true, 
        message: `Cache cleared: ${before.processed_posts?.length || 0} entries removed` 
      };
    } catch (error) {
      console.error('Error clearing cache:', error);
      return { success: false, error: error.message };
    }
  }

  // Get cache information
  async function getCacheInfo() {
    try {
      const stored = await chrome.storage.local.get(['processed_posts']);
      const processedPosts = stored.processed_posts || [];
      
      return {
        success: true,
        cacheSize: processedPosts.length,
        maxSize: 100,
        allIds: processedPosts, // All cached IDs
        sampleIds: processedPosts.slice(-5), // Last 5 IDs for quick view
        oldestId: processedPosts[0] || null,
        newestId: processedPosts[processedPosts.length - 1] || null
      };
    } catch (error) {
      console.error('Error getting cache info:', error);
      return { success: false, error: error.message };
    }
  }

  console.log('🚀 YouTube to n8n Background Service Worker: Initialized');
  console.log('💡 Check this console for webhook requests and n8n communication');
  console.log('🔧 Open extension popup to configure webhook URL');
  console.log('📊 César Langreo scraping system ready');
  console.log('');
  console.log('🧪 Testing functions available:');
  console.log('  • youtubeDB.initialize() - Initialize database');
  console.log('  • quickTest() - Run quick functionality test');
  console.log('  • runBasicTests() - Run 5 basic tests');
  console.log('  • testCacheSummary() - Test cache summary & UI fix');
  console.log('  • youtubeDB.getStats() - Show database statistics');
})();