import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { BackIcon, ForgotPassIcon } from "@/assets/logo"; // Use a lock/password icon
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
    // TODO: call your reset password API here
    alert("Password successfully updated!");
  };

  return (
    <LinearGradient
      colors={["#FFFFFF", "#E4C7A6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1 px-6"
    >
      {/* Back Button */}
      <View className="ml-1 mt-4">
        <TouchableOpacity onPress={() => router.back()}>
          <BackIcon />
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View className="flex-row justify-between items-center mt-20 mx-3">
        <View>
          <Text className="text-black text-[24px] font-bold">Create New</Text>
          <Text className="text-black text-[24px] font-bold">Password</Text>
        </View>
        <View>
          <ForgotPassIcon />
        </View>
      </View>

      {/* Form Card */}
      <View className="bg-[#FEFCF34D] rounded-2xl px-6 py-8 mt-10">
        <Text className="text-black text-lg font-semibold mb-2 text-center">
          Enter New Password
        </Text>
        <View className="relative">
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={isNewPasswordHidden}
            className="border border-gray-300 rounded-full px-4 py-3 mb-6 bg-white text-gray-700 pr-16" // Add right padding for toggle
          />
          <TouchableOpacity
            onPress={() => setIsNewPasswordHidden((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-6"
          >
            <Text className="text-orange-500 font-semibold">
              {isNewPasswordHidden ? (
                <AntDesign name="eye" size={24} color="#F98455" />
              ) : (
                <Entypo name="eye-with-line" size={24} color="#F98455" />
              )}
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-black text-lg font-semibold mb-2 text-center">
          Confirm Password
        </Text>
        <View className="relative">
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={isNewPasswordHidden}
            className="border border-gray-300 rounded-full px-4 py-3 mb-6 bg-white text-gray-700 pr-16" // Add right padding for toggle
          />
          <TouchableOpacity
            onPress={() => setIsNewPasswordHidden((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-6"
          >
            <Text className="text-orange-500 font-semibold">
              {isNewPasswordHidden ? (
                <AntDesign name="eye" size={24} color="#F98455" />
              ) : (
                <Entypo name="eye-with-line" size={24} color="#F98455" />
              )}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          className="bg-orange-500 rounded-full py-4 mt-2 shadow-md"
        >
          <Text className="text-white text-center font-semibold text-lg">
            Save
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
