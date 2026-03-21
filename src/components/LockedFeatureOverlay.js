import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { T, FONTS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function LockedFeatureOverlay({ title, description, source, compact }) {
    const navigation = useNavigation();

    if (compact) {
        return (
            <TouchableOpacity
                style={styles.compactContainer}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Paywall', { source })}
            >
                <LinearGradient
                    colors={['#1A1228', '#100C1A']}
                    style={styles.compactGradient}
                >
                    <View style={styles.compactRow}>
                        <View style={styles.compactIconCircle}>
                            <Text style={styles.compactIcon}>🔒</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.compactTitle}>{title || 'Go Deeper'}</Text>
                            <Text style={styles.compactDesc} numberOfLines={2}>
                                {description || 'Your full story is waiting — want to see it?'}
                            </Text>
                        </View>
                        <Text style={styles.compactArrow}>›</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.container}>
            {/* If you want a blur effect, use BlurView, but here we'll use a gradient overlay for a premium look */}
            <LinearGradient
                colors={['rgba(250,248,242,0.8)', 'rgba(250,248,242,0.95)', T.cream]}
                style={styles.gradient}
            />

            <View style={styles.content}>
                <View style={styles.iconCircle}>
                    <Text style={styles.icon}>🔒</Text>
                </View>

                <Text style={styles.title}>{title || 'See Your Full Story'}</Text>
                <Text style={styles.description}>
                    {description || 'This is where it gets really personal. Your deeper patterns, your hidden connections — it\'s all here.'}
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Paywall', { source })}
                >
                    <LinearGradient
                        colors={[T.gold, '#8C6C18']}
                        style={styles.buttonGradient}
                    >
                        <Text style={styles.buttonText}>GO DEEPER</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.secondaryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: T.warm,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    icon: {
        fontSize: 28,
    },
    title: {
        fontFamily: FONTS.serifSemiBold,
        fontSize: 22,
        color: T.navy,
        textAlign: 'center',
        marginBottom: 12,
    },
    description: {
        fontFamily: FONTS.sans,
        fontSize: 14,
        color: T.stone,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    button: {
        width: '100%',
        height: 54,
        borderRadius: 27,
        overflow: 'hidden',
        marginBottom: 16,
    },
    buttonGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontFamily: FONTS.sansSemiBold,
        fontSize: 14,
        color: 'white',
        letterSpacing: 1.5,
    },
    secondaryButton: {
        paddingVertical: 8,
    },
    secondaryButtonText: {
        fontFamily: FONTS.sansMedium,
        fontSize: 14,
        color: T.stone,
    },
    // Compact Styles
    compactContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        marginVertical: 4,
    },
    compactGradient: {
        padding: 16,
    },
    compactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    compactIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    compactIcon: {
        fontSize: 16,
    },
    compactTitle: {
        fontFamily: FONTS.serifSemiBold,
        fontSize: 15,
        color: T.cream,
        marginBottom: 2,
    },
    compactDesc: {
        fontFamily: FONTS.sans,
        fontSize: 11,
        color: 'rgba(250,248,242,0.6)',
        lineHeight: 16,
    },
    compactArrow: {
        fontSize: 18,
        color: T.gold,
        marginLeft: 4,
    },
});
