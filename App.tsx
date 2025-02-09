import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import NightSkyBackground from './src/components/NightSkyBackground';
import ImageCropScreen from './src/components/ImageCropScreen';
import { MoonStorage } from './src/storage/moonStorage';
import Calendar from '@/components/Calendar';
import { askImageSource, takePicture, pickFromGallery } from './src/services/imageService';

export default function App(): JSX.Element {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [canTakePhoto, setCanTakePhoto] = useState<boolean>(true);

  useEffect(() => {
    const initStorage = async () => {
      const storage = MoonStorage.getInstance();
      await storage.init();
      const hasToday = await storage.hasEntryForToday();
      setCanTakePhoto(!hasToday);
    };

    initStorage();
  }, []);

  const handleImageSelection = async (): Promise<void> => {
    if (!canTakePhoto) return;

    const source = await askImageSource();
    
    if (source === 'cancel') {
      return;
    }

    const imageUri = source === 'camera' 
      ? await takePicture()
      : await pickFromGallery();

    if (!imageUri) {
      return;
    }

    setSelectedImage(imageUri);
    setIsCropping(true);
  };

  const reset = async (): Promise<void> => {
    const storage = MoonStorage.getInstance();
    await storage.clear();
    setCanTakePhoto(true);
  }

  const handleSaveImage = async (croppedImageUri: string): Promise<void> => {
    try {
      const storage = MoonStorage.getInstance();
      
      // Save the cropped image to permanent storage
      const savedImagePath = await storage.saveImage(croppedImageUri);
      
      // Add entry for today
      await storage.addEntry({
        image: savedImagePath,
        moon: 0.5, // TODO: Calculate actual moon phase
      });

      setCanTakePhoto(false);
    } catch (error) {
      console.error('Failed to save moon entry:', error);
      // TODO: Show error to user
    }

    setSelectedImage(null);
    setIsCropping(false);
  };

  const handleCancel = (): void => {
    setSelectedImage(null);
    setIsCropping(false);
  };

  if (isCropping && selectedImage) {
    return (
      <ImageCropScreen
        sourceUri={selectedImage}
        onCancel={handleCancel}
        onCropDone={handleSaveImage}
      />
    );
  }

  return (
    <NightSkyBackground>
      <View style={styles.content}>
        <View style={styles.moonContainer}>
          <Text style={styles.moon}>🌙</Text>
        </View>

        <View style={styles.centerContent}>
          <TouchableOpacity 
            style={[
              styles.button,
              !canTakePhoto && styles.buttonDisabled
            ]} 
            onPress={handleImageSelection}
            disabled={!canTakePhoto}
          >
            <Text style={[
              styles.buttonText,
              !canTakePhoto && styles.buttonTextDisabled
            ]}>
              {canTakePhoto ? 'Take Moon Picture' : 'Picture taken for today'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button} 
            onPress={reset}
          >
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centerContent}>
          <Calendar />
        </View>
      </View>
    </NightSkyBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  moonContainer: {
    marginTop: 50,
    alignSelf: 'center',
  },
  moon: {
    fontSize: 50,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#222',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  buttonTextDisabled: {
    color: '#999',
  },
});