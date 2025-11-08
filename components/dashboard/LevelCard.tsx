import React from "react";
import { View, Text } from "react-native";
import { ProgressBar } from "@/components/dashboard/ProgressBar";

export const LevelCard = () => (
  <View className="px-2 mt-4">
    <View className="bg-[#FDD2BC] rounded-2xl px-2 py-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text className="mr-2 text-[20px]">🔥</Text>
          <Text className="text-[20px] font-semibold text-neutral-900">
            Level 12 Scholar
          </Text>
        </View>
        <Text className="text-[16px] font-semibold text-[#F15D22]">847 XP</Text>
      </View>
      <View className="mt-4">
        <ProgressBar
          value={88}
          trackColor="#BFB6B0"
          fillColor="#F15D22"
          height={6}
        />
      </View>
      <Text className="text-[16px] text-neutral-500 text-center mt-2">
        +20 XP Today
      </Text>
    </View>
  </View>
);
