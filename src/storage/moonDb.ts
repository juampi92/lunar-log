import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { format } from 'date-fns';
import type { MoonEntry } from './types';

interface LunarLogDB extends DBSchema {
  entries: {
    key: string; // yyyy-MM-dd
    value: MoonEntry;
  };
  images: {
    key: string; // image id
    value: Blob;
  };
}

const DB_NAME = 'lunar-log-db';
const DB_VERSION = 1;

export class MoonStorage {
  private static instance: MoonStorage;
  private db: IDBPDatabase<LunarLogDB> | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): MoonStorage {
    if (!MoonStorage.instance) {
      MoonStorage.instance = new MoonStorage();
    }
    return MoonStorage.instance;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    this.db = await openDB<LunarLogDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('entries')) {
          db.createObjectStore('entries', { keyPath: 'date' });
        }
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images');
        }
      },
    });

    // Best-effort request for persistent storage to reduce eviction risk.
    if (navigator.storage && navigator.storage.persist) {
      try {
        await navigator.storage.persist();
      } catch {
        /* ignore */
      }
    }

    this.initialized = true;
  }

  private requireDb(): IDBPDatabase<LunarLogDB> {
    if (!this.db) {
      throw new Error('MoonStorage not initialized. Call init() first.');
    }
    return this.db;
  }

  async hasEntryForToday(): Promise<boolean> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const entry = await this.requireDb().get('entries', today);
    return !!entry;
  }

  async markDateAsNotSeen(date: string): Promise<void> {
    const entry: MoonEntry = {
      date,
      moon: 0,
      notSeen: true,
    };
    await this.requireDb().put('entries', entry);
  }

  async getEntry(date: string): Promise<MoonEntry | null> {
    return (await this.requireDb().get('entries', date)) ?? null;
  }

  async getAllEntries(): Promise<Record<string, MoonEntry>> {
    const all = await this.requireDb().getAll('entries');
    const map: Record<string, MoonEntry> = {};
    for (const entry of all) {
      map[entry.date] = entry;
    }
    return map;
  }

  async saveImage(blob: Blob): Promise<string> {
    const id = `moon_${Date.now()}`;
    await this.requireDb().put('images', blob, id);
    return id;
  }

  async getImage(id: string): Promise<Blob | null> {
    return (await this.requireDb().get('images', id)) ?? null;
  }

  async updateEntry(date: string, patch: Partial<MoonEntry>): Promise<void> {
    const db = this.requireDb();
    const existing = (await db.get('entries', date)) ?? null;
    const entry: MoonEntry = existing
      ? { ...existing, ...patch, date }
      : { date, moon: 0, ...patch };
    await db.put('entries', entry);
  }

  async deleteEntry(date: string): Promise<void> {
    const db = this.requireDb();
    const entry = await db.get('entries', date);
    if (entry?.image) {
      try {
        await db.delete('images', entry.image);
      } catch (e) {
        console.warn('Failed to delete image blob:', e);
      }
    }
    await db.delete('entries', date);
  }

  async clear(): Promise<void> {
    const db = this.requireDb();
    await db.clear('entries');
    await db.clear('images');
  }
}
