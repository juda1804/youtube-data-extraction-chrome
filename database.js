// YouTube Extension Database Manager
// Uses IndexedDB for persistent, unlimited storage

import { openDB } from './lib/idb.js';

// Database configuration constants
const DB_CONFIG = {
  NAME: 'youtube_extension_db',
  VERSION: 1,
  STORES: {
    POSTS: 'posts',
    SESSIONS: 'sessions', 
    CONFIG: 'config'
  }
};

const CACHE_CONFIG = {
  MAX_AGE_DAYS: 30,           // Clean posts older than 30 days
  CLEANUP_INTERVAL: 7,        // Cleanup every 7 days
  SESSION_RETENTION: 100      // Keep last 100 sessions
};

class YouTubeDB {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    console.log('🔧 Initializing IndexedDB...');
    
    this.db = await openDB(DB_CONFIG.NAME, DB_CONFIG.VERSION, {
      upgrade(db) {
        // Posts store - main content storage
        if (!db.objectStoreNames.contains(DB_CONFIG.STORES.POSTS)) {
          const postsStore = db.createObjectStore(DB_CONFIG.STORES.POSTS, {
            keyPath: 'id'
          });
          
          // Indexes for fast queries
          postsStore.createIndex('by-extracted-date', 'extractedAt');
          postsStore.createIndex('by-published-date', 'publishedDate');
          postsStore.createIndex('by-channel', 'channel');
          postsStore.createIndex('by-session', 'scrapingSessionId');
          postsStore.createIndex('by-n8n-status', 'sentToN8n');
          
          console.log('✅ Created posts store with indexes');
        }

        // Sessions store - scraping session tracking
        if (!db.objectStoreNames.contains(DB_CONFIG.STORES.SESSIONS)) {
          const sessionsStore = db.createObjectStore(DB_CONFIG.STORES.SESSIONS, {
            keyPath: 'sessionId'
          });
          
          sessionsStore.createIndex('by-date', 'createdAt');
          sessionsStore.createIndex('by-type', 'type');
          sessionsStore.createIndex('by-status', 'status');
          
          console.log('✅ Created sessions store with indexes');
        }

        // Config store - settings and metadata
        if (!db.objectStoreNames.contains(DB_CONFIG.STORES.CONFIG)) {
          db.createObjectStore(DB_CONFIG.STORES.CONFIG, {
            keyPath: 'key'
          });
          
          console.log('✅ Created config store');
        }
      }
    });
    
    this.initialized = true;
    console.log('✅ IndexedDB initialized successfully');
  }

  // ==================== POSTS OPERATIONS ====================

  async savePosts(posts, sessionId) {
    if (!this.initialized) await this.initialize();
    
    const tx = this.db.transaction(DB_CONFIG.STORES.POSTS, 'readwrite');
    const store = tx.objectStore(DB_CONFIG.STORES.POSTS);
    
    for (const post of posts) {
      post.scrapingSessionId = sessionId;
      post.sentToN8n = false; // Will be updated when sent
      await store.put(post);
    }
    
    await tx.complete;
    console.log(`💾 Saved ${posts.length} posts to IndexedDB`);
  }

  async markPostsSentToN8n(postIds) {
    if (!this.initialized) await this.initialize();
    
    const tx = this.db.transaction(DB_CONFIG.STORES.POSTS, 'readwrite');
    const store = tx.objectStore(DB_CONFIG.STORES.POSTS);
    
    for (const postId of postIds) {
      const post = await store.get(postId);
      if (post) {
        post.sentToN8n = true;
        post.n8nTimestamp = new Date().toISOString();
        await store.put(post);
      }
    }
    
    await tx.complete;
    console.log(`✅ Marked ${postIds.length} posts as sent to n8n`);
  }

  async isPostProcessed(postId) {
    if (!this.initialized) await this.initialize();
    
    const post = await this.db.get(DB_CONFIG.STORES.POSTS, postId);
    return !!post;
  }

  async filterNewPosts(posts, activationDate) {
    if (!this.initialized) await this.initialize();
    
    const newPosts = [];
    
    console.log(`🔍 Filtering ${posts.length} posts against activation date (Colombia timezone): ${activationDate.toISOString()}`);
    
    for (const post of posts) {
      // Check if already processed
      const exists = await this.isPostProcessed(post.id);
      if (exists) {
        console.log(`⏭️ Post already processed: ${post.id}`);
        continue;
      }
      
      // Parse and check date
      const postDate = this.parseYouTubeDate(post.publishedTime);
      if (postDate >= activationDate) {
        post.publishedDate = postDate.toISOString();
        newPosts.push(post);
        console.log(`🆕 New post: ${post.id} (${post.publishedTime})`);
      } else {
        console.log(`📅 Post too old: ${post.id} (${post.publishedTime}) vs ${activationDate.toISOString()} (Colombia timezone)`);
      }
    }
    
    console.log(`✅ Filtered result: ${newPosts.length}/${posts.length} new posts`);
    return newPosts;
  }

  // ==================== SESSIONS OPERATIONS ====================

  async createSession(type, activationDate, interval) {
    if (!this.initialized) await this.initialize();
    
    const sessionId = `session_${Date.now()}`;
    const session = {
      sessionId,
      type,
      createdAt: new Date().toISOString(),
      activationDate: activationDate?.toISOString(),
      interval,
      postsFound: 0,
      postsNew: 0,
      duration: 0,
      status: 'running'
    };
    
    await this.db.put(DB_CONFIG.STORES.SESSIONS, session);
    console.log(`🚀 Created session: ${sessionId} (${type})`);
    return sessionId;
  }

  async updateSession(sessionId, updates) {
    if (!this.initialized) await this.initialize();
    
    const session = await this.db.get(DB_CONFIG.STORES.SESSIONS, sessionId);
    if (session) {
      Object.assign(session, updates);
      await this.db.put(DB_CONFIG.STORES.SESSIONS, session);
      console.log(`📝 Updated session ${sessionId}:`, updates);
    }
  }

  // ==================== UTILITY METHODS ====================

  // Timezone utilities for Colombia (UTC-5)
  getNowInColombia() {
    const now = new Date();
    // Colombia está en UTC-5 (no cambia por horario de verano)
    const colombiaOffset = -5 * 60; // -5 horas en minutos
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (colombiaOffset * 60000));
  }

  toColombiaTime(date) {
    const colombiaOffset = -5 * 60; // -5 horas en minutos
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    return new Date(utc + (colombiaOffset * 60000));
  }

  parseYouTubeDate(timeText) {
    // Use Colombia timezone instead of system timezone
    const now = this.getNowInColombia();
    const text = timeText.toLowerCase();
    
    // Spanish patterns
    if (text.includes('minuto')) {
      const minutes = parseInt(text) || 1;
      return new Date(now - minutes * 60 * 1000);
    }
    if (text.includes('hora')) {
      const hours = parseInt(text) || 1;
      return new Date(now - hours * 60 * 60 * 1000);
    }
    if (text.includes('día') || text === 'ayer') {
      const days = text === 'ayer' ? 1 : parseInt(text) || 1;
      return new Date(now - days * 24 * 60 * 60 * 1000);
    }
    if (text.includes('semana')) {
      const weeks = parseInt(text) || 1;
      return new Date(now - weeks * 7 * 24 * 60 * 60 * 1000);
    }
    if (text.includes('mes')) {
      const months = parseInt(text) || 1;
      return new Date(now - months * 30 * 24 * 60 * 60 * 1000);
    }
    
    // English patterns (fallback)
    if (text.includes('minute')) {
      const minutes = parseInt(text) || 1;
      return new Date(now - minutes * 60 * 1000);
    }
    if (text.includes('hour')) {
      const hours = parseInt(text) || 1;
      return new Date(now - hours * 60 * 60 * 1000);
    }
    if (text.includes('day') || text === 'yesterday') {
      const days = text === 'yesterday' ? 1 : parseInt(text) || 1;
      return new Date(now - days * 24 * 60 * 60 * 1000);
    }
    if (text.includes('week')) {
      const weeks = parseInt(text) || 1;
      return new Date(now - weeks * 7 * 24 * 60 * 60 * 1000);
    }
    if (text.includes('month')) {
      const months = parseInt(text) || 1;
      return new Date(now - months * 30 * 24 * 60 * 60 * 1000);
    }
    
    console.warn(`⚠️ Could not parse date: "${timeText}", defaulting to now (Colombia timezone)`);
    return now; // Default to now if can't parse
  }

  // ==================== ANALYTICS AND MANAGEMENT ====================

  async getStats() {
    if (!this.initialized) await this.initialize();
    
    const postsCount = await this.db.count(DB_CONFIG.STORES.POSTS);
    const sessionsCount = await this.db.count(DB_CONFIG.STORES.SESSIONS);
    
    // Get recent posts (last 10)
    const tx = this.db.transaction(DB_CONFIG.STORES.POSTS, 'readonly');
    const index = tx.objectStore(DB_CONFIG.STORES.POSTS).index('by-extracted-date');
    const recentPosts = await index.getAll(null, 10);
    
    // Get recent sessions (last 5)
    const sessionsTx = this.db.transaction(DB_CONFIG.STORES.SESSIONS, 'readonly');
    const sessionsIndex = sessionsTx.objectStore(DB_CONFIG.STORES.SESSIONS).index('by-date');
    const recentSessions = await sessionsIndex.getAll(null, 5);
    
    return {
      totalPosts: postsCount,
      totalSessions: sessionsCount,
      recentPosts: recentPosts.reverse(), // Newest first
      recentSessions: recentSessions.reverse(), // Newest first
      databaseSize: 'unlimited',
      lastCleanup: await this.getLastCleanupDate()
    };
  }

  async cleanupOldData(daysToKeep = CACHE_CONFIG.MAX_AGE_DAYS) {
    if (!this.initialized) await this.initialize();
    
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    console.log(`🧹 Cleaning posts older than ${daysToKeep} days (before ${cutoffDate.toISOString()})`);
    
    // Clean old posts
    const tx = this.db.transaction(DB_CONFIG.STORES.POSTS, 'readwrite');
    const store = tx.objectStore(DB_CONFIG.STORES.POSTS);
    const index = store.index('by-extracted-date');
    
    const oldPostKeys = await index.getAllKeys(
      window.IDBKeyRange.upperBound(cutoffDate.toISOString())
    );
    
    for (const key of oldPostKeys) {
      await store.delete(key);
    }
    
    await tx.complete;
    
    // Save cleanup timestamp
    await this.saveLastCleanupDate();
    
    console.log(`🧹 Cleaned ${oldPostKeys.length} old posts`);
    return oldPostKeys.length;
  }

  async getLastCleanupDate() {
    if (!this.initialized) await this.initialize();
    
    const config = await this.db.get(DB_CONFIG.STORES.CONFIG, 'last_cleanup');
    return config?.value || null;
  }

  async saveLastCleanupDate() {
    if (!this.initialized) await this.initialize();
    
    await this.db.put(DB_CONFIG.STORES.CONFIG, {
      key: 'last_cleanup',
      value: new Date().toISOString()
    });
  }

  // ==================== DEVELOPMENT & TESTING ====================

  async clearAllData() {
    if (!this.initialized) await this.initialize();
    
    console.warn('🚨 Clearing ALL database data');
    
    await this.db.clear(DB_CONFIG.STORES.POSTS);
    await this.db.clear(DB_CONFIG.STORES.SESSIONS);
    await this.db.clear(DB_CONFIG.STORES.CONFIG);
    
    console.log('✅ Database cleared');
  }

  async exportData() {
    if (!this.initialized) await this.initialize();
    
    const posts = await this.db.getAll(DB_CONFIG.STORES.POSTS);
    const sessions = await this.db.getAll(DB_CONFIG.STORES.SESSIONS);
    const config = await this.db.getAll(DB_CONFIG.STORES.CONFIG);
    
    return {
      posts,
      sessions,
      config,
      exportedAt: new Date().toISOString()
    };
  }
}

// Export singleton instance
const youtubeDB = new YouTubeDB();
export default youtubeDB;

console.log('📚 Database module loaded'); 