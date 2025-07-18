// Simple IndexedDB wrapper for Chrome Extensions
// Native implementation without external dependencies

export function openDB(name, version, { upgrade } = {}) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      resolve(new DBWrapper(db));
    };
    
    if (upgrade) {
      request.onupgradeneeded = (event) => {
        const db = request.result;
        const transaction = request.transaction;
        upgrade(new DBWrapper(db), event.oldVersion, event.newVersion, new TransactionWrapper(transaction), event);
      };
    }
  });
}

class DBWrapper {
  constructor(db) {
    this.db = db;
  }
  
  transaction(storeNames, mode = 'readonly') {
    const tx = this.db.transaction(storeNames, mode);
    return new TransactionWrapper(tx);
  }
  
  objectStore(name) {
    // For direct access during upgrade
    return new ObjectStoreWrapper(this.db.objectStore(name));
  }
  
  get objectStoreNames() {
    return this.db.objectStoreNames;
  }
  
  createObjectStore(name, options) {
    const store = this.db.createObjectStore(name, options);
    return new ObjectStoreWrapper(store);
  }
  
  deleteObjectStore(name) {
    this.db.deleteObjectStore(name);
  }
  
  close() {
    this.db.close();
  }
  
  // Helper methods for common operations
  async get(storeName, key) {
    const tx = this.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return store.get(key);
  }
  
  async put(storeName, value, key) {
    const tx = this.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.put(value, key);
    return tx.complete;
  }
  
  async add(storeName, value, key) {
    const tx = this.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.add(value, key);
    return tx.complete;
  }
  
  async delete(storeName, key) {
    const tx = this.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.delete(key);
    return tx.complete;
  }
  
  async clear(storeName) {
    const tx = this.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.clear();
    return tx.complete;
  }
  
  async count(storeName, query) {
    const tx = this.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return store.count(query);
  }
  
  async getAll(storeName, query, count) {
    const tx = this.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return store.getAll(query, count);
  }
  
  async getAllKeys(storeName, query, count) {
    const tx = this.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return store.getAllKeys(query, count);
  }
}

class TransactionWrapper {
  constructor(transaction) {
    this.transaction = transaction;
  }
  
  objectStore(name) {
    const store = this.transaction.objectStore(name);
    return new ObjectStoreWrapper(store);
  }
  
  get complete() {
    return new Promise((resolve, reject) => {
      this.transaction.oncomplete = () => resolve();
      this.transaction.onerror = () => reject(this.transaction.error);
      this.transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  }
}

class ObjectStoreWrapper {
  constructor(store) {
    this.store = store;
  }
  
  get(key) {
    return promisifyRequest(this.store.get(key));
  }
  
  put(value, key) {
    return promisifyRequest(this.store.put(value, key));
  }
  
  add(value, key) {
    return promisifyRequest(this.store.add(value, key));
  }
  
  delete(key) {
    return promisifyRequest(this.store.delete(key));
  }
  
  clear() {
    return promisifyRequest(this.store.clear());
  }
  
  count(query) {
    return promisifyRequest(this.store.count(query));
  }
  
  getAll(query, count) {
    return promisifyRequest(this.store.getAll(query, count));
  }
  
  getAllKeys(query, count) {
    return promisifyRequest(this.store.getAllKeys(query, count));
  }
  
  createIndex(name, keyPath, options) {
    return new IndexWrapper(this.store.createIndex(name, keyPath, options));
  }
  
  index(name) {
    return new IndexWrapper(this.store.index(name));
  }
  
  deleteIndex(name) {
    this.store.deleteIndex(name);
  }
}

class IndexWrapper {
  constructor(index) {
    this.index = index;
  }
  
  get(key) {
    return promisifyRequest(this.index.get(key));
  }
  
  getAll(query, count) {
    return promisifyRequest(this.index.getAll(query, count));
  }
  
  getAllKeys(query, count) {
    return promisifyRequest(this.index.getAllKeys(query, count));
  }
  
  count(query) {
    return promisifyRequest(this.index.count(query));
  }
}

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Export for compatibility
export { DBWrapper as IDBDatabase };
export { ObjectStoreWrapper as IDBObjectStore };
export { IndexWrapper as IDBIndex };
export { TransactionWrapper as IDBTransaction }; 