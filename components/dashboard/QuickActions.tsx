import {
  DashboardPlayIcon,
  DashboardReviewMistakesIcon,
  DashboardMocktestIcon,
} from "@/assets/logo2";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

const CARDS = [
  {
    key: "practice",
    icon: <DashboardPlayIcon />,
    label: "Start\nPractice",
    bg: "#F15D22",
  },
  {
    key: "mock",
    icon: <DashboardMocktestIcon />,
    label: "Start\nMock Test",
    bg: "#FF914C",
  },
  {
    key: "review",
    icon: <DashboardReviewMistakesIcon />,
    label: "Review\nMistakes",
    bg: "#F1A922",
  },
];

export const QuickActions = ({
  onPress,
}: {
  onPress?: (key: string) => void;
}) => {
  const router = useRouter();

  const handlePress = (key: string) => {
    // Navigate on the practice card
    if (key === "practice") {
      router.push("/practice/chooseSubject");
    }
    //rest of the routes
    // Still notify parent if provided
    onPress?.(key);
  };

  return (
    <View className="px-4 mt-8">
      <Text className="text-[18px] font-extrabold text-red-500 mb-6">
        Quick Actions
      </Text>
      <View className="flex-row gap-3" style={{ gap: 10 }}>
        {CARDS.map((c) => (
          <TouchableOpacity
            key={c.key}
            onPress={() => handlePress(c.key)}
            activeOpacity={0.8}
            className="p-10"
          >
            <View
              className="rounded-2xl items-center justify-center shadow-md shadow-black/20"
              style={{ backgroundColor: c.bg, padding: 10 }}
            >
              <Text className="text-white text-[20px]">{c.icon}</Text>
              <Text className="mt-2 text-[12px] text-white text-center">
                {c.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
