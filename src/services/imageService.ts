import { Platform, ActionSheetIOS, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type ImageSource = 'camera' | 'gallery' | 'cancel';

export const askImageSource = async (): Promise<ImageSource> => {
  if (Platform.OS === 'ios') {
    return new Promise((resolve) => {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex: number) => {
          if (buttonIndex === 0) resolve('cancel');
          if (buttonIndex === 1) resolve('camera');
          if (buttonIndex === 2) resolve('gallery');
        }
      );
    });
  }

  // For Android, we'll use Alert
  return new Promise((resolve) => {
    Alert.alert(
      'Select Image Source',
      'Choose where to get your moon picture from',
      [
        {
          text: 'Cancel',
          onPress: () => resolve('cancel'),
          style: 'cancel',
        },
        {
          text: 'Take Photo',
          onPress: () => resolve('camera'),
        },
        {
          text: 'Choose from Library',
          onPress: () => resolve('gallery'),
        },
      ],
      { cancelable: true, onDismiss: () => resolve('cancel') }
    );
  });
};

export const takePicture = async (): Promise<string | null> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 1,
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0].uri;
};

export const pickFromGallery = async (): Promise<string | null> => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 1,
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0].uri;
};