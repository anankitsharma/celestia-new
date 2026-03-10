import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Share, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system/next';
import { T, FONTS } from '../constants/theme';

// Base wrapper for shareable card captures
export function useShareCard() {
  const cardRef = useRef();

  const captureAndShare = useCallback(async (fallbackText = '') => {
    try {
      if (!cardRef.current) {
        // Fallback to text share
        await Share.share({ message: fallbackText });
        return;
      }

      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share from Celestia',
        });
      } else {
        await Share.share({ message: fallbackText });
      }
    } catch (e) {
      // Fallback to text
      if (fallbackText) {
        try { await Share.share({ message: fallbackText }); } catch {}
      }
    }
  }, []);

  return { cardRef, captureAndShare };
}

// Watermark footer for all share cards
export function ShareWatermark() {
  return (
    <View style={ws.wrap}>
      <Text style={ws.text}>✦ Celestia</Text>
      <Text style={ws.sub}>Discover your cosmic blueprint</Text>
    </View>
  );
}

const ws = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 16, paddingBottom: 8 },
  text: { fontFamily: FONTS.serif, fontSize: 14, color: 'rgba(200,168,75,0.7)' },
  sub: { fontSize: 9, color: 'rgba(250,248,242,0.3)', marginTop: 3 },
});
