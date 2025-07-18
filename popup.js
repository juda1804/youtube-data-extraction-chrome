// Popup JavaScript for YouTube to n8n Extension
(() => {
  'use strict';

  // DOM elements
  const statusElement = document.getElementById('status');
  const statusText = document.getElementById('status-text');
  const webhookUrlInput = document.getElementById('webhook-url');
  const enabledCheckbox = document.getElementById('enabled');
  const saveButton = document.getElementById('save-btn');
  const testButton = document.getElementById('test-btn');
  const messageElement = document.getElementById('message');
  const lastSuccessElement = document.getElementById('last-success');
  const loadingElement = document.getElementById('loading');
  
  // Scraping elements
  const scrapeNowButton = document.getElementById('scrape-now-btn');
  const autoScrapingCheckbox = document.getElementById('auto-scraping');
  const scrapingIntervalInput = document.getElementById('scraping-interval');
  const intervalGroup = document.getElementById('interval-group');
  const lastScrapeElement = document.getElementById('last-scrape');
  const scrapingStatusElement = document.getElementById('scraping-status');
  
  // Cache management elements
  const cacheInfoButton = document.getElementById('cache-info-btn');
  const clearCacheButton = document.getElementById('clear-cache-btn');
  const cacheInfoElement = document.getElementById('cache-info');

  // Configuration keys (must match background.js)
  const STORAGE_KEYS = {
    WEBHOOK_URL: 'n8n_webhook_url',
    ENABLED: 'extension_enabled',
    LAST_SUCCESS: 'last_success_timestamp',
    AUTO_SCRAPING: 'auto_scraping_enabled',
    SCRAPING_INTERVAL: 'scraping_interval_minutes',
    LAST_SCRAPING: 'last_scraping_time'
  };

  // Initialize popup
  document.addEventListener('DOMContentLoaded', async () => {
    await loadConfiguration();
    setupEventListeners();
  });

  // Load current configuration
  async function loadConfiguration() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'get_config' });
      
      webhookUrlInput.value = response[STORAGE_KEYS.WEBHOOK_URL] || '';
      enabledCheckbox.checked = response[STORAGE_KEYS.ENABLED] || false;
      autoScrapingCheckbox.checked = response[STORAGE_KEYS.AUTO_SCRAPING] || false;
      scrapingIntervalInput.value = response[STORAGE_KEYS.SCRAPING_INTERVAL] || 60;
      
      updateStatus(response);
      updateLastSuccess(response[STORAGE_KEYS.LAST_SUCCESS]);
      updateLastScraping(response[STORAGE_KEYS.LAST_SCRAPING]);
      updateIntervalVisibility();
    } catch (error) {
      console.error('Error loading configuration:', error);
      showMessage('Error loading configuration', 'error');
    }
  }

  // Setup event listeners
  function setupEventListeners() {
    saveButton.addEventListener('click', handleSave);
    testButton.addEventListener('click', handleTest);
    scrapeNowButton.addEventListener('click', handleScrapeNow);
    autoScrapingCheckbox.addEventListener('change', handleAutoScrapingToggle);
    scrapingIntervalInput.addEventListener('change', handleIntervalChange);
    cacheInfoButton.addEventListener('click', handleCacheInfo);
    clearCacheButton.addEventListener('click', handleClearCache);
    
    // Enable/disable buttons based on webhook URL
    webhookUrlInput.addEventListener('input', () => {
      const hasUrl = webhookUrlInput.value.trim().length > 0;
      testButton.disabled = !hasUrl;
      scrapeNowButton.disabled = !hasUrl;
    });
    
    // Show/hide interval input based on auto-scraping checkbox
    autoScrapingCheckbox.addEventListener('change', updateIntervalVisibility);
    
    // Initial button state
    const hasUrl = webhookUrlInput.value.trim().length > 0;
    testButton.disabled = !hasUrl;
    scrapeNowButton.disabled = !hasUrl;
  }

  // Handle save button click
  async function handleSave() {
    try {
      setLoading(true);
      clearMessage();

      const webhookUrl = webhookUrlInput.value.trim();
      const enabled = enabledCheckbox.checked;

      // Validate webhook URL
      if (webhookUrl && !isValidUrl(webhookUrl)) {
        showMessage('Please enter a valid webhook URL', 'error');
        return;
      }

      const config = {
        [STORAGE_KEYS.WEBHOOK_URL]: webhookUrl,
        [STORAGE_KEYS.ENABLED]: enabled
      };

      const response = await chrome.runtime.sendMessage({
        action: 'update_config',
        config: config
      });

      if (response.success) {
        showMessage('Configuration saved successfully', 'success');
        updateStatus(config);
      } else {
        showMessage(`Error saving configuration: ${response.error}`, 'error');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      showMessage('Error saving configuration', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Handle test button click
  async function handleTest() {
    try {
      setLoading(true);
      clearMessage();

      const webhookUrl = webhookUrlInput.value.trim();
      
      // Validate webhook URL before testing
      if (!webhookUrl) {
        showMessage('Please enter a webhook URL first', 'error');
        return;
      }
      
      if (!isValidUrl(webhookUrl)) {
        showMessage('Please enter a valid webhook URL', 'error');
        return;
      }

      const response = await chrome.runtime.sendMessage({ 
        action: 'test_webhook',
        webhookUrl: webhookUrl
      });

      if (response.success) {
        showMessage('Test webhook sent successfully!', 'success');
        updateLastSuccess(new Date().toISOString());
      } else {
        showMessage(`Test failed: ${response.error}`, 'error');
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      showMessage('Error testing webhook', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Update status display
  function updateStatus(config) {
    const hasWebhook = config[STORAGE_KEYS.WEBHOOK_URL] && config[STORAGE_KEYS.WEBHOOK_URL].trim().length > 0;
    const isEnabled = config[STORAGE_KEYS.ENABLED];

    statusElement.className = 'status';
    
    if (isEnabled && hasWebhook) {
      statusElement.classList.add('enabled');
      statusText.textContent = 'Active - Monitoring YouTube notifications';
    } else if (isEnabled && !hasWebhook) {
      statusElement.classList.add('warning');
      statusText.textContent = 'Enabled but no webhook URL configured';
    } else {
      statusElement.classList.add('disabled');
      statusText.textContent = 'Disabled - Not monitoring notifications';
    }
  }

  // Update last success timestamp
  function updateLastSuccess(timestamp) {
    if (timestamp) {
      const date = new Date(timestamp);
      const formatted = date.toLocaleString();
      lastSuccessElement.textContent = `Last successful send: ${formatted}`;
    } else {
      lastSuccessElement.textContent = 'No successful sends yet';
    }
  }

  // Show message to user
  function showMessage(text, type) {
    messageElement.textContent = text;
    messageElement.className = type;
    messageElement.style.display = 'block';
    
    // Clear message after 5 seconds
    setTimeout(() => {
      clearMessage();
    }, 5000);
  }

  // Clear message
  function clearMessage() {
    messageElement.textContent = '';
    messageElement.className = '';
    messageElement.style.display = 'none';
  }

  // Set loading state
  function setLoading(loading) {
    loadingElement.style.display = loading ? 'block' : 'none';
    saveButton.disabled = loading;
    testButton.disabled = loading || !webhookUrlInput.value.trim();
  }

  // Validate URL
  function isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  // Handle scrape now button click
  async function handleScrapeNow() {
    try {
      setScrapingLoading(true);
      clearScrapingStatus();

      const response = await chrome.runtime.sendMessage({ action: 'scrape_cesar_langreo' });

      if (response.success) {
        showScrapingStatus(`Scraping completed! Found ${response.postsCount} posts (${response.newPosts} new)`, 'success');
        updateLastScraping(new Date().toISOString());
      } else {
        showScrapingStatus(`Scraping failed: ${response.error}`, 'error');
      }
    } catch (error) {
      console.error('Error scraping:', error);
      showScrapingStatus('Error during scraping', 'error');
    } finally {
      setScrapingLoading(false);
    }
  }

  // Handle auto-scraping toggle
  async function handleAutoScrapingToggle() {
    try {
      const enabled = autoScrapingCheckbox.checked;
      const interval = parseInt(scrapingIntervalInput.value) || 60;
      
      // Save activation date when enabling auto-scraping
      if (enabled) {
        const activationResponse = await chrome.runtime.sendMessage({ action: 'save_activation_date' });
        if (!activationResponse.success) {
          console.error('Failed to save activation date:', activationResponse.error);
        }
      }
      
      const response = await chrome.runtime.sendMessage({ 
        action: 'toggle_auto_scraping',
        enabled: enabled,
        intervalMinutes: interval
      });

      if (response.success) {
        const intervalText = formatIntervalText(interval);
        const message = enabled ? 
          `Auto-scraping enabled (${intervalText}) - Only new posts will be processed` :
          'Auto-scraping disabled';
        showScrapingStatus(message, 'success');
      } else {
        showScrapingStatus(`Error: ${response.error}`, 'error');
        // Revert checkbox if failed
        autoScrapingCheckbox.checked = !enabled;
      }
    } catch (error) {
      console.error('Error toggling auto-scraping:', error);
      showScrapingStatus('Error toggling auto-scraping', 'error');
      // Revert checkbox if failed
      autoScrapingCheckbox.checked = !autoScrapingCheckbox.checked;
    }
  }

  // Handle interval change
  async function handleIntervalChange() {
    try {
      const interval = parseInt(scrapingIntervalInput.value);
      
      // Validate interval
      if (interval < 1 || interval > 1440) {
        showScrapingStatus('Invalid interval. Must be between 1 and 1440 minutes.', 'error');
        scrapingIntervalInput.value = Math.max(1, Math.min(1440, interval || 60));
        return;
      }
      
      // Save the interval
      await chrome.runtime.sendMessage({
        action: 'update_config',
        config: { [STORAGE_KEYS.SCRAPING_INTERVAL]: interval }
      });
      
      // If auto-scraping is enabled, restart with new interval
      if (autoScrapingCheckbox.checked) {
        const response = await chrome.runtime.sendMessage({ 
          action: 'toggle_auto_scraping',
          enabled: true,
          intervalMinutes: interval
        });
        
        if (response.success) {
          const intervalText = formatIntervalText(interval);
          showScrapingStatus(`Interval updated to ${intervalText}`, 'success');
        }
      }
    } catch (error) {
      console.error('Error updating interval:', error);
      showScrapingStatus('Error updating interval', 'error');
    }
  }

  // Update interval visibility
  function updateIntervalVisibility() {
    const isEnabled = autoScrapingCheckbox.checked;
    intervalGroup.style.display = isEnabled ? 'block' : 'none';
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

  // Update last scraping timestamp
  function updateLastScraping(timestamp) {
    if (timestamp) {
      const date = new Date(timestamp);
      const formatted = date.toLocaleString();
      lastScrapeElement.textContent = `Last scraping: ${formatted}`;
    } else {
      lastScrapeElement.textContent = 'Last scraping: Never';
    }
  }

  // Show scraping status message
  function showScrapingStatus(text, type) {
    scrapingStatusElement.textContent = text;
    scrapingStatusElement.className = type;
    scrapingStatusElement.style.display = 'block';
    
    // Clear message after 5 seconds
    setTimeout(() => {
      clearScrapingStatus();
    }, 5000);
  }

  // Clear scraping status
  function clearScrapingStatus() {
    scrapingStatusElement.textContent = '';
    scrapingStatusElement.className = '';
    scrapingStatusElement.style.display = 'none';
  }

  // Set scraping loading state
  function setScrapingLoading(loading) {
    if (loading) {
      scrapeNowButton.textContent = '⏳ Scraping...';
      scrapeNowButton.disabled = true;
    } else {
      scrapeNowButton.textContent = '📊 Scrape Now';
      const hasUrl = webhookUrlInput.value.trim().length > 0;
      scrapeNowButton.disabled = !hasUrl;
    }
  }

  // Handle cache info button click
  async function handleCacheInfo() {
    try {
      // Toggle visibility if already shown
      if (cacheInfoElement.style.display === 'block') {
        cacheInfoElement.style.display = 'none';
        cacheInfoButton.textContent = '📊 Show Info';
        return;
      }
      
      cacheInfoButton.textContent = '📊 Hide Info';
      
      const response = await chrome.runtime.sendMessage({ action: 'get_db_stats' });
      
      if (response.success) {
        const processedIds = response.allIds || [];
        const recentIds = response.sampleIds || [];
        
        // Create collapsible sections
        const info = `
          <div style="margin-bottom: 8px;">
            <strong>📊 Cache Summary:</strong><br>
            <span style="color: #0066cc;">Stored: ${response.cacheSize}/${response.maxSize} posts</span><br>
            <span style="color: #666; font-size: 10px;">Sessions: ${response.totalSessions || 0} | Database: ${response.databaseSize}</span><br>
            <span style="color: #888; font-size: 9px;">Cache persists between sessions</span>
          </div>
          
          <div style="border-top: 1px solid #ddd; padding-top: 8px; margin-bottom: 8px;">
            <div class="toggle-section" data-section="recent-ids" style="cursor: pointer; user-select: none; font-weight: bold; color: #333;">
              📋 Recent Posts (${recentIds.length}) 
              <span id="recent-toggle" style="float: right;">▶</span>
            </div>
            <div id="recent-ids" style="display: none; margin-top: 5px; max-height: 80px; overflow-y: auto; background: #fff; border: 1px solid #eee; padding: 5px; border-radius: 3px;">
              ${recentIds.length > 0 ? 
                recentIds.map((id, idx) => `
                  <div style="font-family: monospace; font-size: 9px; color: #666; padding: 1px 0; border-bottom: 1px solid #f0f0f0;">
                    <span style="color: #999;">${recentIds.length - idx}.</span> 
                    <span style="color: #0066cc;">${id}</span>
                  </div>
                `).join('') : 
                '<span style="color: #999; font-size: 10px;">No cached posts yet</span>'
              }
            </div>
          </div>
          
          ${response.cacheSize > 5 ? `
            <div style="border-top: 1px solid #ddd; padding-top: 8px;">
              <div class="toggle-section" data-section="all-ids" style="cursor: pointer; user-select: none; font-weight: bold; color: #333;">
                🗂️ All Cached Posts (${response.cacheSize}) 
                <span id="all-toggle" style="float: right;">▶</span>
              </div>
              <div id="all-ids" style="display: none; margin-top: 5px; max-height: 120px; overflow-y: auto; background: #fff; border: 1px solid #eee; padding: 5px; border-radius: 3px;">
                ${processedIds.map((id, idx) => `
                  <div style="font-family: monospace; font-size: 9px; color: #666; padding: 1px 0; border-bottom: 1px solid #f0f0f0;">
                    <span style="color: #999;">${idx + 1}.</span> 
                    <span style="color: #0066cc;">${id}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 10px; color: #999;">
            💡 Click sections to expand/collapse<br>
            🔄 Auto-closes in 30 seconds
          </div>
        `;
        
        cacheInfoElement.innerHTML = info;
        cacheInfoElement.style.display = 'block';
        
        // Add event listeners for collapsible sections (CSP-compliant)
        const toggleElements = cacheInfoElement.querySelectorAll('.toggle-section');
        toggleElements.forEach(element => {
          element.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            toggleSection(sectionId);
          });
        });
        
        // Auto-hide after 30 seconds (longer time for reading)
        setTimeout(() => {
          if (cacheInfoElement.style.display === 'block') {
            cacheInfoElement.style.display = 'none';
            cacheInfoButton.textContent = '📊 Show Info';
          }
        }, 30000);
      } else {
        showScrapingStatus(`Cache info error: ${response.error}`, 'error');
      }
    } catch (error) {
      console.error('Error getting cache info:', error);
      showScrapingStatus('Error getting cache info', 'error');
    }
  }

  // Toggle collapsible sections (CSP-compliant)
  function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const toggle = document.getElementById(sectionId.replace('-ids', '-toggle'));
    
    if (section && toggle) {
      if (section.style.display === 'none') {
        section.style.display = 'block';
        toggle.textContent = '▼';
      } else {
        section.style.display = 'none';
        toggle.textContent = '▶';
      }
    }
  }

  // Handle clear cache button click
  async function handleClearCache() {
    try {
      // Confirm action
      if (!confirm('⚠️ Clear cache?\n\nThis will mark all posts as "new" on next scraping.\nDuplicates may be sent to n8n.')) {
        return;
      }
      
      const response = await chrome.runtime.sendMessage({ action: 'clear_cache' });
      
      if (response.success) {
        showScrapingStatus(response.message, 'success');
        cacheInfoElement.style.display = 'none';
        
        // Update cache info if it was visible
        setTimeout(() => {
          handleCacheInfo();
        }, 1000);
      } else {
        showScrapingStatus(`Clear cache error: ${response.error}`, 'error');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      showScrapingStatus('Error clearing cache', 'error');
    }
  }

  console.log('🚀 YouTube to n8n Popup: Initialized');
  console.log('💡 Extension Features:');
  console.log('   1. Real-time YouTube notification monitoring');
  console.log('   2. César Langreo posts scraping (manual + configurable auto-scraping)');
  console.log('   3. Webhook testing and configuration');
  console.log('   4. Configurable scraping intervals (1 min to 24 hours)');
  console.log('   5. Check extension background console for scraping activity');
  console.log('🎯 Configure webhook URL to enable n8n integration');
})();