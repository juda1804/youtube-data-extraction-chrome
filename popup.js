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
      
      const response = await chrome.runtime.sendMessage({ 
        action: 'toggle_auto_scraping',
        enabled: enabled,
        intervalMinutes: interval
      });

      if (response.success) {
        const intervalText = formatIntervalText(interval);
        showScrapingStatus(`Auto-scraping ${enabled ? `enabled (${intervalText})` : 'disabled'}`, 'success');
        
        // Save the settings
        await chrome.runtime.sendMessage({
          action: 'update_config',
          config: { 
            [STORAGE_KEYS.AUTO_SCRAPING]: enabled,
            [STORAGE_KEYS.SCRAPING_INTERVAL]: interval
          }
        });
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
      if (interval < 5 || interval > 1440) {
        showScrapingStatus('Invalid interval. Must be between 5 and 1440 minutes.', 'error');
        scrapingIntervalInput.value = Math.max(5, Math.min(1440, interval || 60));
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

  console.log('🚀 YouTube to n8n Popup: Initialized');
  console.log('💡 Extension Features:');
  console.log('   1. Real-time YouTube notification monitoring');
  console.log('   2. César Langreo posts scraping (manual + configurable auto-scraping)');
  console.log('   3. Webhook testing and configuration');
  console.log('   4. Configurable scraping intervals (5 min to 24 hours)');
  console.log('   5. Check extension background console for scraping activity');
  console.log('🎯 Configure webhook URL to enable n8n integration');
})();