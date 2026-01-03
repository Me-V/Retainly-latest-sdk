// app/(main)/olympics/instructionScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAppSelector } from "@/utils/profileHelpers/profile.storeHooks"; // Import your Redux hook
import { getQuizPreview } from "@/services/api.olympics"; // Import the API function
import { GlowCard } from "@/components/Glow-Card";

// Define the type for the preview response (based on your JSON)
interface PreviewData {
  quiz: {
    id: string;
    title: string;
    description: string;
    instructions: string;
    duration_seconds: number;
    max_attempts: number;
  };
  set: {
    id: string;
    set_code: string; // e.g., "A"
  };
  preview_token: string;
}

const InstructionScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = useAppSelector((s) => s.auth.token); // Get the user token

  // Extract initial params (these act as placeholders/fallbacks)
  const { quizId, title, duration, attempts } = params;

  // State to hold the API data
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Preview Data on Mount
  useEffect(() => {
    const fetchPreview = async () => {
      if (!quizId || !token) return;
      try {
        const data = await getQuizPreview(String(quizId), token);
        setPreviewData(data as any); // Cast if your API types aren't fully updated yet
      } catch (error) {
        console.error("Failed to load quiz preview", error);
        Alert.alert("Error", "Failed to load quiz instructions.");
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [quizId, token]);

  const handleStart = () => {
    router.replace({
      pathname: "/(main)/olympics/quizQuestions",
      params: {
        quizId: String(quizId),
        previewToken: previewData?.preview_token,
      },
    });
  };

  // Use API data if available, otherwise fall back to params
  const displayTitle = previewData?.quiz?.title || title || "Quiz Title";
  // const displayDuration = previewData ? `${Math.floor(previewData.quiz.duration_seconds / 60)} min` : (duration || "30 min");
  const displayDuration = duration || "30 min"; // Often passed formatted from list
  const displayAttempts = previewData?.quiz?.max_attempts || attempts || 1;
  const displaySetCode = previewData?.set?.set_code || "A"; // 🟢 Display Set Code from API

  return (
    <LinearGradient
      colors={["#3b0764", "#1a032a"]}
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
          {/* Quiz Title */}
          <View className="mb-8 items-center">
            <Text className="text-3xl font-bold text-white text-center mb-1 leading-tight">
              {displayTitle}
            </Text>
          </View>

          {/* Key Details Card */}
          <GlowCard className="w-full">
            <View className="flex-row items-center p-5 py-6">
              {/* Duration Column */}
              <View className="flex-1 items-center justify-center">
                <Ionicons name="hourglass-outline" size={32} color="#F97316" />
                <Text className="text-2xl font-bold text-white mt-2">
                  {displayDuration}
                </Text>
                <Text className="text-white/60 text-sm">Duration</Text>
              </View>

              <View className="w-[1px] bg-white/20 h-24 mx-2" />

              {/* Attempts Column */}
              <View className="flex-1 items-center justify-center">
                <Text className="text-3xl font-bold text-white mb-1">
                  {displayAttempts}
                </Text>
                <Text className="text-white/60 text-sm">Attempts</Text>
              </View>
            </View>

            <View className="h-[1px] bg-white/10 w-full" />

            {/* Bottom Section: Set Name 🟢 (Dynamic Data) */}
            <View className="py-4 items-center justify-center">
              <Text className="text-xl font-bold text-white tracking-wider">
                Set {displaySetCode}
              </Text>
            </View>
          </GlowCard>

          {/* Instructions List */}
          <Text className="text-xl font-bold text-white my-6">
            Instructions
          </Text>

          <View className="space-y-6 pb-8">
            {/* You can map over instructions from API if available, or keep static ones */}
            {/* If API sends instructions as a string, you might parse it, or keep these defaults */}
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
              icon="checkmark-circle-outline"
              text="Click 'Save & Submit' on the last question to finish."
            />
          </View>
        </ScrollView>

        {/* Footer Button */}
        <View className="p-6 pt-2 pb-8">
          <TouchableOpacity
            onPress={handleStart}
            activeOpacity={0.8}
            className="bg-[#F99C36] py-4 rounded-2xl items-center shadow-lg"
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
