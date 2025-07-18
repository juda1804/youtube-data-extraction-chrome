// YouTube Notification Monitor - Content Script
(() => {
  'use strict';

  // Track processed notifications to avoid duplicates
  const processedNotifications = new Set();

  // Monitor for notification elements
  function monitorNotifications() {
    // YouTube notification bell button
    const notificationBell = document.querySelector('#notification-icon-button');
    
    if (notificationBell) {
      // Monitor for notification count changes
      observeNotificationBell(notificationBell);
    }

    // Monitor for notification popups/panels
    observeNotificationPanel();

    // Monitor for community post notifications in the feed
    observeCommunityPosts();
  }

  // Monitor notification bell for changes
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

  // Check for notification badge/count
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

  // Monitor for community posts in the feed
  function observeCommunityPosts() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check for community posts
            const communityPosts = node.querySelectorAll('ytd-backstage-post-renderer');
            if (communityPosts.length > 0) {
              console.log(`📝 Found ${communityPosts.length} community posts`);
              communityPosts.forEach((post, index) => {
                console.log(`📋 Processing community post ${index + 1}/${communityPosts.length}`);
                const postData = extractCommunityPostData(post);
                if (postData && !processedNotifications.has(postData.id)) {
                  processedNotifications.add(postData.id);
                  console.log('✅ New community post found, sending to background...');
                  sendNotificationToBackground(postData);
                } else if (postData) {
                  console.log('⏭️ Community post already processed, skipping:', postData.id);
                }
              });
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

  // Extract data from notification element
  function extractNotificationData(notification) {
    try {
      const titleElement = notification.querySelector('#notification-title, .ytd-notification-renderer #text');
      const timeElement = notification.querySelector('#notification-time, .ytd-notification-renderer #published-time-text');
      const thumbnailElement = notification.querySelector('#notification-thumbnail img, .ytd-notification-renderer img');
      const linkElement = notification.querySelector('a[href]');

      const title = titleElement ? titleElement.textContent.trim() : '';
      const time = timeElement ? timeElement.textContent.trim() : '';
      const thumbnail = thumbnailElement ? thumbnailElement.src : '';
      const link = linkElement ? linkElement.href : '';

      // Create unique ID based on content
      const id = `notification_${title}_${time}`.replace(/[^a-zA-Z0-9]/g, '_');

      return {
        id,
        type: 'notification',
        title,
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

  // Extract data from community post
  function extractCommunityPostData(post) {
    try {
      const authorElement = post.querySelector('#author-text, .ytd-backstage-post-renderer #author-text');
      const contentElement = post.querySelector('#content-text, .ytd-backstage-post-renderer #content-text');
      const timeElement = post.querySelector('#published-time-text, .ytd-backstage-post-renderer #published-time-text');
      const linkElement = post.querySelector('a[href]');

      const author = authorElement ? authorElement.textContent.trim() : '';
      const content = contentElement ? contentElement.textContent.trim() : '';
      const time = timeElement ? timeElement.textContent.trim() : '';
      const link = linkElement ? linkElement.href : '';

      // Create unique ID based on content
      const id = `community_post_${author}_${time}`.replace(/[^a-zA-Z0-9]/g, '_');

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
    // Log the extracted data for debugging
    console.group('🔔 YouTube Notification Detected');
    console.log('📊 Extracted Data:', data);
    console.log('🆔 ID:', data.id);
    console.log('📝 Type:', data.type);
    console.log('📰 Title:', data.title);
    console.log('⏰ Time:', data.time);
    console.log('🔗 Link:', data.link);
    console.log('🌐 Page URL:', data.url);
    if (data.thumbnail) console.log('🖼️ Thumbnail:', data.thumbnail);
    if (data.author) console.log('👤 Author:', data.author);
    if (data.content) console.log('📄 Content:', data.content);
    console.groupEnd();
    
    chrome.runtime.sendMessage({
      action: 'notification_detected',
      data: data
    }).catch((error) => {
      console.error('❌ Error sending notification to background:', error);
    });
  }

  // Initialize monitoring when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', monitorNotifications);
  } else {
    monitorNotifications();
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

  console.log('🚀 YouTube Notification Monitor: Content script loaded');
  console.log('🔍 Monitoring for notifications on:', window.location.href);
  console.log('💡 Open browser console to see extracted data in real-time');
})();