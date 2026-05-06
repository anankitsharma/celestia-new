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
import { useAuth } from '../contexts/AuthContext';
import { T, FONTS } from '../constants/theme';
import { haptic } from '../services/hapticService';
import CelestialSigil from '../components/CelestialSigil';
import { useAnalytics, EVENTS } from '../services/analytics';

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
    const { user } = useAuth();
    const { capture } = useAnalytics();
    const [selectedPlan, setSelectedPlan] = useState('annual');
    const [showClose, setShowClose] = useState(true); // No dark patterns — close button visible immediately
    const [isLoading, setIsLoading] = useState(false);
    const insets = useSafeAreaInsets();

    const source = route.params?.source || 'default';
    const reportName = route.params?.reportName;

    const variantKey = source.includes('chat') || source === 'oracle' || source === 'chat_limit' || source === 'chat_soft' ? 'oracle' :
        source.includes('match') || source.includes('compatibility') || source === 'match' || source === 'match_curiosity' ? 'match' :
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

    const annualPriceStr = annualPackage?.product.priceString || "$49.99";
    const annualPriceVal = annualPackage?.product.price || 49.99;
    const weeklyPrice = (annualPriceVal / 52).toFixed(2);
    const currencySymbol = annualPriceStr?.replace(/[\d.,\s]+/g, "") || "$";
    const monthlyPriceStr = monthlyPackage?.product.priceString || "$6.99";

    useEffect(() => {
        capture(EVENTS.PAYWALL_VIEWED, { source, variant: variantKey });
        // Close button shown immediately — no dark patterns
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
        capture(EVENTS.PURCHASE_TAPPED, { plan: selectedPlan, source, variant: variantKey });
        try {
            const pkgToPurchase = selectedPlan === 'annual' ? annualPackage : monthlyPackage;
            if (!pkgToPurchase) {
                Alert.alert("Hmm, something's off", "We couldn't load the plans right now. Give it a second and try again?");
                return;
            }
            await purchasePackage(pkgToPurchase);
            capture(EVENTS.PURCHASE_COMPLETED, { plan: selectedPlan, source, variant: variantKey });
            // Replace native Alert with WelcomeToProScreen — gives the user
            // a one-tap path INTO the 3 highest-value Pro features instead of
            // dropping them back where they came from. Closes the
            // expectation/delivery gap that drives subscriber churn.
            // firstTime=true preserves the existing protect-your-subscription
            // auth flow; WelcomeToProScreen routes through Auth on card-tap.
            navigation.replace('WelcomeToPro', { firstTime: !user });
        } catch (e) {
            if (e.userCancelled) {
                capture(EVENTS.PURCHASE_CANCELLED, { plan: selectedPlan, source });
            } else {
                capture(EVENTS.PURCHASE_FAILED, { plan: selectedPlan, source, error: e.message });
                Alert.alert("Oops", e.message || "Something went wrong.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async () => {
        setIsLoading(true);
        capture(EVENTS.RESTORE_TAPPED);
        try {
            const customerInfo = await restorePurchases();
            if (customerInfo?.entitlements.active['Celestia Pro']) {
                capture(EVENTS.RESTORE_COMPLETED, { success: true });
                Alert.alert("Success", "Restored successfully!", [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                capture(EVENTS.RESTORE_COMPLETED, { success: false });
                Alert.alert("Notice", "Looks like you don't have an active plan yet.");
            }
        } catch (e) {
            Alert.alert("Couldn't Restore", e.message || "Check your connection and try again. If you're stuck, reach out to us.");
        } finally {
            setIsLoading(false);
        }
    };

    const chargeDay = selectedPlan === 'annual' ? 7 : 3;

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#5A2840', T.navy, '#1F0F18']} style={StyleSheet.absoluteFillObject} />

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
                    <Text style={styles.unityLine}>Made for the questioners, not the believers.</Text>
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
                            onPress={() => { haptic.light(); setSelectedPlan('annual'); capture(EVENTS.PAYWALL_PLAN_SWITCHED, { plan: 'annual', source }); }}
                            style={[styles.planCard, selectedPlan === 'annual' && styles.planCardActive]}
                        >
                            {selectedPlan === 'annual' && <View style={styles.bestValueTag}><Text style={styles.bestValueText}>SAVE 50% · +4 DAYS</Text></View>}
                            <View style={styles.planInner}>
                                <View style={styles.radioOuter}><View style={[styles.radioInner, { opacity: selectedPlan === 'annual' ? 1 : 0 }]} /></View>
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <Text style={styles.trialKickerAnnual}>7-DAY FREE TRIAL</Text>
                                    <View style={styles.planTitleRow}>
                                        <Text style={[styles.planName, selectedPlan === 'annual' && { color: T.gold }]}>Yearly Access</Text>
                                        <Text style={styles.planPrice}>{annualPriceStr}</Text>
                                    </View>
                                    <Text style={styles.planSub}>Just {currencySymbol}{weeklyPrice} / week</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Monthly */}
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => { haptic.light(); setSelectedPlan('monthly'); capture(EVENTS.PAYWALL_PLAN_SWITCHED, { plan: 'monthly', source }); }}
                            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardActive, { marginTop: 10 }]}
                        >
                            <View style={styles.planInner}>
                                <View style={styles.radioOuter}><View style={[styles.radioInner, { opacity: selectedPlan === 'monthly' ? 1 : 0 }]} /></View>
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <Text style={styles.trialKickerMonthly}>3-day free trial</Text>
                                    <View style={styles.planTitleRow}>
                                        <Text style={[styles.planName, selectedPlan === 'monthly' && { color: T.gold }]}>Monthly Access</Text>
                                        <Text style={styles.planPrice}>{monthlyPriceStr}</Text>
                                    </View>
                                    <Text style={styles.planSub}>Cancel anytime</Text>
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
                                            <View style={styles.ctaTextStack}>
                                                <Text style={styles.ctaText}>
                                                    Start {chargeDay}-Day Free Trial
                                                </Text>
                                                <Text style={styles.ctaSubtext}>
                                                    then {selectedPlan === 'annual' ? `${annualPriceStr} / year` : `${monthlyPriceStr} / month`}
                                                </Text>
                                            </View>
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
    unityLine: { fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: FONTS.serif, fontStyle: 'italic', marginTop: 8, textAlign: 'center' },

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
    bestValueText: { fontSize: 9, fontFamily: FONTS.sansBold, color: T.navy, letterSpacing: 0.5 },
    trialKickerAnnual: { fontSize: 10, fontFamily: FONTS.sansBold, color: T.gold, letterSpacing: 1.6, marginBottom: 3 },
    trialKickerMonthly: { fontSize: 10, fontFamily: FONTS.sans, color: 'rgba(255,255,255,0.45)', marginBottom: 3 },
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
    ctaGradient: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
    ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    ctaTextStack: { alignItems: 'center' },
    ctaSubtext: { color: 'rgba(8, 8, 26, 0.7)', fontSize: 11, fontFamily: FONTS.sansMedium, marginTop: 1 },
    ctaText: { color: T.navy, fontSize: 16, fontFamily: FONTS.sansBold },

    trustInfo: { alignItems: 'center', gap: 10 },
    secureRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    secureText: { fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: FONTS.sansBold, letterSpacing: 0.5 },
    legalLinks: { flexDirection: 'row', gap: 12, opacity: 0.5 },
    legalText: { fontSize: 11, color: 'white', fontFamily: FONTS.sans },
    legalDivider: { fontSize: 11, color: 'white' },
});

