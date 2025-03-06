import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import NightSkyBackground from './src/components/NightSkyBackground';
import { MoonStorage } from './src/storage/moonStorage';
import Calendar from '@/components/Calendar';
import DateActionsMenu from './src/components/DateActionsMenu';
import { takePicture, pickFromGallery } from './src/services/imageService';
import { MoonEntry } from './src/storage/types';

export default function App(): JSX.Element {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentEntry, setCurrentEntry] = useState<MoonEntry | null>(null);
  const [entries, setEntries] = useState<Record<string, MoonEntry>>({});

  useEffect(() => {
    const initStorage = async () => {
      const storage = MoonStorage.getInstance();
      await storage.init();
      const allEntries = await storage.getAllEntries();
      setEntries(allEntries);
    };

    initStorage();
  }, []);
  
  useEffect(() => {
    const loadSelectedDateEntry = async () => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const storage = MoonStorage.getInstance();
      const entry = await storage.getEntry(dateStr);
      setCurrentEntry(entry);
    };
    
    loadSelectedDateEntry();
  }, [selectedDate, entries]);

  const handleTakePicture = async (): Promise<void> => {
    const imageUri = await takePicture();
    if (!imageUri) return;
    
    await handleSaveImage(imageUri);
  };
  
  const handlePickFromGallery = async (): Promise<void> => {
    const imageUri = await pickFromGallery();
    if (!imageUri) return;
    
    await handleSaveImage(imageUri);
  };
  
  const handleMarkNotSeen = async (): Promise<void> => {
    const storage = MoonStorage.getInstance();
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    await storage.markDateAsNotSeen(dateStr);
    
    // Refresh entries
    const allEntries = await storage.getAllEntries();
    setEntries(allEntries);
  };

  const handleSaveImage = async (croppedImageUri: string): Promise<void> => {
    try {
      const storage = MoonStorage.getInstance();
      
      // Save the cropped image to permanent storage
      const savedImagePath = await storage.saveImage(croppedImageUri);
      
      // Add entry for the selected date
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      await storage.updateEntry(dateStr, {
        image: savedImagePath,
        moon: 0.5, // TODO: Calculate actual moon phase
        notSeen: false
      });

      // Refresh entries
      const allEntries = await storage.getAllEntries();
      setEntries(allEntries);
    } catch (error) {
      console.error('Failed to save moon entry:', error);
      // TODO: Show error to user
    }
  };

  const handleDateSelect = (date: Date): void => {
    setSelectedDate(date);
  };
  
  const handleRemoveEntry = async (): Promise<void> => {
    if (!currentEntry) return;
    
    const storage = MoonStorage.getInstance();
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    await storage.deleteEntry(dateStr);
    
    // Refresh entries
    const allEntries = await storage.getAllEntries();
    setEntries(allEntries);
  };



  return (
    <NightSkyBackground>
      <View style={styles.content}>
        {/* Section 1: Logo (1/5) */}
        <View style={styles.logoSection}>
          <Text style={styles.moon}>🌙</Text>
        </View>

        {/* Section 2-4: Calendar (3/5) */}
        <View style={styles.calendarSection}>
          <Calendar 
            selectedDate={selectedDate} 
            onDateSelect={handleDateSelect} 
            entries={entries} 
          />
        </View>
        
        {/* Section 5: DateActionsMenu (1/5) */}
        <View style={styles.actionsSection}>
          <DateActionsMenu
            selectedDate={selectedDate}
            entry={currentEntry}
            onMarkNotSeen={handleMarkNotSeen}
            onTakePicture={handleTakePicture}
            onPickFromGallery={handlePickFromGallery}
            onRemoveEntry={handleRemoveEntry}
          />
        </View>
      </View>
    </NightSkyBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 50,
    flexDirection: 'column', // Stack children vertically
  },
  logoSection: {
    flex: 1, // Takes 1/5 of the available space
    justifyContent: 'center',
    alignItems: 'center',
  },
  moon: {
    fontSize: 50,
  },
  calendarSection: {
    flex: 3, // Takes 3/5 of the available space
  },
  actionsSection: {
    flex: 1, // Takes 1/5 of the available space
    paddingBottom: 10,
  },
});