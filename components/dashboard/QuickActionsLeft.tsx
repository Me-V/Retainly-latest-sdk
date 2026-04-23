import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { LiveBadge } from "@/components/dashboard/LiveBadge";

type Props = {
  onQuickAction: (key: "practice" | "mock" | "olympics") => void;
  showOlympics: boolean;
};

const QuickActionsLeft: React.FC<Props> = ({ onQuickAction, showOlympics }) => {
  return (
    <View className="flex-1 flex-col justify-between">
      {/* Start Practice */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onQuickAction("practice")}
      >
        <LinearGradient
          colors={["#8E2622", "#D64536"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingVertical: 12,
            borderRadius: 16,
          }}
        >
          <View className="w-8 h-8 rounded-full bg-black/20 items-center justify-center mr-3">
            <Ionicons name="play" size={16} color="#FF7A00" />
          </View>
          <Text className="flex-1 text-white text-[12px] font-semibold">
            Start Practice
          </Text>
          <Ionicons name="chevron-forward" size={18} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Mock Test */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onQuickAction("mock")}
      >
        <LinearGradient
          colors={["#1B521E", "#3A863D"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingVertical: 12,
            borderRadius: 16,
          }}
        >
          <View className="w-8 h-8 rounded-xl bg-black/20 items-center justify-center mr-3">
            <Ionicons name="book" size={16} color="#FFB300" />
          </View>
          <Text className="flex-1 text-white text-[12px] font-semibold">
            Mock Test
          </Text>
          <Ionicons name="chevron-forward" size={18} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Math Olympics OR Invisible Placeholder */}
      {showOlympics ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onQuickAction("olympics")}
          className="relative"
        >
          <LinearGradient
            colors={["#875014", "#CA802E"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderRadius: 16,
            }}
          >
            <View className="w-8 h-8 bg-black/20 rounded-xl items-center justify-center mr-3">
              <Image
                source={require("@/assets/olympiadLogo.png")}
                className="w-5 h-5"
                resizeMode="contain"
              />
            </View>
            <Text className="flex-1 text-white text-[12px] font-semibold">
              Math Olympics
            </Text>
            <Ionicons name="chevron-forward" size={18} color="white" />
          </LinearGradient>

          <View className="absolute top-3 right-1 z-10">
            <LiveBadge />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={{ height: 56 }} pointerEvents="none" />
      )}
    </View>
  );
};

export default QuickActionsLeft;