import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const imagePickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: 'images',
  allowsEditing: true,
  aspect: [1, 1],
  quality: 1,
};

/**
 * Take a picture with the device camera and crop it to a 1:1 aspect ratio
 * @returns The URI of the cropped image or null if canceled
 */
export const takePicture = async (): Promise<string | null> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Camera permission is needed to take pictures');
    return null;
  }

  try {
    const result = await ImagePicker.launchCameraAsync(imagePickerOptions);

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error('Error taking picture:', error);
    return null;
  }
};

/**
 * Pick an image from the device gallery and crop it to a 1:1 aspect ratio
 * @returns The URI of the cropped image or null if canceled
 */
export const pickFromGallery = async (): Promise<string | null> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Photo library permission is needed to select images');
    return null;
  }

  try {
    const result = await ImagePicker.launchImageLibraryAsync(imagePickerOptions);

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error('Error picking from gallery:', error);
    return null;
  }
};
