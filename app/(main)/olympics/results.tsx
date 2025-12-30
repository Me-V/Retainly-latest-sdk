import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppSelector } from "@/utils/profileHelpers/profile.storeHooks";
import { getQuizResult, QuizResultResponse } from "@/services/api.olympics";

const QuizResultScreen = () => {
  const router = useRouter();
  const { attemptId } = useLocalSearchParams(); // We need this ID to fetch results
  const token = useAppSelector((s) => s.auth.token);

  const [result, setResult] = useState<QuizResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

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
        // If the backend returns 404 or 403, it usually means result is not ready.
        if (
          error.response &&
          (error.response.status === 404 || error.response.status === 403)
        ) {
          setErrorMsg("Result will be available soon.");
        } else {
          setErrorMsg("Could not load result.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId, token]);

  // 1. LOADING STATE
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-gray-500">Calculating Score...</Text>
      </View>
    );
  }

  // 2. ERROR / NOT RELEASED STATE
  if (errorMsg) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center p-6">
        <Text className="text-6xl mb-4">⏳</Text>
        <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
          Status Pending
        </Text>
        <Text className="text-lg text-gray-500 text-center mb-8">
          Result will be available soon!
        </Text>

        <TouchableOpacity
          onPress={() => router.replace("/(main)/dashboard")} // Go back to List
          className="bg-blue-600 px-8 py-3 rounded-full"
        >
          <Text className="text-white font-bold text-lg">Back to Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // 3. SUCCESS (SCORE CARD) STATE
  // "!" tells TS we know result exists here
  const r = result!;
  const isPass = r.result === "PASS";

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 p-6 items-center pt-10">
        {/* Pass/Fail Icon */}
        <Text className="text-8xl mb-4">{isPass ? "🏆" : "❌"}</Text>

        <Text
          className={`text-3xl font-extrabold mb-1 ${
            isPass ? "text-green-600" : "text-red-600"
          }`}
        >
          {isPass ? "Congratulations!" : "Hard Luck"}
        </Text>

        <Text className="text-gray-500 text-lg mb-8 font-medium">
          You {isPass ? "Passed" : "Failed"} the Test
        </Text>

        {/* Score Card Container */}
        <View className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm">
          {/* Score Row */}
          <View className="flex-row justify-between mb-4 border-b border-gray-200 pb-4">
            <Text className="text-gray-600 text-lg">Score</Text>
            <Text className="text-2xl font-bold text-gray-800">
              {r.score}{" "}
              <Text className="text-sm text-gray-400">/ {r.max_score}</Text>
            </Text>
          </View>

          {/* Percentage Row */}
          <View className="flex-row justify-between mb-4">
            <Text className="text-gray-600 text-lg">Percentage</Text>
            <Text
              className={`text-xl font-bold ${
                r.percentage >= r.passing_percentage
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {r.percentage}%
            </Text>
          </View>

          {/* Questions Attempted */}
          <View className="flex-row justify-between">
            <Text className="text-gray-600 text-lg">Attempted</Text>
            <Text className="text-xl font-bold text-gray-800">
              {r.attempted_count} / {r.total_questions}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer Button */}
      <View className="p-6">
        <TouchableOpacity
          onPress={() => router.replace("/(main)/olympics/quizes")}
          className="bg-gray-900 py-4 rounded-xl items-center"
        >
          <Text className="text-white font-bold text-lg">Back to Quizzes</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default QuizResultScreen;
