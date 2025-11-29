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
import { GoogleIcon, LoginIcon } from "@/assets/logo2";
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
        console.log("~Vasu Sharma :- Google Token", idToken);
        if (idToken) {
          const backendResponse = await loginWithGoogle(idToken);

          if (backendResponse?.token) {
            console.log(
              "~Vasu Sharma :- Backend Google Token",
              backendResponse
            );
            dispatch(
              setUser({
                token: backendResponse.token,
                userInfo: response.data,
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

  // Configuration for the glow
  const GLOW_COLOR = "rgba(255, 255, 255, 0.24)"; // Adjust opacity for "neon" strength
  const GLOW_SIZE = 12; // How deep the glow goes inside

  return (
    <LinearGradient
      colors={["#3B0A52", "#180323"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="items-center mt-16 mb-12">
          <MyLogo />
          <Text className="text-white text-[15px] font-medium mt-5">
            tagline
          </Text>
        </View>

        {/* --- CARD CONTAINER --- */}
        {/* We now use LinearGradient as the container itself for the background glow */}
        <LinearGradient
          // A nice diagonal fade from semi-transparent white to clearer transparent
          // Feel free to adjust these opacities (e.g., 0.3 to 0.1) for stronger/weaker glow
          colors={["rgba(255, 255, 255, 0.25)", "rgba(255, 255, 255, 0.05)"]}
          start={{ x: 0.5, y: 0 }} // Top-left
          end={{ x: 1, y: 1 }}   // Bottom-right
          className="mx-10 mb-10 rounded-[40px] overflow-hidden border border-gray-400"
        >{/* 1. Top Glow */}
          <LinearGradient
            colors={[GLOW_COLOR, "transparent"]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, height: GLOW_SIZE, zIndex: 1 }}
            pointerEvents="none"
          />
          {/* 2. Bottom Glow */}
          <LinearGradient
            colors={["transparent", GLOW_COLOR]}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: GLOW_SIZE, zIndex: 1 }}
            pointerEvents="none"
          />
          {/* 3. Left Glow */}
          <LinearGradient
            colors={[GLOW_COLOR, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: GLOW_SIZE, zIndex: 1 }}
            pointerEvents="none"
          />
          {/* 4. Right Glow */}
          <LinearGradient
            colors={["transparent", GLOW_COLOR]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: GLOW_SIZE, zIndex: 1 }}
            pointerEvents="none"
          />
          {/* --- Card Content --- */}
          {/* Cleaned up: removed z-10 as it's no longer needed */}
          <View className="px-10 pt-10">
            <View className="items-center my-10">
              <LoginIcon />
            </View>

            <TouchableOpacity
              className="bg-white flex-row justify-center items-center border border-gray-300 rounded-3xl py-4 mb-4 relative"
              onPress={signIn}
            >
              <View className="absolute left-5">
                <GoogleIcon />
              </View>
              <Text className="text-gray-700 font-medium text-[16px]">
                Sign in with Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/emailLogin")}
              className="flex-row justify-center items-center border border-gray-600 rounded-3xl py-4 mb-4 relative"
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
              onPress={() => router.push("/(auth)/mobile-auth")}
              className="bg-[#F59E51] flex-row justify-center items-center rounded-[30px] py-4 mb-8 relative"
            >
              <FontAwesome
                name="phone"
                size={30}
                color="white"
                className="absolute left-5"
              />
              <Text className="text-white font-medium text-[16px]">
                Sign in with Mobile
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="rounded-xl pt-1 pb-3 my-5"
            onPress={() => router.push("/(auth)/signup-options")}
          >
            <Text className="text-white font-medium text-[16px] text-center">
              Don't have an account?
            </Text>
            <Text className="text-[#F59E51] font-medium text-[16px] text-center">
              Create One
            </Text>
          </TouchableOpacity>
        </LinearGradient>


      </ScrollView>
    </LinearGradient>
  );
}