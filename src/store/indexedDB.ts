const DB_NAME = 'llm-bridge-db';
const STORE_NAME = 'config';
const DB_VERSION = 1;

class IndexedDBStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  async getItem(key: string): Promise<string | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onerror = () => {
        reject(new Error(`Failed to get item: ${key}`));
      };

      request.onsuccess = () => {
        resolve(request.result || null);
      };
    });
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onerror = () => {
        reject(new Error(`Failed to set item: ${key}`));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async removeItem(key: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onerror = () => {
        reject(new Error(`Failed to remove item: ${key}`));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }
}

export const indexedDBStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const storage = new IndexedDBStorage();
    return await storage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    const storage = new IndexedDBStorage();
    await storage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    const storage = new IndexedDBStorage();
    await storage.removeItem(key);
  }
};

export const localStorageStorage = {
  getItem: (key: string): string | null => {
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  }
};

export type StorageType = 'localStorage' | 'indexedDB'

export type Storage = {
  getItem: (key: string) => string | null | Promise<string | null>
  setItem: (key: string, value: string) => void | Promise<void>
  removeItem: (key: string) => void | Promise<void>
}

export function getStorage(type: StorageType): Storage {
  return type === 'indexedDB' ? indexedDBStorage : localStorageStorage;
}
