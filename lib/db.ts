// lib/db.ts - COMPLETE FIXED VERSION

const DB_NAME = 'EnvVaultDB';
const DB_VERSION = 1;
const STORE_NAME = 'variables';
const SETTINGS_STORE = 'settings';

export interface EncryptedVariable {
  id: string;
  environmentId: string;
  key: string;
  encryptedValue: string;
  iv: string;
  createdAt: number;
  updatedAt: number;
}

export interface Environment {
  id: string;
  name: string;
  type: 'production' | 'staging' | 'development' | 'custom';
  color: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserSettings {
  masterPasswordHash: string;
  salt: string;
  createdAt: number;
}

class EnvVaultDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ IndexedDB open error:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log('🔄 IndexedDB upgrade needed');
        const db = (event.target as IDBOpenDBRequest).result;

        // Create variables store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          console.log('📦 Creating variables store');
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('environmentId', 'environmentId', { unique: false });
          store.createIndex('key', 'key', { unique: false });
        }

        // Create settings store
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          console.log('📦 Creating settings store');
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
        }

        // Create environments store
        if (!db.objectStoreNames.contains('environments')) {
          console.log('📦 Creating environments store');
          db.createObjectStore('environments', { keyPath: 'id' });
        }
      };
    });
  }

  // Variable operations
  async addVariable(variable: EncryptedVariable): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(variable);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateVariable(variable: EncryptedVariable): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(variable);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteVariable(id: string): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getVariablesByEnvironment(environmentId: string): Promise<EncryptedVariable[]> {
    if (!environmentId) {
      console.error('❌ No environmentId provided');
      return [];
    }
    
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('environmentId');
      const request = index.getAll(environmentId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllVariables(): Promise<EncryptedVariable[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Environment operations
  async addEnvironment(environment: Environment): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['environments'], 'readwrite');
      const store = transaction.objectStore('environments');
      const request = store.add(environment);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateEnvironment(environment: Environment): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['environments'], 'readwrite');
      const store = transaction.objectStore('environments');
      const request = store.put(environment);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteEnvironment(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    // First delete all variables in this environment
    const variables = await this.getVariablesByEnvironment(id);
    for (const variable of variables) {
      await this.deleteVariable(variable.id);
    }

    // Then delete the environment
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['environments'], 'readwrite');
      const store = transaction.objectStore('environments');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllEnvironments(): Promise<Environment[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['environments'], 'readonly');
      const store = transaction.objectStore('environments');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getEnvironment(id: string): Promise<Environment | undefined> {
    console.log('🔍 getEnvironment called with id:', id);
    
    if (!id) {
      console.error('❌ No ID provided to getEnvironment');
      throw new Error('Environment ID is required');
    }
    
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(['environments'], 'readonly');
        const store = transaction.objectStore('environments');
        console.log('📦 Getting environment with ID:', id);
        const request = store.get(id);

        request.onsuccess = () => {
          console.log('✅ Environment found:', request.result);
          resolve(request.result);
        };
        
        request.onerror = () => {
          console.error('❌ getEnvironment error:', request.error);
          reject(request.error);
        };
      } catch (err) {
        console.error('❌ getEnvironment exception:', err);
        reject(err);
      }
    });
  }

  // Settings operations
  async saveSettings(settings: UserSettings): Promise<void> {
    console.log('💾 Saving settings');
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([SETTINGS_STORE], 'readwrite');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.put({ key: 'userSettings', ...settings });

        request.onsuccess = () => {
          console.log('✅ Settings saved successfully');
          resolve();
        };
        request.onerror = () => {
          console.error('❌ Save settings error:', request.error);
          reject(request.error);
        };
      } catch (err) {
        console.error('❌ saveSettings exception:', err);
        reject(err);
      }
    });
  }

  async getSettings(): Promise<UserSettings | null> {
    console.log('🔍 getSettings called');
    
    if (!this.db) {
      console.log('📦 DB not initialized, initializing...');
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([SETTINGS_STORE], 'readonly');
        const store = transaction.objectStore(SETTINGS_STORE);
        
        console.log('📦 Getting userSettings key');
        const request = store.get('userSettings');

        request.onsuccess = () => {
          console.log('✅ getSettings result:', request.result);
          const result = request.result;
          if (result) {
            const { key, ...settings } = result;
            resolve(settings as UserSettings);
          } else {
            console.log('⚠️ No settings found');
            resolve(null);
          }
        };
        
        request.onerror = () => {
          console.error('❌ getSettings error:', request.error);
          reject(request.error);
        };
      } catch (err) {
        console.error('❌ getSettings exception:', err);
        reject(err);
      }
    });
  }

  // Export all data for backup
  async exportAll(): Promise<{
    variables: EncryptedVariable[];
    environments: Environment[];
    settings: UserSettings | null;
    exportedAt: number;
    version: string;
  }> {
    const variables = await this.getAllVariables();
    const environments = await this.getAllEnvironments();
    const settings = await this.getSettings();

    return {
      variables,
      environments,
      settings,
      exportedAt: Date.now(),
      version: '1.0.0'
    };
  }

  // Import data from backup
  async importAll(data: {
    variables: EncryptedVariable[];
    environments: Environment[];
    settings?: UserSettings;
  }): Promise<void> {
    if (!this.db) await this.init();

    // Import environments first
    for (const env of data.environments) {
      await this.addEnvironment(env);
    }

    // Import variables
    for (const variable of data.variables) {
      await this.addVariable(variable);
    }

    // Import settings if present
    if (data.settings) {
      await this.saveSettings(data.settings);
    }
  }

  // Clear all data
  async clearAll(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [STORE_NAME, 'environments', SETTINGS_STORE],
        'readwrite'
      );

      const variablesStore = transaction.objectStore(STORE_NAME);
      const environmentsStore = transaction.objectStore('environments');
      const settingsStore = transaction.objectStore(SETTINGS_STORE);

      variablesStore.clear();
      environmentsStore.clear();
      settingsStore.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// Export singleton instance
export const db = new EnvVaultDB();