import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { BackIcon, MyLogo } from "@/assets/logo";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";

export default function CreateNewPasswordScreen() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isNewPasswordHidden, setIsNewPasswordHidden] = useState(true);
  const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = useState(true);

  const handleSave = () => {
    if (!newPassword || !confirmPassword) {
      alert("Please fill in both fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    alert("Password successfully updated!");
  };

  return (
    <LinearGradient
      colors={["#3B0A52", "#180323"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
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
          {/* FIX: Adjusted gradient colors and border for stronger edge glow */}
          <LinearGradient
            // Brighter start (0.3), faster fade to transparent center (0.02)
            colors={["rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 0.8 }} // Shortened end point to concentrate glow at top-left edge
            // Increased border opacity to border-white/30 for sharper edge definition
            className="mx-6 mt-10 mb-10 rounded-[40px] overflow-hidden border border-white/30"
          >
            {/* --- Card Content --- */}
            <View className="px-8 py-12">
              <Text className="text-[24px] font-bold text-center text-white mb-8">
                Create New Password
              </Text>

              {/* New Password Input */}
              <View className="relative mb-6">
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={isNewPasswordHidden}
                  placeholder="Enter New Password"
                  placeholderTextColor="#9CA3AF"
                  className="bg-[#2A1C3E]/60 border border-gray-500/30 rounded-3xl px-5 py-5 text-white text-[16px] pr-14"
                />
                <TouchableOpacity
                  onPress={() => setIsNewPasswordHidden((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-[12px]"
                >
                  {isNewPasswordHidden ? (
                    <AntDesign name="eye" size={24} color="#F98455" />
                  ) : (
                    <Entypo name="eye-with-line" size={24} color="#F98455" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Confirm Password Input */}
              <View className="relative mb-8">
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={isConfirmPasswordHidden}
                  placeholder="Confirm New Password"
                  placeholderTextColor="#9CA3AF"
                  className="bg-[#2A1C3E]/60 border border-gray-500/30 rounded-3xl px-5 py-5 text-white text-[16px] pr-14"
                />
                <TouchableOpacity
                  onPress={() => setIsConfirmPasswordHidden((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-[12px]"
                >
                  {isConfirmPasswordHidden ? (
                    <AntDesign name="eye" size={24} color="#F98455" />
                  ) : (
                    <Entypo name="eye-with-line" size={24} color="#F98455" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSave}
                className="w-full mb-4 shadow-lg"
              >
                <LinearGradient
                  colors={["#FF8A33", "#F59E51"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  className="rounded-3xl py-4"
                >
                  <Text className="text-white text-center font-bold text-[18px]">
                    Save
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
