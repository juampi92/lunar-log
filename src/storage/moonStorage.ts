import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { format } from 'date-fns';
import { MoonLog, MoonEntry } from './types';

const STORAGE_KEY = '@lunar_log';
const IMAGE_DIR = `${FileSystem.documentDirectory}moon_images/`;

export class MoonStorage {
  private static instance: MoonStorage;
  private log: MoonLog = { entries: {}, version: 1 };
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

    // Ensure image directory exists
    const dirInfo = await FileSystem.getInfoAsync(IMAGE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
    }

    // Load stored data
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      this.log = JSON.parse(stored);
    }

    this.initialized = true;
  }

  private async save(): Promise<void> {
    console.log('Saving log:', this.log);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.log));
  }

  async hasEntryForToday(): Promise<boolean> {
    const today = format(new Date(), 'yyyy-MM-dd');
    return !!this.log.entries[today];
  }

  async getEntry(date: string): Promise<MoonEntry | null> {
    return this.log.entries[date] || null;
  }

  async getAllEntries(): Promise<Record<string, MoonEntry>> {
    return { ...this.log.entries };
  }

  async saveImage(uri: string): Promise<string> {
    const filename = `moon_${Date.now()}.jpg`;
    const destination = `${IMAGE_DIR}${filename}`;
    
    await FileSystem.copyAsync({
      from: uri,
      to: destination
    });

    return destination;
  }

  async addEntry(entry: Omit<MoonEntry, 'date'>): Promise<void> {
    const date = format(new Date(), 'yyyy-MM-dd');
    
    this.log.entries[date] = {
      ...entry,
      date
    };

    await this.save();
  }

  async updateEntry(date: string, entry: Partial<MoonEntry>): Promise<void> {
    if (!this.log.entries[date]) {
      throw new Error(`No entry exists for date: ${date}`);
    }

    this.log.entries[date] = {
      ...this.log.entries[date],
      ...entry
    };

    await this.save();
  }

  async deleteEntry(date: string): Promise<void> {
    if (this.log.entries[date]?.image) {
      try {
        await FileSystem.deleteAsync(this.log.entries[date].image!);
      } catch (e) {
        console.warn('Failed to delete image file:', e);
      }
    }

    delete this.log.entries[date];
    await this.save();
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
    this.log = { entries: {}, version: 1 };

    // Delete all images
    const files = await FileSystem.readDirectoryAsync(IMAGE_DIR);
    await Promise.all(files.map((file) => FileSystem.deleteAsync(`${IMAGE_DIR}${file}`)));
   
    await this.save();
  }
}