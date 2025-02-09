import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, Text, PixelRatio } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface ImageCropperProps {
  sourceUri: string;
  onCropDone?: (uri: string) => void;
  onCancel?: () => void;
}

interface Offset {
  x: number;
  y: number;
}

interface ImageDimensions {
  width: number;
  height: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CROP_SIZE = SCREEN_WIDTH * 0.8;
const PREVIEW_SIZE = 40;

export default function ImageCropper({ sourceUri, onCropDone, onCancel }: ImageCropperProps) {
  const [baseScale, setBaseScale] = useState<number>(1);
  const [pinchScale, setPinchScale] = useState<number>(1);
  const [translateX, setTranslateX] = useState<number>(0);
  const [translateY, setTranslateY] = useState<number>(0);
  const lastOffset = useRef<Offset>({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  useEffect(() => {
    Image.getSize(
      sourceUri,
      (width: number, height: number) => {
        const dimensions: ImageDimensions = { width, height };
        setImageDimensions(dimensions);

        const widthRatio = CROP_SIZE / width;
        const heightRatio = CROP_SIZE / height;
        const initialScale = Math.max(widthRatio, heightRatio) * 1.2;

        setBaseScale(initialScale);
        setPinchScale(1);
        setTranslateX(0);
        setTranslateY(0);
        lastOffset.current = { x: 0, y: 0 };
      },
      (err: Error) => {
        console.error(err);
      }
    );
  }, [sourceUri]);

  const getMinScale = useCallback((): number => {
    if (!imageDimensions) return 1;
    const { width, height } = imageDimensions;
    const widthRatio = CROP_SIZE / width;
    const heightRatio = CROP_SIZE / height;
    return Math.max(widthRatio, heightRatio);
  }, [imageDimensions]);

  const getBoundedTranslation = useCallback(
    (newTranslateX: number, newTranslateY: number, scale: number): { x: number; y: number } => {
      if (!imageDimensions) return { x: newTranslateX, y: newTranslateY };

      const imageWidth = imageDimensions.width * scale;
      const imageHeight = imageDimensions.height * scale;

      // Calculate the maximum allowed translation in each direction
      const maxTranslateX = Math.max(0, (imageWidth - CROP_SIZE) / 2);
      const maxTranslateY = Math.max(0, (imageHeight - CROP_SIZE) / 2);

      return {
        x: Math.min(Math.max(newTranslateX, -maxTranslateX), maxTranslateX),
        y: Math.min(Math.max(newTranslateY, -maxTranslateY), maxTranslateY),
      };
    },
    [imageDimensions]
  );

  const generatePreview = useCallback(async () => {
    if (!imageDimensions) return;
    try {
      const finalScale = baseScale * pinchScale;
      const displayedWidth = imageDimensions.width * finalScale;
      const displayedHeight = imageDimensions.height * finalScale;
  
      const offsetX = CROP_SIZE / 2 - displayedWidth / 2 + translateX;
      const offsetY = CROP_SIZE / 2 - displayedHeight / 2 + translateY;
  
      const widthRatio = imageDimensions.width / displayedWidth;
      const heightRatio = imageDimensions.height / displayedHeight;
  
      const originX = Math.max(0, (0 - offsetX) * widthRatio);
      const originY = Math.max(0, (0 - offsetY) * heightRatio);
      const cropWidth = Math.min(imageDimensions.width, CROP_SIZE * widthRatio);
      const cropHeight = Math.min(imageDimensions.height, CROP_SIZE * heightRatio);
  
      const result = await manipulateAsync(
        sourceUri,
        [
          {
            crop: {
              originX: Math.round(originX),
              originY: Math.round(originY),
              width: Math.round(cropWidth),
              height: Math.round(cropHeight),
            },
          },
          {
            resize: {
              width: PREVIEW_SIZE,
              height: PREVIEW_SIZE,
            },
          },
        ],
        { compress: 1, format: SaveFormat.PNG }
      );
  
      setPreviewUri(result.uri);
    } catch (err) {
      console.error('Preview generation error:', err);
    }
  }, [baseScale, pinchScale, translateX, translateY, imageDimensions, sourceUri]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((evt) => {
      const minScale = getMinScale();
      const newScale = baseScale * evt.scale;
      if (newScale >= minScale) {
        setPinchScale(evt.scale);
        // Update translation bounds when scaling
        const bounded = getBoundedTranslation(
          translateX,
          translateY,
          newScale
        );
        setTranslateX(bounded.x);
        setTranslateY(bounded.y);
      }
    })
    .onEnd(() => {
      const minScale = getMinScale();
      const newScale = baseScale * pinchScale;
      const finalScale = Math.max(minScale, newScale);
      setBaseScale(finalScale);
      setPinchScale(1);
      generatePreview();
    });

  const panGesture = Gesture.Pan()
    .onUpdate((evt) => {
      const scale = baseScale * pinchScale;
      const newTranslateX = lastOffset.current.x + evt.translationX;
      const newTranslateY = lastOffset.current.y + evt.translationY;
      
      const bounded = getBoundedTranslation(newTranslateX, newTranslateY, scale);
      setTranslateX(bounded.x);
      setTranslateY(bounded.y);
    })
    .onEnd((evt) => {
      const scale = baseScale * pinchScale;
      const newTranslateX = lastOffset.current.x + evt.translationX;
      const newTranslateY = lastOffset.current.y + evt.translationY;
      
      const bounded = getBoundedTranslation(newTranslateX, newTranslateY, scale);
      lastOffset.current = bounded;
      generatePreview();
    });

  const simultaneousGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const handleCrop = useCallback(async () => {
    if (!imageDimensions) return;
    try {
      const finalScale = baseScale * pinchScale;
      const displayedWidth = imageDimensions.width * finalScale;
      const displayedHeight = imageDimensions.height * finalScale;
  
      const offsetX = CROP_SIZE / 2 - displayedWidth / 2 + translateX;
      const offsetY = CROP_SIZE / 2 - displayedHeight / 2 + translateY;
  
      const widthRatio = imageDimensions.width / displayedWidth;
      const heightRatio = imageDimensions.height / displayedHeight;
  
      const originX = Math.max(0, (0 - offsetX) * widthRatio);
      const originY = Math.max(0, (0 - offsetY) * heightRatio);
      const cropWidth = Math.min(imageDimensions.width, CROP_SIZE * widthRatio);
      const cropHeight = Math.min(imageDimensions.height, CROP_SIZE * heightRatio);
  
      const result = await manipulateAsync(
        sourceUri,
        [
          {
            crop: {
              originX: Math.round(originX),
              originY: Math.round(originY),
              width: Math.round(cropWidth),
              height: Math.round(cropHeight),
            },
          },
        ],
        { compress: 1, format: SaveFormat.PNG }
      );
  
      onCropDone?.(result.uri);
    } catch (err) {
      console.error('Crop error:', err);
    }
  }, [baseScale, pinchScale, translateX, translateY, imageDimensions, sourceUri, onCropDone]);

  if (!imageDimensions) return null;

  const scale = baseScale * pinchScale;
  const imageWidth = imageDimensions.width * scale;
  const imageHeight = imageDimensions.height * scale;

  return (
    <View style={styles.container}>
      <GestureHandlerRootView style={styles.cropContainer}>
        <GestureDetector gesture={simultaneousGesture}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: sourceUri }}
              style={[
                styles.image,
                {
                  width: imageWidth,
                  height: imageHeight,
                  transform: [{ translateX }, { translateY }],
                },
              ]}
              resizeMode="cover"
            />
          </View>
        </GestureDetector>
        <View style={styles.cropBorder} pointerEvents="none" />
      </GestureHandlerRootView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleCrop}>
          <Text style={styles.buttonText}>Confirm</Text>
        </TouchableOpacity>
      </View>

      {previewUri && (
        <View>
          <Image source={{ uri: previewUri }} style={styles.preview} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropContainer: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  imageWrapper: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    position: 'absolute',
  },
  cropBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#444',
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#1a73e8',
    marginLeft: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  preview: {
    marginTop: 20,
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#333',
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    maxWidth: PREVIEW_SIZE,
    maxHeight: PREVIEW_SIZE,
  },
});