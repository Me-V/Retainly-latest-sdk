// app/(auth)/parental-consent.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";

import { GlowCard } from "@/components/Glow-Card";
import { acceptConsent } from "@/services/api.auth"; // Import the new API function
import { setUser } from "@/store/slices/authSlice";

const ParentalConsentScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  // 🟢 1. Get Params passed from SignInScreen
  const params = useLocalSearchParams();
  const { consentText, consentVersion, pendingAuth } = params;

  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!isChecked) return;

    setLoading(true);
    try {
      // 🟢 2. Call the Consent API
      const response = await acceptConsent(
        String(consentVersion),
        String(pendingAuth)
      );

      if (response?.token) {
        // 🟢 3. Finalize Login
        dispatch(
          setUser({
            token: response.token,
            userInfo: response.user, // Backend returns fresh user object here
          })
        );

        // Navigate to dashboard
        router.replace("/(main)/dashboard");
      } else {
        Alert.alert("Error", "Failed to verify consent. Please try again.");
      }
    } catch (error: any) {
      Alert.alert("Error", "Something went wrong accepting consent.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Default text fallback if params are missing
  const displayConsentText = consentText
    ? String(consentText)
    : "I give my consent for my child to use the Retainly app and for the processing of my child’s personal data.";

  return (
    <LinearGradient
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
          {/* Header */}
          <View className="items-center mt-6 mb-8">
            <View className="w-16 h-16 rounded-full bg-[#F59E51] items-center justify-center mb-3">
              <Text className="text-white font-bold text-xs">LOGO</Text>
            </View>
            <Text className="text-white/60 text-sm font-medium">
              Empowering Education
            </Text>
          </View>

          {/* Main Content */}
          <View className="px-6">
            <GlowCard className="p-6 pb-10">
              <Text className="text-white text-[22px] font-bold text-center mb-8">
                Parental Consent
              </Text>

              <View className="my-4">
                <Text className="text-gray-300 text-[20px] leading-8">
                  {displayConsentText}
                </Text>
              </View>

              {/* Checkbox */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsChecked(!isChecked)}
                className="flex-row items-start mt-4 mb-8"
              >
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
                <Text className="text-gray-300 text-[14px] flex-1 leading-5">
                  I agree to the terms above and grant consent for my child.
                </Text>
              </TouchableOpacity>

              {/* Button */}
              <TouchableOpacity
                onPress={handleContinue}
                disabled={!isChecked || loading}
                activeOpacity={0.8}
                className={`w-full py-4 rounded-xl items-center border border-white/10 ${
                  isChecked && !loading
                    ? "bg-[#3B0A52]"
                    : "bg-[#3B0A52]/50 opacity-60"
                }`}
                style={{
                  backgroundColor: "#3B0A52",
                  shadowColor: "rgba(255, 255, 255, 0.1)",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: 10,
                  elevation: 5,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text
                    className={`text-[16px] font-semibold ${
                      isChecked ? "text-white" : "text-white/50"
                    }`}
                  >
                    Continue
                  </Text>
                )}
              </TouchableOpacity>
            </GlowCard>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ParentalConsentScreen;
