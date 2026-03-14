import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { signUpWithEmail, signInWithEmail, resetPassword } from '../services/supabase/authService';
import { useAuth } from '../contexts/AuthContext';

export default function AuthScreen({ navigation, route }) {
  const { onSignIn } = useAuth();
  const isOnboarding = route.params?.mode === 'onboarding';
  const [mode, setMode] = useState(isOnboarding ? 'signup' : 'signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      let data;
      if (mode === 'signup') {
        data = await signUpWithEmail(email.trim(), password);
        if (data?.user && !data.session) {
          Alert.alert('Check your email', 'We sent you a confirmation link. Please verify your email, then sign in.');
          setMode('signin');
          setLoading(false);
          return;
        }
      } else {
        data = await signInWithEmail(email.trim(), password);
      }

      if (data?.session) {
        await onSignIn(data.session);
        if (isOnboarding) {
          navigation.replace('Main');
        } else {
          navigation.goBack();
        }
      }
    } catch (e) {
      const msg = e?.message || 'Something went wrong. Please try again.';
      Alert.alert(mode === 'signup' ? 'Sign up failed' : 'Sign in failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.cream }}>
      {/* Header */}
      <LinearGradient colors={['#0E0E22', '#1A1060', '#0C2040']} style={s.hero}>
        {isOnboarding ? (
          <TouchableOpacity onPress={() => navigation.replace('Main')} style={s.skipBtn}>
            <Text style={s.skipText}>Skip for now</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backText}>‹</Text>
          </TouchableOpacity>
        )}
        <Text style={s.heroIcon}>☽</Text>
        <Text style={s.heroTitle}>
          {isOnboarding ? 'Save Your Chart' : (mode === 'signup' ? 'Join the Cosmos' : 'Welcome Back')}
        </Text>
        <Text style={s.heroSub}>
          {isOnboarding
            ? "Don't lose your cosmic blueprint.\nCreate a free account to keep your chart safe."
            : mode === 'signup'
              ? 'Create an account to sync your chart across devices'
              : 'Sign in to access your cosmic data'}
        </Text>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={s.form}>
          <Text style={s.fieldLabel}>EMAIL</Text>
          <TextInput
            style={s.input}
            placeholder="your@email.com"
            placeholderTextColor={T.stone}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={s.fieldLabel}>PASSWORD</Text>
          <TextInput
            style={s.input}
            placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
            placeholderTextColor={T.stone}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.6 }]} activeOpacity={0.85} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={s.submitText}>{mode === 'signup' ? 'Create Account' : 'Sign In'}</Text>
            )}
          </TouchableOpacity>

          <View style={s.dividerRow}>
            <View style={s.divider} />
            <Text style={s.dividerText}>OR</Text>
            <View style={s.divider} />
          </View>

          <TouchableOpacity
            style={s.googleBtn}
            activeOpacity={0.85}
            onPress={async () => {
              setLoading(true);
              try {
                const { signInWithGoogle } = require('../services/supabase/authService');
                const data = await signInWithGoogle();
                if (data?.session) {
                  await onSignIn(data.session);
                  if (isOnboarding) {
                    navigation.replace('Main');
                  } else {
                    navigation.goBack();
                  }
                }
              } catch (e) {
                if (e.code !== 'ASYNC_STORAGE_SET_ITEM_ERROR' && e.code !== 'SIGN_IN_CANCELLED') {
                  Alert.alert('Google Sign-in failed', e.message || 'Something went wrong.');
                }
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <Text style={s.googleText}>Continue with Google</Text>
          </TouchableOpacity>

          {mode === 'signin' && (
            <TouchableOpacity style={s.forgotRow} onPress={async () => {
              if (!email.trim()) {
                Alert.alert('Enter your email', 'Type your email above, then tap Forgot Password.');
                return;
              }
              try {
                await resetPassword(email.trim());
                Alert.alert('Check your email', 'We sent a password reset link to ' + email.trim());
              } catch (e) {
                Alert.alert('Error', e?.message || 'Could not send reset email.');
              }
            }}>
              <Text style={s.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={s.switchRow} onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            <Text style={s.switchText}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={s.switchLink}>{mode === 'signin' ? 'Sign Up' : 'Sign In'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 44) + 12, paddingHorizontal: 24, paddingBottom: 32, position: 'relative' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  backText: { fontSize: 22, color: 'white', marginTop: -2 },
  skipBtn: { alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 4, marginBottom: 20 },
  skipText: { fontSize: 13, color: 'rgba(250,248,242,0.4)', fontFamily: FONTS.sansMedium },
  heroIcon: { fontSize: 36, color: T.gold, marginBottom: 12 },
  heroTitle: { fontFamily: FONTS.serif, fontSize: 28, color: T.cream, marginBottom: 8 },
  heroSub: { fontSize: 14, color: 'rgba(250,248,242,0.5)', lineHeight: 20 },

  form: { padding: 24, paddingTop: 28 },
  fieldLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.stone, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'white', borderRadius: 14, padding: 15, fontSize: 15, color: T.navy, borderWidth: 1, borderColor: T.border, fontFamily: FONTS.sansLight },
  submitBtn: { backgroundColor: T.navy, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 28 },
  submitText: { fontSize: 15, fontFamily: FONTS.sansSemiBold, color: T.cream },
  forgotRow: { alignItems: 'center', marginTop: 16, padding: 4 },
  forgotText: { fontSize: 13, color: T.gold, fontFamily: FONTS.sansMedium },
  switchRow: { alignItems: 'center', marginTop: 20, padding: 8 },
  switchText: { fontSize: 14, color: T.stone },
  switchLink: { color: T.gold, fontFamily: FONTS.sansSemiBold },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, height: 1, backgroundColor: T.border },
  dividerText: { marginHorizontal: 12, fontSize: 12, color: T.stone, fontFamily: FONTS.sansMedium },
  googleBtn: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 14, padding: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border },
  googleText: { fontSize: 15, fontFamily: FONTS.sansSemiBold, color: T.navy },
});

