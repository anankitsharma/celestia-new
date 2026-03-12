import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Dimensions,
    Platform, ActivityIndicator, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ArrowRight, Bell, Check, Lock, Sparkles, Star, Unlock, X
} from 'lucide-react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PACKAGE_TYPE } from 'react-native-purchases';
import { useRevenueCat } from '../contexts/RevenueCatContext';
import { T, FONTS } from '../constants/theme';
import { haptic } from '../services/hapticService';
import CelestialSigil from '../components/CelestialSigil';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 800;

const PAYWALL_VARIANTS = {
    oracle: {
        title: "Infinite Oracle",
        subtitle: "Whispers from the Stars",
        iconColor: "#C084FC", // Purple
        primaryBenefit: "Unlimited Talk with Celestia",
        benefits: [
            "Unlimited conversation with your guide",
            "Soul-level clarity for every crossroad",
            "Unlimited talk with your chart",
            "Every secret of the stars, revealed"
        ]
    },
    strategy: {
        title: "Cosmic Strategy",
        subtitle: "Align with the Divine",
        iconColor: T.gold, // Gold
        primaryBenefit: "The Path of Least Resistance",
        benefits: [
            "Full Monthly Roadmaps for your Soul",
            "Sacred Moon Rituals for manifestation",
            "Unlimited Guidance from the Oracle",
            "Master your individual transit cycles"
        ]
    },
    natal: {
        title: "The Deep Dive",
        subtitle: "Unveil Your Hidden Self",
        iconColor: "#34D399", // Green (Celestial Growth)
        primaryBenefit: "Master Your Life Story",
        benefits: [
            "Deep-layer Love & Career analysis",
            "The full map of your planetary soul",
            "Unlimited talk with your chart",
            "Complete clarity on your Life Areas"
        ]
    },
    match: {
        title: "Unlimited Circle",
        subtitle: "Map Your Soul Connections",
        iconColor: "#F472B6", // Pink
        primaryBenefit: "Decode Every Relationship",
        benefits: [
            "Unveil Every Soul in your circle",
            "Uncover hidden chemistry & destiny",
            "Unlimited connection checks",
            "Unlimited relationship talk with AI"
        ]
    },
    reports: {
        title: "The Archive",
        subtitle: "Your Cosmic Library",
        iconColor: "#60A5FA", // Blue
        primaryBenefit: "Starlight in Print",
        benefits: [
            "Unlock every secret in your library",
            "Permanent maps of your Love & Vocation",
            "The complete story of your destiny",
            "Unlimited talk with your chart"
        ]
    },
    default: {
        title: "Celestia Pro",
        subtitle: "Your Soul's Fullest Expression",
        iconColor: T.gold,
        primaryBenefit: "Complete Cosmic Freedom",
        benefits: [
            "Unlimited Conversation with the Oracle",
            "Full Library of Professional Reports",
            "Unlimited Path for every relationship",
            "Ultimate clarity on your Soul's Path"
        ]
    }
};

export default function PaywallScreen({ navigation, route }) {
    const { offerings, purchasePackage, restorePurchases, isLoading: isOfferingsLoading } = useRevenueCat();
    const [selectedPlan, setSelectedPlan] = useState('annual');
    const [showClose, setShowClose] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const insets = useSafeAreaInsets();

    const source = route.params?.source || 'default';
    const reportName = route.params?.reportName;

    const variantKey = source.includes('chat') || source === 'oracle' ? 'oracle' :
        source.includes('match') || source.includes('compatibility') || source === 'match' ? 'match' :
            source.includes('circle') || source === 'partners' ? 'match' :
                source.includes('forecast') || source.includes('ritual') || source.includes('home') || source === 'strategy' ? 'strategy' :
                    source.includes('chart') || source === 'natal' || source === 'drip' ? 'natal' :
                        source.includes('report') ? 'reports' : 'default';

    const baseVariant = PAYWALL_VARIANTS[variantKey] || PAYWALL_VARIANTS.default;
    const activeVariant = { ...baseVariant };

    if (variantKey === 'reports' && reportName) {
        activeVariant.subtitle = `Your ${reportName} is Ready`;
        activeVariant.primaryBenefit = `Hold Your Destiny in Your Hands`;
    }

    if (variantKey === 'match') {
        activeVariant.subtitle = "Your Soul Connection is Ready";
        activeVariant.primaryBenefit = "Unveil the Mastery of Love";
    }

    const scale = useSharedValue(1);

    const packages = offerings?.availablePackages || [];
    const annualPackage = packages.find(p => p.packageType === PACKAGE_TYPE.ANNUAL);
    const monthlyPackage = packages.find(p => p.packageType === PACKAGE_TYPE.MONTHLY);

    const annualPriceStr = annualPackage?.product.priceString || "$59.99";
    const annualPriceVal = annualPackage?.product.price || 59.99;
    const weeklyPrice = (annualPriceVal / 52).toFixed(2);
    const currencySymbol = annualPriceStr?.replace(/[\d.,\s]+/g, "") || "$";
    const monthlyPriceStr = monthlyPackage?.product.priceString || "$9.99";

    useEffect(() => {
        const timer = setTimeout(() => setShowClose(true), 2500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        scale.value = withRepeat(
            withSequence(
                withTiming(1.02, { duration: 1500 }),
                withTiming(1, { duration: 1500 })
            ),
            -1,
            true
        );
    }, []);

    const animatedCtaStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const handlePurchase = async () => {
        setIsLoading(true);
        haptic.medium();
        try {
            const pkgToPurchase = selectedPlan === 'annual' ? annualPackage : monthlyPackage;
            if (!pkgToPurchase) {
                Alert.alert("Store Error", "Unable to find the selected package. Please try again later.");
                return;
            }
            await purchasePackage(pkgToPurchase);
            Alert.alert('Welcome!', 'Your Celestia Pro subscription is now active.', [
                { text: 'Let’s Go', onPress: () => navigation.goBack() }
            ]);
        } catch (e) {
            if (!e.userCancelled) {
                Alert.alert("Purchase Failed", e.message || "Something went wrong.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async () => {
        setIsLoading(true);
        try {
            const customerInfo = await restorePurchases();
            if (customerInfo?.entitlements.active['Celestia Pro']) {
                Alert.alert("Success", "Restored successfully!", [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert("Notice", "No active subscriptions found.");
            }
        } catch (e) {
            Alert.alert("Failed", e.message || "Unable to restore purchases.");
        } finally {
            setIsLoading(false);
        }
    };

    const chargeDay = selectedPlan === 'annual' ? 7 : 3;

    return (
        <View style={styles.container}>
            <LinearGradient colors={[T.navy, '#0F0E22', '#08081A']} style={StyleSheet.absoluteFillObject} />

            <View style={[styles.main, { paddingTop: insets.top, paddingBottom: insets.bottom + 10 }]}>
                {/* Close Button Header */}
                <View style={styles.topBar}>
                    {showClose ? (
                        <Animated.View entering={FadeIn}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                                <X size={20} color="rgba(255,255,255,0.4)" />
                            </TouchableOpacity>
                        </Animated.View>
                    ) : <View style={{ height: 36 }} />}
                </View>

                {/* Hero Section */}
                <Animated.View entering={FadeInDown.springify()} style={styles.heroArea}>
                    <CelestialSigil size={isSmallScreen ? 100 : 130} color={activeVariant.iconColor} />
                    <Text style={styles.title}>{activeVariant.title}</Text>
                    <Text style={styles.subtitle}>{activeVariant.subtitle}</Text>
                </Animated.View>

                {/* Benefits / Content Area */}
                <View style={styles.contentArea}>
                    <Animated.View entering={FadeInDown.delay(100)} style={styles.benefitsList}>
                        {activeVariant.benefits.map((benefit, index) => (
                            <View key={index} style={styles.benefitRow}>
                                <View style={styles.checkInner}>
                                    <Check size={10} color={T.navy} strokeWidth={4} />
                                </View>
                                <Text style={styles.benefitText}>{benefit}</Text>
                            </View>
                        ))}
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(200)} style={styles.pricingSection}>
                        {/* Annual */}
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => { haptic.light(); setSelectedPlan('annual'); }}
                            style={[styles.planCard, selectedPlan === 'annual' && styles.planCardActive]}
                        >
                            {selectedPlan === 'annual' && <View style={styles.bestValueTag}><Text style={styles.bestValueText}>SAVE 50%</Text></View>}
                            <View style={styles.planInner}>
                                <View style={styles.radioOuter}><View style={[styles.radioInner, { opacity: selectedPlan === 'annual' ? 1 : 0 }]} /></View>
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <View style={styles.planTitleRow}>
                                        <Text style={[styles.planName, selectedPlan === 'annual' && { color: T.gold }]}>Yearly Access</Text>
                                        <Text style={styles.planPrice}>{annualPriceStr}</Text>
                                    </View>
                                    <Text style={styles.planSub}>Just {currencySymbol}{weeklyPrice} / week • 7-Day Free Trial</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Monthly */}
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => { haptic.light(); setSelectedPlan('monthly'); }}
                            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardActive, { marginTop: 10 }]}
                        >
                            <View style={styles.planInner}>
                                <View style={styles.radioOuter}><View style={[styles.radioInner, { opacity: selectedPlan === 'monthly' ? 1 : 0 }]} /></View>
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <View style={styles.planTitleRow}>
                                        <Text style={[styles.planName, selectedPlan === 'monthly' && { color: T.gold }]}>Monthly Access</Text>
                                        <Text style={styles.planPrice}>{monthlyPriceStr}</Text>
                                    </View>
                                    <Text style={styles.planSub}>Cancel anytime • 3-Day Free Trial</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* Footer / CTA Area */}
                <View style={styles.footerArea}>
                    <Animated.View entering={FadeInDown.delay(300)} style={styles.timeline}>
                        <View style={styles.timelineLine} />
                        <View style={styles.timelineStep}>
                            <View style={styles.tDotActive}><Unlock size={10} color={T.navy} /></View>
                            <Text style={styles.tTitle}>Today</Text>
                            <Text style={styles.tDesc}>Unlock</Text>
                        </View>
                        <View style={styles.timelineStep}>
                            <View style={styles.tDotOutline}><Bell size={10} color="rgba(255,255,255,0.4)" /></View>
                            <Text style={styles.tTitle}>Day {chargeDay - 2}</Text>
                            <Text style={styles.tDesc}>Reminder</Text>
                        </View>
                        <View style={styles.timelineStep}>
                            <View style={styles.tDotOutline}><Star size={10} color="rgba(255,255,255,0.4)" /></View>
                            <Text style={styles.tTitle}>Day {chargeDay}</Text>
                            <Text style={styles.tDesc}>Trial Ends</Text>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400)} style={{ width: '100%', marginBottom: 12 }}>
                        <TouchableOpacity onPress={handlePurchase} disabled={isLoading} activeOpacity={0.8}>
                            <Animated.View style={[styles.ctaButton, animatedCtaStyle]}>
                                <LinearGradient colors={[T.gold, '#D4AF37', '#B8860B']} style={styles.ctaGradient}>
                                    {isLoading ? <ActivityIndicator color={T.navy} /> : (
                                        <View style={styles.ctaRow}>
                                            <Text style={styles.ctaText}>
                                                Start {chargeDay}-Day Free Trial
                                            </Text>
                                            <ArrowRight color={T.navy} size={18} strokeWidth={3} />
                                        </View>
                                    )}
                                </LinearGradient>
                            </Animated.View>
                        </TouchableOpacity>
                    </Animated.View>

                    <View style={styles.trustInfo}>
                        <View style={styles.secureRow}><Lock size={10} color="rgba(255,255,255,0.3)" /><Text style={styles.secureText}>CANCEL ANYTIME IN SETTINGS.</Text></View>
                        <View style={styles.legalLinks}>
                            <TouchableOpacity onPress={handleRestore}><Text style={styles.legalText}>Restore</Text></TouchableOpacity>
                            <Text style={styles.legalDivider}>•</Text>
                            <TouchableOpacity><Text style={styles.legalText}>Terms</Text></TouchableOpacity>
                            <Text style={styles.legalDivider}>•</Text>
                            <TouchableOpacity><Text style={styles.legalText}>Privacy</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: T.navy },
    main: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-between' },
    topBar: { height: 44, justifyContent: 'center', alignItems: 'flex-end' },
    closeButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20 },

    heroArea: { alignItems: 'center', marginTop: -10 },
    title: { fontSize: isSmallScreen ? 28 : 34, fontFamily: FONTS.serifSemiBold, color: 'white', marginTop: 16, textAlign: 'center' },
    subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: FONTS.sansMedium, marginTop: 4, letterSpacing: 0.5, textAlign: 'center' },

    contentArea: { flexShrink: 1, marginVertical: isSmallScreen ? 12 : 24 },
    benefitsList: { gap: 10, alignSelf: 'center', marginBottom: isSmallScreen ? 20 : 30 },
    benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    checkInner: { width: 18, height: 18, borderRadius: 9, backgroundColor: T.gold, alignItems: 'center', justifyContent: 'center' },
    benefitText: { fontSize: 15, color: 'rgba(255,255,255,0.85)', fontFamily: FONTS.sansMedium },

    pricingSection: { width: '100%' },
    planCard: { backgroundColor: 'rgba(255, 255, 255, 0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 14 },
    planCardActive: { backgroundColor: 'rgba(200, 168, 75, 0.05)', borderColor: T.gold },
    planInner: { flexDirection: 'row', alignItems: 'center' },
    radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    radioInner: { width: 11, height: 11, borderRadius: 5.5, backgroundColor: T.gold },
    bestValueTag: { position: 'absolute', top: -10, right: 16, backgroundColor: T.gold, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    bestValueText: { fontSize: 9, fontFamily: FONTS.sansBold, color: T.navy },
    planTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    planName: { fontSize: 16, fontFamily: FONTS.sansBold, color: 'white' },
    planPrice: { fontSize: 17, fontFamily: FONTS.sansBold, color: 'white' },
    planSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: FONTS.sans, marginTop: 2 },

    footerArea: { width: '100%', alignItems: 'center' },
    timeline: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
    timelineLine: { position: 'absolute', top: 11, left: 35, right: 35, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
    timelineStep: { alignItems: 'center', width: 80 },
    tDotActive: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    tDotOutline: { width: 22, height: 22, borderRadius: 11, backgroundColor: T.navy, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    tTitle: { color: 'white', fontSize: 11, fontFamily: FONTS.sansBold },
    tDesc: { color: 'rgba(255,255,255,0.35)', fontSize: 10, textAlign: 'center' },

    ctaButton: { width: '100%', borderRadius: 28, overflow: 'hidden' },
    ctaGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
    ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    ctaText: { color: T.navy, fontSize: 16, fontFamily: FONTS.sansBold },

    trustInfo: { alignItems: 'center', gap: 10 },
    secureRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    secureText: { fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: FONTS.sansBold, letterSpacing: 0.5 },
    legalLinks: { flexDirection: 'row', gap: 12, opacity: 0.5 },
    legalText: { fontSize: 11, color: 'white', fontFamily: FONTS.sans },
    legalDivider: { fontSize: 11, color: 'white' },
});

