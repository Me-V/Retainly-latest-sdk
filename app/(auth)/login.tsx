import { router } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MyLogo } from "@/assets/logo";
import { LinearGradient } from "expo-linear-gradient";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";
import { setUser } from "@/store/slices/authSlice";
import { useDispatch } from "react-redux";
import { loginWithGoogle } from "@/services/api.auth";
import { GoogleIcon, LoginIcon } from "@/assets/logo2";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import auth from "@react-native-firebase/auth";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
});

export default function SignInScreen() {
  const dispatch = useDispatch();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const signIn = async () => {
    if (isGoogleLoading) return; // Prevent double taps
    setIsGoogleLoading(true); // 🟢 Start Loading

    try {
      await GoogleSignin.hasPlayServices();
      try {
        await GoogleSignin.signOut();
      } catch (e) {}

      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const { idToken } = response.data;
        const googleUser = response.data.user;

        if (idToken) {
          const googleCredential = auth.GoogleAuthProvider.credential(idToken);
          await auth().signInWithCredential(googleCredential);
          const firebaseToken = await auth().currentUser?.getIdToken();

          if (firebaseToken) {
            const backendResponse = await loginWithGoogle(
              firebaseToken,
              googleUser.email
            );

            console.log("#######backendResponse", backendResponse);

            if (backendResponse.consent_required === true) {
              router.push({
                pathname: "/(main)/consentScreen",
                params: {
                  consentText: backendResponse.consent_text,
                  consentVersion: backendResponse.consent_version,
                  pendingAuth: backendResponse.pending_auth,
                  userData: JSON.stringify(backendResponse.user),
                },
              });
            } else if (backendResponse?.token) {
              dispatch(
                setUser({
                  token: backendResponse.token,
                  userInfo: backendResponse.user,
                })
              );
            } else {
              Alert.alert("Login failed", "Unexpected server response.");
            }
          }
        }
      } else {
        // User cancelled the sign-in flow
        setIsGoogleLoading(false);
      }
    } catch (error: any) {
      if (isErrorWithCode(error)) {
        // Handle specific codes if needed
      } else {
        Alert.alert("Authentication Error", error.message);
      }
    } finally {
      // 🟢 Stop Loading (Note: if you navigate away on success, this might not run on unmounted component, which is fine)
      setIsGoogleLoading(false);
    }
  };

  // Configuration for the glow
  const GLOW_COLOR = "rgba(255, 255, 255, 0.15)";
  const GLOW_SIZE = 12;

  return (
    <LinearGradient
      // Warm tint at top-left (#5A1C44) fading to dark purple
      colors={["#5A1C44", "#3B0A52", "#3A0353"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header - Aligned to mt-12 to match Signup Screen */}
        <View className="mt-12 items-center">
          <View className="mt-14 mb-10 items-center">
            <MyLogo />
            <Text className="text-white text-[15px] font-medium mt-5">
              tagline
            </Text>
          </View>
        </View>

        {/* --- CARD CONTAINER (With Fixed 4-Sided Glow) --- */}
        <LinearGradient
          colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className={`rounded-[24px] border border-white/10 overflow-hidden mx-6 mt-4`}
        >
          <LinearGradient
            colors={[GLOW_COLOR, "transparent"]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: GLOW_SIZE,
            }}
            pointerEvents="none"
          />
          <LinearGradient
            colors={["transparent", GLOW_COLOR]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: GLOW_SIZE,
            }}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[GLOW_COLOR, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: GLOW_SIZE,
            }}
            pointerEvents="none"
          />
          <LinearGradient
            colors={["transparent", GLOW_COLOR]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              right: 0,
              width: GLOW_SIZE,
            }}
            pointerEvents="none"
          />

          {/* --- Card Content --- */}
          <View className="px-8 pt-10 pb-8">
            <View className="items-center mb-10">
              <LoginIcon />
            </View>

            {/* Google Button */}
            <TouchableOpacity
              className="bg-white flex-row justify-center items-center border border-gray-300 rounded-3xl py-4 mb-8 relative"
              onPress={signIn}
              disabled={isGoogleLoading} // Disable button while loading
            >
              <View className="absolute left-5">
                <GoogleIcon />
              </View>

              {isGoogleLoading ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator
                    size="small"
                    color="#374151"
                    className="mr-3"
                  />
                  <Text className="text-gray-700 font-medium text-[16px]">
                    Signing in...
                  </Text>
                </View>
              ) : (
                <Text className="text-gray-700 font-medium text-[16px]">
                  Sign in with Google
                </Text>
              )}
            </TouchableOpacity>

            {/* Email Button */}
            <TouchableOpacity
              onPress={() => router.push("/(auth)/emailLogin")}
              className="flex-row justify-center items-center border border-gray-500 rounded-3xl py-4 mb-8 relative"
            >
              <Feather
                name="mail"
                size={24}
                color="white"
                className="absolute left-5"
              />
              <Text className="text-white font-medium text-[16px]">
                Sign in with Email
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(auth)/mobile-auth", // or whatever your path is
                  params: { mode: "login" }, // 👈 Pass 'login'
                })
              }
              className="bg-[#F59E51] flex-row justify-center items-center rounded-3xl py-4 mb-8 relative"
              style={{
                // iOS Colored Glow
                shadowColor: "#F59E51", // Same color as the button
                shadowOffset: { width: 0, height: 0 }, // Centered bloom
                shadowOpacity: 10, // High opacity for "Neon" effect
                shadowRadius: 20, // Wide spread

                // Android Colored Shadow (API 28+)
                elevation: 20,
              }}
            >
              <FontAwesome
                name="phone"
                size={30}
                color="white"
                className="absolute left-5"
              />
              <Text
                className="text-white font-medium text-[16px]"
                // Optional: Keep the text glow subtle so it doesn't clash
                style={{
                  textShadowColor: "rgba(255, 255, 255, 0.3)",
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 5,
                }}
              >
                Sign in with Mobile
              </Text>
            </TouchableOpacity>

            {/* Footer Text */}
            <TouchableOpacity
              className="rounded-xl py-2"
              onPress={() => router.push("/(auth)/signup-options")}
            >
              <Text className="text-white font-medium text-[16px] text-center">
                Don't have an account?
              </Text>
              <Text className="text-[#F59E51] font-medium text-[16px] text-center mt-1">
                Create One
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ScrollView>
    </LinearGradient>
  );
}
