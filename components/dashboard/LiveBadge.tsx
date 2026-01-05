import React, { useEffect, useRef } from "react";
import { Text, Animated, Easing } from "react-native";

export const LiveBadge = () => {
  // 1. Initialize Animated Value
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 2. Define Animation Loop
    const pulse = Animated.loop(
      Animated.sequence([
        // Grow to 1.15x
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true, // Hardware acceleration
        }),
        // Shrink back to 1x
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // 3. Start
    pulse.start();

    // Cleanup on unmount
    return () => pulse.stop();
  }, [scaleAnim]);

  return (
    <Animated.View
      className="absolute -top-3 -right-12 bg-[#FF453A] px-2 py-[2px] rounded-full border border-white/10"
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Text className="text-white text-[11px] font-bold tracking-wide">
        Live
      </Text>
    </Animated.View>
  );
};
