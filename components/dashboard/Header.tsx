import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

type Props = {
  displayName: string;
  healthBalance: number | string;
};

const Header: React.FC<Props> = ({ displayName, healthBalance }) => {
  return (
    <View className="pt-2 pb-4 flex-row items-center justify-between my-2 px-6">
      {/* Left Side */}
      <View className="flex-row items-center flex-1 ml-2">
        <Text className="text-[18px] font-bold text-white">
          Hello,{" "}
          <Text className="text-[#FF8D28]">
            {displayName || "Username"}
          </Text>
        </Text>
      </View>

      {/* Right Side */}
      <View className="flex-row items-center gap-4">
        <TouchableOpacity
          onPress={() => router.push("/(main)/healthpoint-history2")}
          className="flex-row items-center"
        >
          <MaterialCommunityIcons
            name="heart-pulse"
            size={20}
            color="#EF4444"
          />
          <Text className="text-white font-bold text-[16px] ml-1.5">
            {healthBalance}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Ionicons name="notifications" size={22} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(main)/profile")}>
          <View className="w-9 h-9 rounded-full bg-[#F59E51] items-center justify-center border-2 border-[#3B0A52]">
            <Ionicons name="person" size={18} color="white" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;