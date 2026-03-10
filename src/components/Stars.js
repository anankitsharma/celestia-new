import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

export default function Stars({ count = 24 }) {
  const stars = useRef(
    Array.from({ length: count }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 0.6 + Math.random() * 1.4,
      opacity: new Animated.Value(0.3 + Math.random() * 0.5),
      duration: 2000 + Math.random() * 4000,
    }))
  ).current;

  useEffect(() => {
    stars.forEach((s) => {
      const twinkle = () => {
        Animated.sequence([
          Animated.timing(s.opacity, { toValue: 1, duration: s.duration / 2, useNativeDriver: true }),
          Animated.timing(s.opacity, { toValue: 0.3, duration: s.duration / 2, useNativeDriver: true }),
        ]).start(twinkle);
      };
      twinkle();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((s, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: s.size / 2,
            backgroundColor: 'white',
            opacity: s.opacity,
          }}
        />
      ))}
    </View>
  );
}
