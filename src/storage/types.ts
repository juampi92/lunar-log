export interface MoonEntry {
  date: string;  // ISO date string YYYY-MM-DD
  image?: string;  // Local file path
  moon: number;  // Moon phase as float 0-1
  missed?: string;  // Reason for missing the photo
}

export interface MoonLog {
  entries: Record<string, MoonEntry>;  // Indexed by date string
  version: number;  // For future migrations
}