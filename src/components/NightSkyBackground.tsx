import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { View, Dimensions, StyleSheet, Animated, Easing, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Star {
  x: number;
  y: number;
}

interface NightSkyBackgroundProps {
  children: ReactNode;
}

function seededRandom(seed: number): number {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getDailySeed(): number {
  const today = new Date();
  return Number(`${today.getFullYear()}${today.getMonth()}${today.getDate()}`);
}

function generateStars(numStars: number): Star[] {
  const seed = getDailySeed();
  const stars: Star[] = [];
  const { width, height } = Dimensions.get('window');

  for (let i = 0; i < numStars; i++) {
    const randX = seededRandom(seed + i) * width;
    const randY = seededRandom(seed + i + 100) * (height * 0.8);
    stars.push({ x: randX, y: randY });
  }

  return stars;
}

export default function NightSkyBackground({ children }: NightSkyBackgroundProps): JSX.Element {
  const [stars] = useState<Star[]>(() => generateStars(30));
  const forestTranslate = useRef(new Animated.Value(50)).current;
  const starRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(forestTranslate, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(starRotate, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, [forestTranslate, starRotate]);

  const rotateInterpolate = starRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '2deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#001a33', '#003366']} style={styles.gradient}>
        <Animated.View
          style={[
            styles.starContainer,
            {
              transform: [
                { translateY: height }, // Move to bottom
                { rotate: rotateInterpolate },
                { translateY: -height }, // Move back
              ],
            },
          ]}
        >
          {stars.map((star, index) => (
            <View
              key={index}
              style={[
                styles.star,
                {
                  left: star.x,
                  top: star.y,
                },
              ]}
            />
          ))}
        </Animated.View>

        {children}

        <Animated.View
          style={[
            styles.forestContainer,
            {
              transform: [{ translateY: forestTranslate }],
            },
          ]}
        >
          <Image
            source={{
              uri: 'https://via.placeholder.com/400x200/000000/FFFFFF?text=Forest+Silhouette',
            }}
            style={styles.forestImage}
            resizeMode="stretch"
          />
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const { width, height } = Dimensions.get('window');
const STAR_SIZE = 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  starContainer: {
    position: 'absolute',
    width: width,
    height: height,
  },
  star: {
    position: 'absolute',
    width: STAR_SIZE,
    height: STAR_SIZE,
    backgroundColor: '#fff',
    borderRadius: STAR_SIZE / 2,
  },
  forestContainer: {
    width: '100%',
    height: 200,
    overflow: 'hidden',
  },
  forestImage: {
    width: '100%',
    height: '100%',
  },
});