/**
 * Trading Playbook - Database Layer (IndexedDB)
 * Handles offline persistence, large chart images, export/import JSON
 */

const DB_NAME = 'TradingPlaybookDB';
const DB_VERSION = 1;
const STORE_NAME = 'playbooks';

class PlaybookDB {
  constructor() {
    this.db = null;
  }

  async open() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('pair', 'pair', { unique: false });
          store.createIndex('position', 'position', { unique: false });
          store.createIndex('outcome', 'outcome', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async getAll() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const list = request.result || [];
        // Sắp xếp mới nhất lên đầu
        list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        resolve(list);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  async getById(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async save(playbook) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const now = Date.now();
      if (!playbook.id) {
        playbook.id = 'pb_' + now + '_' + Math.random().toString(36).substr(2, 5);
        playbook.createdAt = now;
      }
      playbook.updatedAt = now;

      const request = store.put(playbook);

      request.onsuccess = () => resolve(playbook);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async delete(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async exportAll() {
    const playbooks = await this.getAll();
    const exportData = {
      app: 'TradingPlaybook',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      total: playbooks.length,
      data: playbooks
    };
    return exportData;
  }

  async importAll(jsonData, overwrite = false) {
    if (!jsonData || !Array.isArray(jsonData.data)) {
      throw new Error('Định dạng file sao lưu không hợp lệ');
    }

    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      if (overwrite) {
        store.clear();
      }

      let count = 0;
      for (const item of jsonData.data) {
        if (item.id && item.title) {
          store.put(item);
          count++;
        }
      }

      transaction.oncomplete = () => resolve(count);
      transaction.onerror = (event) => reject(event.target.error);
    });
  }

  async clearAll() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(event.target.error);
    });
  }
}

// Global instance
window.playbookDB = new PlaybookDB();
