import { router } from "expo-router";
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { MyLogo } from "@/assets/logo";
// import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { LinearGradient } from "expo-linear-gradient";
import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";
import { setUser } from "@/store/slices/authSlice";
import { useDispatch } from "react-redux";
import { loginWithGoogle } from "@/services/api.auth";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
});

export default function SignInScreen() {
  // const { promptAsync } = useGoogleAuth();

  const dispatch = useDispatch();

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const idToken = response.data.idToken;
        console.log("~Vasu Sharma :- Google Token", idToken);
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

  return (
    <LinearGradient
      colors={["#FFFFFF", "#E4C7A6"]}
      start={{ x: 0, y: 0 }} // top
      end={{ x: 0, y: 1 }} // bottom
      className="flex-1"
    >
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="items-center mt-16 mb-12">
          <MyLogo />
          <Text className="text-gray-600 text-[15px] font-medium mt-[70px]">
            tagline
          </Text>
        </View>

        {/* Options */}
        <View className="px-8">
          <Text className="text-center text-black text-[24px] mb-16">
            Sign In with
          </Text>

          <TouchableOpacity
            className="bg-[#FFF3C4] flex-row items-center justify-center border border-gray-300 rounded-3xl py-4 mb-4"
            onPress={() => signIn()}
          >
            <Text className="text-gray-700 font-medium text-[16px]">
              Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(auth)/emailLogin")}
            className="bg-[#FFF3C4] flex-row items-center justify-center border border-gray-300 rounded-3xl py-4 mb-4"
          >
            <Text className="text-gray-700 font-medium text-[16px]">Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(auth)/mobile-auth")}
            className="bg-[#FFF3C4] flex-row items-center justify-center border border-gray-300 rounded-3xl py-4 mb-8"
          >
            <Text className="text-gray-700 font-medium text-[16px]">
              Mobile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-xl pt-1 pb-3 mt-40"
            onPress={() => router.push("/(auth)/signup-options")}
          >
            <Text className="text-black font-medium text-[16px] text-center">
              Don't have an account?
            </Text>
            <Text className="text-[#E03636] font-medium text-[16px] text-center">
              Create One
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
