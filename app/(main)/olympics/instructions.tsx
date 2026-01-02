// app/(main)/olympics/instructionScreen.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const InstructionScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extract data passed from the List Screen
  const { quizId, title, description, duration, attempts } = params;

  const handleStart = () => {
    // Navigate to the actual Quiz Screen (This is where the API call & Timer start)
    router.replace({
      pathname: "/(main)/olympics/quizQuestions",
      params: { quizId: String(quizId) },
    });
  };
  const GLOW_COLOR = "rgba(255, 255, 255, 0.15)";
  const GLOW_SIZE = 12;
  const GlowCard = ({
    children,
    className = "",
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <LinearGradient
      colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className={`rounded-[24px] border border-white/10 overflow-hidden ${className}`}
    >
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
      {children}
    </LinearGradient>
  );

  return (
    <LinearGradient
      // Deep purple gradient matching the screenshot
      colors={["#3b0764", "#1a032a"]} // Adjust hex codes for exact purple tone
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      className="flex-1"
    >
      <StatusBar
        barStyle="default"
        backgroundColor="transparent"
        translucent={true}
      />
      <SafeAreaView className="flex-1">
        {/* Header with Back Button */}
        <View className="px-4 pt-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 pt-4">
          {/* Quiz Title & Description */}
          <View className="mb-8 items-center">
            <Text className="text-3xl font-bold text-white text-center mb-1 leading-tight">
              {title || "Quiz Title"}
            </Text>
            {/* <Text className="text-white/80 text-base font-semibold text-center">
              {description || "(Qualification Round)"}
            </Text> */}
          </View>

          {/* Key Details Card (Glassy Effect) */}

          <GlowCard className="w-full">
            {/* Top Row: Duration & Attempts */}
            <View className="flex-row items-center p-5 py-6">
              {/* Duration Column */}
              <View className="flex-1 items-center justify-center">
                <Ionicons name="hourglass-outline" size={32} color="#F97316" />
                <Text className="text-2xl font-bold text-white mt-2">
                  {duration || "30 min"}
                </Text>
                <Text className="text-white/60 text-sm">Duration</Text>
              </View>

              {/* Vertical Divider */}
              <View className="w-[1px] bg-white/20 h-24 mx-2" />

              {/* Attempts Column */}
              <View className="flex-1 items-center justify-center">
                {/* Fixed the layout to match the duration column style */}
                <Text className="text-3xl font-bold text-white mb-1">
                  {attempts || 1}
                </Text>
                <Text className="text-white/60 text-sm">Attempts</Text>
              </View>
            </View>

            {/* Horizontal Divider */}
            <View className="h-[1px] bg-white/10 w-full" />

            {/* Bottom Section: Set Name */}
            {/* Matches the screenshot's bottom bar style */}
            <View className="py-4 items-center justify-center">
              <Text className="text-xl font-bold text-white tracking-wider">
                Set A
              </Text>
            </View>
          </GlowCard>

          {/* Instructions List */}
          <Text className="text-xl font-bold text-white my-6">
            Instructions
          </Text>

          <View className="space-y-6 pb-8">
            <InstructionItem
              icon="time-outline"
              text="The timer starts immediately after you click 'Start Quiz'. It cannot be paused."
            />
            <InstructionItem
              icon="wifi-outline"
              text="Ensure you have a stable internet connection."
            />
            <InstructionItem
              icon="alert-circle-outline"
              text="Do not close the app. If you exit, the timer will keep running."
            />
            <InstructionItem
              icon="checkmark-circle-outline" // Changed to circle check for better match
              text="Click 'Save & Submit' on the last question to finish."
            />
          </View>
        </ScrollView>

        {/* Footer Button */}
        <View className="p-6 pt-2 pb-8">
          <TouchableOpacity
            onPress={handleStart}
            activeOpacity={0.8}
            className="bg-[#F99C36] py-4 rounded-2xl items-center shadow-lg" // Matching the orange button color
          >
            <Text className="text-white font-bold text-lg tracking-wider uppercase">
              Start Quiz
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

// Helper component for instruction items
const InstructionItem = ({ icon, text }: { icon: any; text: string }) => (
  <View className="flex-row items-start pr-4 mb-5">
    <View className="mr-4 mt-0.5">
      <Ionicons name={icon} size={24} color="white" />
    </View>
    <Text className="text-white text-base leading-6 flex-1">{text}</Text>
  </View>
);

export default InstructionScreen;
