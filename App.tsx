import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActionSheetIOS } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import NightSkyBackground from './src/components/NightSkyBackground';
import ImageCropScreen from './src/components/ImageCropScreen';
import { MoonStorage } from './src/storage/moonStorage';
import Calendar from '@/components/Calendar';

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

  const showImagePicker = async (): Promise<void> => {
    if (!canTakePhoto) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex: number) => {
          if (buttonIndex === 1) {
            await takePicture();
          } else if (buttonIndex === 2) {
            await pickImage();
          }
        }
      );
    } else {
      await pickImage();
    }
  };

  const reset = async (): Promise<void> => {
    const storage = MoonStorage.getInstance();
    await storage.clear();
    setCanTakePhoto(true);
  }

  const takePicture = async (): Promise<void> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status === 'granted') {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setIsCropping(true);
      }
    }
  };

  const pickImage = async (): Promise<void> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setIsCropping(true);
    }
  };

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
            onPress={showImagePicker}
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