import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface GlassyListBtnProps {
  label: string;
  onPress?: () => void;
  numberOfLines?: number; // 1 for Subjects, 3 for Questions
  rightIcon?: React.ReactNode;
}

export const GlassyListBtn: React.FC<GlassyListBtnProps> = ({
  label,
  onPress,
  numberOfLines = 1,
  rightIcon, // 🟢 1. Destructure rightIcon here
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
        // 🟢 2. Changed to flex-row and justify-between, moved padding to the container
        className="flex-row items-center justify-between rounded-xl py-4 px-5 border border-white/10"
        style={{ borderRadius: 16 }}
      >
        <Text
          // 🟢 3. Added flex-1 to prevent overlap. Added conditional text-center.
          className={`text-white font-semibold text-[15px] leading-snug flex-1 ${
            !rightIcon ? "text-center" : "pr-2"
          }`}
          adjustsFontSizeToFit={numberOfLines === 1} // Only adjust font size for single-line items
          numberOfLines={numberOfLines}
          ellipsizeMode="tail"
        >
          {label}
        </Text>

        {/* 🟢 4. Render the icon cleanly on the right without getting squished */}
        {rightIcon && (
          <View className="items-center justify-center flex-shrink-0 ml-2">
            {rightIcon}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};
