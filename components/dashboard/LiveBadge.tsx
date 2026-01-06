import React, { useEffect, useRef } from "react";
import { Text, Animated, Easing } from "react-native";

export const LiveBadge = () => {
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        marginLeft: 6,
        marginTop: -15, // 👈 makes it look like superscript
        backgroundColor: "#FF453A",
        paddingHorizontal: 7,
        paddingVertical: 3,
      }}
      className="rounded-full border border-white/10"
    >
      <Text className="text-white text-[10px] font-bold">Live</Text>
    </Animated.View>
  );
};
