import { router } from "expo-router";
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { MyLogo } from "@/assets/logo";
import { LinearGradient } from "expo-linear-gradient";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { setUser } from "@/store/slices/authSlice";
import { useDispatch } from "react-redux";
import { loginWithGoogle } from "@/services/api.auth";
import auth from "@react-native-firebase/auth";

// Added these imports for the UI design
import { GoogleIcon, SignUpIcon } from "@/assets/logo2";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
});

export default function SignInScreen() {
  const dispatch = useDispatch();

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();

      try {
        await GoogleSignin.signOut();
      } catch (error) {
        // It's okay if this fails (e.g., if already signed out), just proceed.
        console.log("Error signing out (safe to ignore):", error);
      }

      // 🟢 2. GET GOOGLE TOKEN
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const { idToken } = response.data;
        const user = response.data.user;

        console.log("🔹 Google ID Token:", idToken ? "Success" : "Missing");

        if (idToken) {
          // 🟢 3. EXCHANGE TOKENS: Google -> Firebase
          // Create a Firebase credential with the Google token
          const googleCredential = auth.GoogleAuthProvider.credential(idToken);

          // Sign-in the user with the credential
          await auth().signInWithCredential(googleCredential);

          // 🟢 4. GET THE REAL FIREBASE TOKEN
          // This is what your backend actually wants
          const firebaseToken = await auth().currentUser?.getIdToken();

          console.log(
            "🔥 Firebase Token:",
            firebaseToken ? "Ready to send" : "Missing"
          );

          if (firebaseToken) {
            // 🟢 5. SEND FIREBASE TOKEN TO BACKEND
            const backendResponse = await loginWithGoogle(
              firebaseToken,
              user.email
            );

            if (backendResponse?.token) {
              console.log("✅ Backend Login Success:", backendResponse);
              dispatch(
                setUser({
                  token: backendResponse.token,
                  userInfo: user,
                })
              );
              // Navigate to dashboard if needed
              // router.replace("/(main)/dashboard");
            } else {
              Alert.alert("Login failed", "Server did not return a token");
            }
          }
        }
      } else {
        console.log("Sign in was cancelled");
      }
    } catch (error: any) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            console.log("User cancelled the login flow");
            break;
          case statusCodes.IN_PROGRESS:
            console.log("Sign in is in progress already");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            console.log("Play services not available or outdated");
            break;
          default:
            console.log("Error:", error.message);
            Alert.alert("Google Sign-In Error", error.message);
        }
      } else {
        // This usually catches Firebase configuration errors (missing google-services.json)
        console.error("Firebase Auth Error:", error);
        Alert.alert("Authentication Error", error.message);
      }
    }
  };

  // Configuration for the glow design
  const GLOW_COLOR = "rgba(255, 255, 255, 0.24)";
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
        {/* Header - Aligned to mt-12 to match other screens */}
        <View className="mt-12 items-center">
          <View className="mt-14 mb-10 items-center">
            <MyLogo />
            <Text className="text-white text-[15px] font-medium mt-5">
              tagline
            </Text>
          </View>
        </View>

        <LinearGradient
          colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mx-6 mb-10 rounded-[24px] border border-white/10 overflow-hidden"
        >
          {/* 1. Top Glow */}
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
          {/* 2. Bottom Glow */}
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
          {/* 3. Left Glow */}
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
          {/* 4. Right Glow */}
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
          {/* CHANGED: px-10 pt-10 -> px-8 py-12 for consistent internal spacing */}
          <View className="px-8 py-12">
            <View className="items-center mb-10">
              <SignUpIcon />
            </View>

            <View className="items-center mb-8">
              <Text className="text-white font-bold text-[24px]">
                Get Started With
              </Text>
            </View>

            {/* Google Button */}
            <TouchableOpacity
              className="bg-white flex-row justify-center items-center border border-gray-300 rounded-3xl py-4 mb-8 relative"
              onPress={() => signIn()}
            >
              <View className="absolute left-5">
                <GoogleIcon />
              </View>
              <Text className="text-gray-700 font-medium text-[16px]">
                Google
              </Text>
            </TouchableOpacity>

            {/* Email Button */}
            <TouchableOpacity
              onPress={() => router.push("/(auth)/email-signup")}
              className="flex-row justify-center items-center border border-gray-500 rounded-3xl py-4 mb-8 relative"
            >
              <Feather
                name="mail"
                size={24}
                color="white"
                className="absolute left-5"
              />
              <Text className="text-white font-medium text-[16px]">Email</Text>
            </TouchableOpacity>

            {/* Mobile Button */}
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(auth)/mobile-auth", // or whatever your path is
                  params: { mode: "signup" }, // 👈 Pass 'signup'
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
              <Text className="text-white font-medium text-[16px]">Mobile</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ScrollView>
    </LinearGradient>
  );
}
