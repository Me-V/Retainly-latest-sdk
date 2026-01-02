import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { getLiveQuizzes, OlympicQuiz } from "@/services/api.olympics";
import { useAppSelector } from "@/utils/profileHelpers/profile.storeHooks";
import { LinearGradient } from "expo-linear-gradient"; // <--- Needed for background
import { SafeAreaView } from "react-native-safe-area-context"; // <--- Better for custom headers
import Ionicons from "@expo/vector-icons/Ionicons";

// --- GLOW CARD COMPONENT (For the Glass effect) ---
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

const Olympics = () => {
  const router = useRouter();
  const token = useAppSelector((s) => s.auth.token);

  const [quizzes, setQuizzes] = useState<OlympicQuiz[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDuration = (seconds: number) => {
    return Math.floor(seconds / 60) + " min";
  };

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        if (token) {
          const data = await getLiveQuizzes(token);
          setQuizzes(data);
        }
      } catch (error) {
        console.error("Failed to load quizzes", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [token]);

  const handleQuizPress = (item: OlympicQuiz) => {
    router.push({
      pathname: "/(main)/olympics/instructions",
      params: {
        quizId: item.id,
        title: item.title,
        description: item.description,
        duration: formatDuration(item.duration_seconds),
        attempts: item.max_attempts,
      },
    });
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#3B0A52", "#180323"]}
        className="flex-1 justify-center items-center"
      >
        <ActivityIndicator size="large" color="#F98455" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      // Warm tint at top-left (#5A1C44) fading to dark purple
      colors={["#5A1C44", "#3B0A52", "#3A0353"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1.5 }}
      className="flex-1"
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <SafeAreaView className="flex-1">
        {/* Custom Header */}
        <View className="px-4 pt-4 pb-2">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center mb-2"
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>

          {/* Title */}
          <Text className="text-white text-center text-2xl font-bold tracking-wider mb-6">
            LIVE OLYMPICS
          </Text>
        </View>

        {/* List Content */}
        <View className="flex-1 px-4">
          <FlatList
            data={quizzes}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleQuizPress(item)}
                activeOpacity={0.85}
                className="mb-4"
              >
                <GlowCard className="p-5">
                  {/* Title */}
                  <Text className="text-white text-[18px] font-bold mb-4 leading-12">
                    {item.title}
                  </Text>

                  {/* Description */}
                  <Text className="text-gray-300 text-xs mb-4">
                    {item.description ||
                      "This is the Maths Olympics Quiz for Qualifying Round"}
                  </Text>

                  {/* Footer Row */}
                  <View className="flex-row justify-between items-center">
                    {/* Duration with Icon */}
                    <View className="flex-row items-center">
                      <Ionicons
                        name="hourglass-outline"
                        size={14}
                        color="#FF6B4E"
                      />
                      <Text className="text-[#FF6B4E] text-xs font-semibold ml-1">
                        {formatDuration(item.duration_seconds)}
                      </Text>
                    </View>

                    {/* Attempts */}
                    <Text className="text-gray-300 text-xs">
                      Attempts Allowed: {item.max_attempts}
                    </Text>
                  </View>
                </GlowCard>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View className="items-center justify-center mt-20">
                <Text className="text-white/50 text-base">
                  No live quizzes available right now.
                </Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Olympics;
