// app/(auth)/verify-email.tsx
import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, router } from "expo-router";
import { getAuth } from "firebase/auth";
import { useDispatch } from "react-redux";
import { signupWithEmailPassword } from "@/services/api.auth";
import { setUser } from "@/store/slices/authSlice";
import { BackIcon, MyLogo } from "@/assets/logo";
import Feather from "@expo/vector-icons/Feather";

export default function VerifyEmailScreen() {
  const { targetEmail } = useLocalSearchParams<{ targetEmail?: string }>();
  const dispatch = useDispatch();
  const [loading, setLoading] = React.useState(false);
  const auth = getAuth();

  // Configuration for the glow design
  const GLOW_COLOR = "rgba(255, 255, 255, 0.24)";
  const GLOW_SIZE = 12;

  const onContinue = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No Firebase user.");
      await user.reload();
      if (!user.emailVerified) {
        throw new Error("Email not verified yet. Open the link in your inbox.");
      }
      const idToken = await user.getIdToken(true);
      const res = await signupWithEmailPassword(user.email!, "ignored", idToken);
      if (!res?.token) throw new Error("No token returned by server.");
      dispatch(setUser({ token: res.token, userInfo: { email: user.email } }));
      router.replace("/(main)/profile");
    } catch (e: any) {
      alert(e?.response?.data?.detail || e?.message || "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#3B0A52", "#180323"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Uniform with other screens (mt-12) */}
        <View className="mt-12 items-center relative z-10">
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute left-6"
          >
            <BackIcon color="white" />
          </TouchableOpacity>

          <View className="mt-14 items-center">
            <MyLogo />
            <Text className="text-white text-[15px] font-medium mt-5">
              tagline
            </Text>
          </View>
        </View>

        {/* --- GLOW CARD CONTAINER --- */}
        {/* Uniform Margins: mx-6 */}
        <LinearGradient
          colors={["rgba(255, 255, 255, 0.25)", "rgba(255, 255, 255, 0.05)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mx-6 mt-10 mb-10 rounded-[40px] overflow-hidden border border-gray-500/50"
        >
          {/* Glow Borders */}
          <LinearGradient
            colors={[GLOW_COLOR, "transparent"]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, height: GLOW_SIZE, zIndex: 1 }}
            pointerEvents="none"
          />
          <LinearGradient
            colors={["transparent", GLOW_COLOR]}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: GLOW_SIZE, zIndex: 1 }}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[GLOW_COLOR, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: GLOW_SIZE, zIndex: 1 }}
            pointerEvents="none"
          />
          <LinearGradient
            colors={["transparent", GLOW_COLOR]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: GLOW_SIZE, zIndex: 1 }}
            pointerEvents="none"
          />

          {/* --- Card Content --- */}
          {/* Increased vertical padding (py-14) to match the visual height of the "Box" in Figma */}
          <View className="px-8 py-14 items-center">

            {/* Mail Icon */}
            <View className="mb-8">
              <Feather name="mail" size={64} color="white" />
            </View>

            {/* Main Text */}
            <Text className="text-[22px] font-bold text-center text-white mb-2 leading-8">
              A verification link was
            </Text>
            <Text className="text-[22px] font-bold text-center text-white mb-6 leading-8">
              sent to <Text className="text-[#F59E51]">{targetEmail || "xyz@email.com"}</Text>
            </Text>

            {/* Subtitle */}
            <Text className="text-[14px] text-gray-300 text-center mb-10 px-4 leading-5">
              Check your inbox and verify your email, then tap "Continue".
            </Text>

            {/* Continue Button - Uniform Orange Gradient */}
            <TouchableOpacity
              onPress={onContinue}
              disabled={loading}
              className="w-full mb-6 shadow-lg"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              <LinearGradient
                colors={["#FF8A33", "#F59E51"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                className="rounded-lg py-4"
                style={{ borderRadius: 24 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-center font-bold text-[18px]">
                    Continue
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Resend Code */}
            <TouchableOpacity
              onPress={() => console.log("Resend code logic")}
            >
              <Text className="text-white font-medium text-[16px]">
                Resend Code
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ScrollView>
    </LinearGradient>
  );
}