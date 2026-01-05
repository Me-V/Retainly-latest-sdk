import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons"; // For the checkbox icon
import { GlowCard } from "@/components/Glow-Card"; // Adjust path to where you saved your component

const ParentalConsentScreen = () => {
  const router = useRouter();
  const [isChecked, setIsChecked] = useState(false);

  const handleContinue = () => {
    if (isChecked) {
      // Navigate to the next screen (e.g., dashboard or onboarding)
      router.push("/(main)/dashboard");
    }
  };

  return (
    <LinearGradient
      // Warm tint at top-left (#5A1C44) fading to dark purple
      colors={["#5A1C44", "#3B0A52", "#3A0353"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
          {/* 1. Header Section (Logo + Tagline) */}
          <View className="items-center mt-6 mb-8">
            {/* Logo Placeholder */}
            <View className="w-16 h-16 rounded-full bg-[#F59E51] items-center justify-center mb-3">
              <Text className="text-white font-bold text-xs">LOGO</Text>
            </View>
            <Text className="text-white/60 text-sm font-medium">tagline</Text>
          </View>

          {/* 2. Main Content Card */}
          <View className="px-6">
            <GlowCard className="p-6 pb-10">
              {/* Title */}
              <Text className="text-white text-[22px] font-bold text-center mb-8">
                Parental Consent
              </Text>

              {/* Text Body */}
              <View className="space-y-6">
                <Text className="text-gray-300 text-[16px] leading-6">
                  This app is an AI-powered tutor for students studying in
                  Classes 6 to 12.
                </Text>

                <Text className="text-gray-300 text-[16px] leading-6 mb-5">
                  By continuing, I confirm that I am the parent or legal
                  guardian of the student and I give my consent for my child to
                  use the RetAInly app for learning and academic support.
                </Text>

                <Text className="text-gray-300 text-[16px] leading-6 mb-8">
                  I understand that the app uses artificial intelligence and
                  that my child’s information may be collected and processed
                  only for educational purposes, in accordance with applicable
                  Indian laws and RetAInly’s Privacy Policy.
                </Text>
              </View>

              {/* Checkbox Section */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsChecked(!isChecked)}
                className="flex-row items-start mt-4 mb-8"
              >
                {/* Custom Checkbox */}
                <View
                  className={`w-6 h-6 rounded-md border mr-4 items-center justify-center mt-0.5 ${
                    isChecked
                      ? "bg-[#F59E51] border-[#F59E51]"
                      : "bg-transparent border-white/40"
                  }`}
                >
                  {isChecked && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>

                {/* Consent Label */}
                <Text className="text-gray-300 text-[14px] flex-1 leading-5">
                  I give my consent for my child to use this app and for the
                  processing of my child’s personal data for providing services
                  of the application RetAInly.
                </Text>
              </TouchableOpacity>

              {/* Continue Button */}
              <TouchableOpacity
                onPress={handleContinue}
                disabled={!isChecked}
                activeOpacity={0.8}
                className={`w-full py-4 rounded-xl items-center border border-white/10 ${
                  isChecked
                    ? "bg-[#3B0A52]" // Active state (dark purple button)
                    : "bg-[#3B0A52]/50 opacity-60" // Disabled state
                }`}
                // Using a shadow/glow style for the button to match screenshot
                style={{
                  backgroundColor: "#3B0A52", // Inner dark fill
                  shadowColor: "rgba(255, 255, 255, 0.1)",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: 10,
                  elevation: 5,
                }}
              >
                <Text
                  className={`text-[16px] font-semibold ${
                    isChecked ? "text-white" : "text-white/50"
                  }`}
                >
                  Continue
                </Text>
              </TouchableOpacity>
            </GlowCard>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ParentalConsentScreen;
