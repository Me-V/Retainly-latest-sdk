import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppSelector } from "@/utils/profileHelpers/profile.storeHooks";
import { getQuizResult, QuizResultResponse } from "@/services/api.olympics";
import { LinearGradient } from "expo-linear-gradient";
import { SpeakerIcon } from "@/assets/logo2";

// --- GLOW CARD COMPONENT (Moved outside for performance) ---
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

const QuizResultScreen = () => {
  const router = useRouter();
  const { attemptId } = useLocalSearchParams();
  const token = useAppSelector((s) => s.auth.token);

  const [result, setResult] = useState<QuizResultResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [errorMsg, setErrorMsg] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      if (!attemptId || !token) return;

      try {
        const id = Array.isArray(attemptId) ? attemptId[0] : attemptId;
        const data = await getQuizResult(id, token);
        setResult(data);
        console.log("Result ############", data);
      } catch (error: any) {
        // 🔴 INTELLIGENT ERROR HANDLING
        let msg = "Could not load result.";
        if (
          error.response &&
          (error.response.status === 404 || error.response.status === 403)
        ) {
          msg = "Result will be available soon.";
        }
        setErrorMsg(msg);
        setModalVisible(true); // <--- Show Modal instead of Error Screen
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId, token]);

  const handleBackToDashboard = () => {
    setModalVisible(false);
    router.replace("/(main)/dashboard");
  };

  // 1. LOADING STATE
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-gray-500">Calculating Score...</Text>
      </View>
    );
  }

  // Helper to safely check pass/fail
  const isPass = result?.result === "PASS";

  return (
    <LinearGradient
      colors={["#5A1C44", "#3B0A52", "#3A0353"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        {/* 2. SUCCESS CONTENT (Only render if result exists) */}
        {result && (
          <>
            <View className="flex-1 px-6 mt-10 items-center">
              <Text className="text-[150px] mb-6">🏆</Text>

              <Text
                className={`text-3xl font-bold mb-2 ${
                  isPass ? "text-green-500" : "text-red-500"
                }`}
              >
                {isPass ? "Congratulations" : "Hard Luck"}
              </Text>

              <Text className="text-gray-300 text-lg mb-10">
                You have {isPass ? "passed" : "failed"} the quiz.
              </Text>

              <GlowCard className="w-full bg-white/10 border border-white/5 rounded-3xl p-6">
                {/* Percentage */}
                <View className="flex-row justify-between items-center py-4 border-b border-white/10">
                  <Text className="text-white text-lg font-semibold">
                    Percentage:
                  </Text>
                  <Text className="text-orange-500 text-xl font-bold">
                    {result.percentage}%
                  </Text>
                </View>

                {/* Score */}
                <View className="flex-row justify-between items-center py-4 border-b border-white/10">
                  <Text className="text-white text-lg font-semibold">
                    Score:
                  </Text>
                  <Text className="text-white text-xl font-bold">
                    {result.score}{" "}
                    <Text className="text-base font-normal">
                      /{result.max_score}
                    </Text>
                  </Text>
                </View>

                {/* Attempts */}
                <View className="flex-row justify-between items-center py-4">
                  <Text className="text-white text-lg font-semibold">
                    Question Attempted:
                  </Text>
                  <Text className="text-white text-xl font-bold">
                    {result.attempted_count}/{result.total_questions}
                  </Text>
                </View>
              </GlowCard>
            </View>

            {/* Bottom Button */}
            <View className="px-6 pb-6">
              <TouchableOpacity
                onPress={() => router.replace("/(main)/dashboard")}
                className="bg-[#F99C36] px-8 py-4 rounded-2xl shadow-lg items-center"
                style={{
                  shadowColor: "#F99C36",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Text className="text-white font-bold text-lg">
                  Back to Dashboard
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* 3. POPUP MODAL (For Pending/Error State) */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={handleBackToDashboard}
        >
          {/* Dark Overlay Background */}
          <View className="flex-1 bg-black/80 justify-center items-center px-6">
            {/* Modal Content - Reusing GlowCard */}
            <GlowCard className="w-full rounded-3xl overflow-hidden">
              {/* NEW: Background Gradient for the Popup Content */}
              <LinearGradient
                colors={["#3B0A52", "#180323"]} // The colors you requested
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }} // 180deg equivalent (Top to Bottom)
                className="p-8 items-center" // Moved padding/layout here
              >
                <SpeakerIcon />

                <Text className="text-[24px] font-bold text-white text-center mb-3">
                  Results Will Be Announced Soon
                </Text>

                <Text className="text-[16px] text-gray-300 text-center mb-8">
                  Thank you for participating. Your results will be shared soon
                </Text>

                <TouchableOpacity
                  onPress={handleBackToDashboard}
                  className="bg-[#F99C36] w-full py-4 rounded-xl items-center"
                  style={{
                    shadowColor: "#F99C36",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <Text className="text-white font-bold text-lg rounded-xl">
                    OK
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </GlowCard>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default QuizResultScreen;
