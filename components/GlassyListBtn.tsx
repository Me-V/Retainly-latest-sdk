import React from "react";
import { TouchableOpacity, Text, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface GlassyListBtnProps {
  label: string;
  onPress?: () => void;
  numberOfLines?: number; // 1 for Subjects, 3 for Questions
}

export const GlassyListBtn: React.FC<GlassyListBtnProps> = ({
  label,
  onPress,
  numberOfLines = 1,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="w-full mb-4"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
      }}
    >
      <LinearGradient
        // The standard purple-glass gradient
        colors={["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0.04)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="rounded-xl py-4 items-center justify-center border border-white/10"
        style={{ borderRadius: 16 }}
      >
        <Text
          className="text-white font-semibold text-[15px] leading-snug text-center px-4"
          adjustsFontSizeToFit={numberOfLines === 1} // Only adjust font size for single-line items
          numberOfLines={numberOfLines}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};
