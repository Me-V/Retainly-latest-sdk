import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity, // <--- Changed from View to TouchableOpacity
} from "react-native";
import { useRouter } from "expo-router"; // <--- Import Router
import { getLiveQuizzes, OlympicQuiz } from "@/services/api.olympics";
import { useAppSelector } from "@/utils/profileHelpers/profile.storeHooks";

const Olympics = () => {
  const router = useRouter(); // <--- Initialize Router
  const token = useAppSelector((s) => s.auth.token);

  const [quizzes, setQuizzes] = useState<OlympicQuiz[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDuration = (seconds: number) => {
    return Math.floor(seconds / 60) + " min";
  };

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        // Only fetch if we have a token
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
      pathname: "/(main)/olympics/instructions", // 🟢 Point to New Screen
      params: {
        quizId: item.id,
        title: item.title,
        description: item.description,
        duration: formatDuration(item.duration_seconds), // Pass formatted string "30 min"
        attempts: item.max_attempts,
      },
    });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-2xl font-bold mb-4">Live Olympics</Text>

        <FlatList
          data={quizzes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            // <--- MADE CLICKABLE HERE
            <TouchableOpacity
              onPress={() => handleQuizPress(item)} // 🟢 Pass the whole 'item'
              className="bg-gray-100 p-4 mb-3 rounded-lg..."
            >
              <Text className="text-lg font-semibold text-black mb-1">
                {item.title}
              </Text>

              <Text className="text-sm text-gray-600 mb-2">
                {item.description}
              </Text>

              <View className="flex-row justify-between mt-2">
                <Text className="text-xs text-blue-600 font-medium">
                  ⏳ {formatDuration(item.duration_seconds)}
                </Text>
                <Text className="text-xs text-gray-500">
                  Attempts Allowed: {item.max_attempts}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text className="text-center text-gray-500 mt-10">
              No live quizzes available right now.
            </Text>
          }
        />

        {/* <TouchableOpacity onPress={() => router.replace("/(main)/practice/QuizResultScreen")}>
          <Text className="text-blue-600">Result</Text>
        </TouchableOpacity> */}
      </View>
    </SafeAreaView>
  );
};

export default Olympics;
