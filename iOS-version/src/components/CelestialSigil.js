import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { G, Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
    useAnimatedProps,
    useSharedValue,
    withRepeat,
    withTiming,
    withSequence,
    Easing
} from 'react-native-reanimated';
import { T } from '../constants/theme';

const AnimatedG = Animated.createAnimatedComponent(G);

export default function CelestialSigil({ size = 100, color = T.gold }) {
    const rotation = useSharedValue(0);
    const counterRotation = useSharedValue(0);
    const pulse = useSharedValue(1);
    const glow = useSharedValue(0.4);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, { duration: 25000, easing: Easing.linear }),
            -1,
            false
        );
        counterRotation.value = withRepeat(
            withTiming(-360, { duration: 20000, easing: Easing.linear }),
            -1,
            false
        );
        pulse.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
                withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );
        glow.value = withRepeat(
            withSequence(
                withTiming(0.8, { duration: 3000 }),
                withTiming(0.4, { duration: 3000 })
            ),
            -1,
            true
        );
    }, []);

    const outerProps = useAnimatedProps(() => ({
        transform: [{ rotate: `${rotation.value}deg` }]
    }));

    const innerProps = useAnimatedProps(() => ({
        transform: [{ rotate: `${counterRotation.value}deg` }]
    }));

    const coreProps = useAnimatedProps(() => ({
        transform: [{ scale: pulse.value }],
        opacity: glow.value
    }));

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size} viewBox="0 0 100 100">
                <Defs>
                    <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={color} stopOpacity="1" />
                        <Stop offset="100%" stopColor={color} stopOpacity="0.2" />
                    </LinearGradient>
                </Defs>

                {/* Outer Ring */}
                <AnimatedG animatedProps={outerProps} origin="50, 50">
                    <Circle
                        cx="50" cy="50" r="45"
                        stroke={color} strokeWidth="0.5"
                        strokeDasharray="2, 5" fill="none"
                        opacity="0.5"
                    />
                    {[0, 90, 180, 270].map(angle => {
                        const rad = (angle * Math.PI) / 180;
                        const x = 50 + 45 * Math.cos(rad);
                        const y = 50 + 45 * Math.sin(rad);
                        return <Circle key={angle} cx={x} cy={y} r="1.5" fill={color} />;
                    })}
                </AnimatedG>

                {/* Middle Ring */}
                <AnimatedG animatedProps={innerProps} origin="50, 50">
                    <Circle
                        cx="50" cy="50" r="32"
                        stroke={color} strokeWidth="0.8"
                        strokeDasharray="10, 8" fill="none"
                        opacity="0.3"
                    />
                </AnimatedG>

                {/* Central Star Core */}
                <AnimatedG animatedProps={coreProps} origin="50, 50">
                    <Circle cx="50" cy="50" r="12" fill={color} opacity="0.15" />
                    <Path
                        d="M50 35 L53 47 L65 47 L55 54 L59 65 L50 58 L41 65 L45 54 L35 47 L47 47 Z"
                        fill={color}
                    />
                    <Path d="M50 20 L50 80" stroke={color} strokeWidth="0.5" opacity="0.4" />
                    <Path d="M20 50 L80 50" stroke={color} strokeWidth="0.5" opacity="0.4" />
                </AnimatedG>

                {/* Fixed markers */}
                <Circle cx="50" cy="5" r="1" fill={color} opacity="0.8" />
                <Circle cx="50" cy="95" r="1" fill={color} opacity="0.8" />
                <Circle cx="5" cy="50" r="1" fill={color} opacity="0.8" />
                <Circle cx="95" cy="50" r="1" fill={color} opacity="0.8" />
            </Svg>
        </View>
    );
}
