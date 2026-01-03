import React from "react";
import { ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string; // For NativeWind classes
  glowColor?: string; // Optional: Customize the glow color
  style?: ViewStyle;  // Optional: Inline styles
}

export const GlowCard = ({
  children,
  className = "",
  glowColor = "rgba(255, 255, 255, 0.15)", // Default white glow
  style,
}: GlowCardProps) => {
  const GLOW_SIZE = 12;

  return (
    <LinearGradient
      // The background gradient of the card itself
      colors={[glowColor, "rgba(255, 255, 255, 0.05)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={style}
      className={`rounded-[24px] border border-white/10 overflow-hidden ${className}`}
    >
      {/* Top Glow Border */}
      <LinearGradient
        colors={[glowColor, "transparent"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: GLOW_SIZE }}
        pointerEvents="none"
      />
      
      {/* Bottom Glow Border */}
      <LinearGradient
        colors={["transparent", glowColor]}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: GLOW_SIZE }}
        pointerEvents="none"
      />
      
      {/* Left Glow Border */}
      <LinearGradient
        colors={[glowColor, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: GLOW_SIZE }}
        pointerEvents="none"
      />
      
      {/* Right Glow Border */}
      <LinearGradient
        colors={["transparent", glowColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: GLOW_SIZE }}
        pointerEvents="none"
      />

      {/* Card Content */}
      {children}
    </LinearGradient>
  );
};