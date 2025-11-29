import { router } from "expo-router";
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { MyLogo } from "@/assets/logo";
import { LinearGradient } from "expo-linear-gradient";
import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";
import { setUser } from "@/store/slices/authSlice";
import { useDispatch } from "react-redux";
import { loginWithGoogle } from "@/services/api.auth";

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
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const idToken = response.data.idToken;

        if (idToken) {
          // 🔥 Call your Django API with Google ID token
          const backendResponse = await loginWithGoogle(idToken);

          if (backendResponse?.token) {
            // Store the Django token, not Google’s idToken
            console.log(
              "~Vasu Sharma :- Backend Google Token",
              backendResponse
            );
            dispatch(
              setUser({
                token: backendResponse.token, // DRF token
                userInfo: response.data, // optional: Google profile
              })
            );
          } else {
            Alert.alert("Login failed", "Server did not return a token");
          }
        }
      } else {
        console.log("sign in was cancelled by user");
      }
    } catch (error) {
      Alert.alert("Something went wrong");
      console.error(error);
    }
  };

  // Configuration for the glow design
  const GLOW_COLOR = "rgba(255, 255, 255, 0.24)";
  const GLOW_SIZE = 12;

  return (
    <LinearGradient
      colors={["#3B0A52", "#180323"]}
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
          // Brighter start (0.3), faster fade to transparent center (0.02)
          colors={["rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0.02)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 0.8 }} // Shortened end point to concentrate glow at top-left edge
          // Increased border opacity to border-white/30 for sharper edge definition
          className="mx-6 mt-10 mb-10 rounded-[40px] overflow-hidden border border-white/30"
        >
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
              onPress={() => router.push("/(auth)/mobile-auth")}
              className="bg-[#F59E51] flex-row justify-center items-center rounded-3xl py-4 mb-8 relative"
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
