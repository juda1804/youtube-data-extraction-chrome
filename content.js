// YouTube Notification Monitor - Content Script
(() => {
  'use strict';

  // Track processed notifications to avoid duplicates
  const processedNotifications = new Set();

  // Access utilities from global scope with fallback
  const utils = window.YouTubeExtensionUtils || {
    // Fallback implementations if utils.js fails to load
    safeTextContent: (element, fallback = '') => element ? element.textContent.trim() : fallback,
    safeAttribute: (element, attribute, fallback = '') => element ? (element.getAttribute(attribute) || fallback) : fallback,
    createPostId: (author, content, time = '') => {
      const contentForHash = content || `${author}_${time}_${Date.now()}`;
      const hash = contentForHash.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
      return `community_post_${author}_${Math.abs(hash).toString(36)}`;
    },
    createNotificationId: (author, content, time = '') => {
      const contentForHash = content || `${author}_${time}_${Date.now()}`;
      const hash = contentForHash.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
      return `notification_${author}_${Math.abs(hash).toString(36)}`;
    },
    logStructured: (type, message, data = {}) => {
      console.group(`${type === 'notification' ? '🔔' : '📝'} ${message}`);
      console.log('📊 Data:', data);
      console.groupEnd();
    }
  };

  // Monitor for notification elements
  function monitorNotifications() {
    // DEPRECATED: YouTube notification bell monitoring
    // Notification bell detection is now deprecated as it's redundant with panel monitoring
    
    // Monitor for notification popups/panels - this covers all notification scenarios
    observeNotificationPanel();

    // Community posts are handled by the background scraper only
    // Content script only monitors notification panel for real notifications
  }

  // DEPRECATED: Monitor notification bell for changes
  // This function is deprecated - notification panel monitoring is sufficient
  function observeNotificationBell(bellElement) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          checkForNotificationBadge(bellElement);
        }
      });
    });

    observer.observe(bellElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-label']
    });
  }

  // DEPRECATED: Check for notification badge/count
  // This function is deprecated along with bell monitoring
  function checkForNotificationBadge(bellElement) {
    const badge = bellElement.querySelector('.yt-spec-icon-badge-shape__badge');
    if (badge && badge.textContent) {
      console.log('🔔 Notification badge detected:', badge.textContent);
      // Trigger notification panel check
      setTimeout(() => {
        checkNotificationPanel();
      }, 1000);
    }
  }

  // Monitor notification panel when it appears
  function observeNotificationPanel() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check for notification panel
            const notificationPanel = node.querySelector('#notification-item-list, [role="dialog"]');
            if (notificationPanel || node.id === 'notification-item-list') {
              setTimeout(() => {
                extractNotificationsFromPanel(notificationPanel || node);
              }, 500);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Check for notification panel that might already be open
  function checkNotificationPanel() {
    const notificationPanel = document.querySelector('#notification-item-list, #notification-popup');
    if (notificationPanel) {
      extractNotificationsFromPanel(notificationPanel);
    }
  }

  // Extract notifications from the panel
  function extractNotificationsFromPanel(panel) {
    if (!panel) return;

    const notifications = panel.querySelectorAll('#notification-item, .ytd-notification-renderer');
    console.log(`🔍 Found ${notifications.length} notification elements in panel`);
    
    notifications.forEach((notification, index) => {
      console.log(`📋 Processing notification ${index + 1}/${notifications.length}`);
      const notificationData = extractNotificationData(notification);
      if (notificationData && !processedNotifications.has(notificationData.id)) {
        processedNotifications.add(notificationData.id);
        console.log('✅ New notification found, sending to background...');
        sendNotificationToBackground(notificationData);
      } else if (notificationData) {
        console.log('⏭️ Notification already processed, skipping:', notificationData.id);
      } else {
        console.log('❌ Failed to extract data from notification element');
      }
    });
  }

  // REMOVED: observeCommunityPosts function
  // Community posts are now handled exclusively by the background scraper
  // to prevent duplicate processing and maintain clear separation of concerns

  // Extract data from notification element
  function extractNotificationData(notification) {
    try {
      if (!notification) return null;
      
      const titleElement = notification.querySelector('#notification-title, .ytd-notification-renderer #text');
      const timeElement = notification.querySelector('#notification-time, .ytd-notification-renderer #published-time-text');
      const thumbnailElement = notification.querySelector('#notification-thumbnail img, .ytd-notification-renderer img');
      const linkElement = notification.querySelector('a[href]');
      const authorElement = notification.querySelector('#channel-name, .ytd-notification-renderer #byline a, .ytd-notification-renderer #byline');

      // Safe extraction with fallbacks
      const title = utils && utils.safeTextContent ? 
        utils.safeTextContent(titleElement) : 
        (titleElement ? titleElement.textContent.trim() : '');
      const time = utils && utils.safeTextContent ? 
        utils.safeTextContent(timeElement) : 
        (timeElement ? timeElement.textContent.trim() : '');
      const thumbnail = utils && utils.safeAttribute ? 
        utils.safeAttribute(thumbnailElement, 'src') : 
        (thumbnailElement ? thumbnailElement.src : '');
      const link = utils && utils.safeAttribute ? 
        utils.safeAttribute(linkElement, 'href') : 
        (linkElement ? linkElement.href : '');
      const author = utils && utils.safeTextContent ? 
        utils.safeTextContent(authorElement, 'YouTube') : 
        (authorElement ? authorElement.textContent.trim() : 'YouTube');

      // Create unique ID using utilities or fallback
      const id = utils && utils.createNotificationId ? 
        utils.createNotificationId(author, title, time) : 
        `notification_${author}_${Date.now()}`;

      return {
        id,
        type: 'notification',
        title,
        author,
        time,
        thumbnail,
        link,
        timestamp: new Date().toISOString(),
        url: window.location.href
      };
    } catch (error) {
      console.error('Error extracting notification data:', error);
      return null;
    }
  }

  // DEPRECATED: Extract data from community post
  // This function is no longer used - community posts are handled by background scraper
  function extractCommunityPostData(post) {
    try {
      if (!post) return null;
      
      const authorElement = post.querySelector('#author-text, .ytd-backstage-post-renderer #author-text');
      const contentElement = post.querySelector('#content-text, .ytd-backstage-post-renderer #content-text');
      const timeElement = post.querySelector('#published-time-text, .ytd-backstage-post-renderer #published-time-text');
      const linkElement = post.querySelector('a[href]');

      // Safe extraction with fallbacks
      const author = utils && utils.safeTextContent ? 
        utils.safeTextContent(authorElement) : 
        (authorElement ? authorElement.textContent.trim() : '');
      const content = utils && utils.safeTextContent ? 
        utils.safeTextContent(contentElement) : 
        (contentElement ? contentElement.textContent.trim() : '');
      const time = utils && utils.safeTextContent ? 
        utils.safeTextContent(timeElement) : 
        (timeElement ? timeElement.textContent.trim() : '');
      const link = utils && utils.safeAttribute ? 
        utils.safeAttribute(linkElement, 'href') : 
        (linkElement ? linkElement.href : '');

      // Create unique ID using utilities or fallback
      const id = utils && utils.createPostId ? 
        utils.createPostId(author, content, time) : 
        `community_post_${author}_${Date.now()}`;

      return {
        id,
        type: 'community_post',
        author,
        content,
        time,
        link,
        timestamp: new Date().toISOString(),
        url: window.location.href
      };
    } catch (error) {
      console.error('Error extracting community post data:', error);
      return null;
    }
  }

  // Send notification data to background script
  function sendNotificationToBackground(data) {
    try {
      // Log the extracted data using structured logging
      if (utils && utils.logStructured) {
        utils.logStructured(data.type, 'YouTube Notification Detected', {
          id: data.id,
          title: data.title,
          time: data.time,
          link: data.link,
          url: data.url,
          thumbnail: data.thumbnail,
          author: data.author,
          content: data.content
        });
      } else {
        console.log('📊 YouTube Notification Detected:', data);
      }
      
      // Check if chrome.runtime is available and context is valid
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage && chrome.runtime.id) {
        chrome.runtime.sendMessage({
          action: 'notification_detected',
          data: data
        }).catch((error) => {
          if (error.message.includes('Extension context invalidated')) {
            console.warn('⚠️ Extension context invalidated. Extension was reloaded/updated.');
            return;
          }
          console.error('❌ Error sending notification to background:', error);
        });
      } else {
        console.warn('❌ Chrome extension API not available or context invalidated.');
        console.log('📋 Data that would be sent:', data);
      }
    } catch (error) {
      console.error('❌ Error in sendNotificationToBackground:', error);
    }
  }

  // Initialize monitoring when DOM is ready (with delay for API availability)
  function initializeWithDelay() {
    // Wait a bit for Chrome APIs to be fully available
    setTimeout(() => {
      try {
        // Check if extension context is still valid
        const contextValid = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
        
        if (contextValid) {
          console.log('🚀 YouTube Notification Monitor: Content script loaded');
          console.log('🔍 Monitoring for notifications on:', window.location.href);
          console.log('💡 Open browser console to see extracted data in real-time');
          
          // Check if utilities loaded correctly
          if (window.YouTubeExtensionUtils) {
            console.log('✅ Utils loaded from utils-content.js');
          } else {
            console.warn('⚠️ Utils not loaded, using fallbacks');
          }
          
          monitorNotifications();
        } else {
          console.warn('⚠️ Extension context invalidated or Chrome API not ready');
          // Don't retry if context is invalidated
          if (typeof chrome !== 'undefined' && chrome.runtime === undefined) {
            console.log('🔄 Extension context lost, not retrying');
            return;
          }
          // Retry after another delay only if chrome is undefined
          setTimeout(initializeWithDelay, 1000);
        }
      } catch (error) {
        console.error('❌ Error in initializeWithDelay:', error);
      }
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWithDelay);
  } else {
    initializeWithDelay();
  }

  // Also monitor for URL changes (YouTube is a SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(monitorNotifications, 1000);
    }
  }).observe(document, { subtree: true, childList: true });

})();