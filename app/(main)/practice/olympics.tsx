import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
// Adjust this import path to match where you saved the api.olympics.ts file
import { getLiveQuizzes, OlympicQuiz } from "@/services/api.olympics";
import { useAppSelector } from "@/utils/profileHelpers/profile.storeHooks";

const Olympics = () => {
  const token = useAppSelector((s) => s.auth.token);

  // 1. State to hold the list of quizzes
  const [quizzes, setQuizzes] = useState<OlympicQuiz[]>([]);

  // 2. State to handle loading status (good UX)
  const [loading, setLoading] = useState(true);

  // 3. Helper function to format seconds into minutes (e.g., 1800 -> "30 min")
  const formatDuration = (seconds: number) => {
    return Math.floor(seconds / 60) + " min";
  };

  useEffect(() => {
    // 4. Function to fetch data
    const fetchQuizzes = async () => {
      try {
        const data = await getLiveQuizzes(token!);
        setQuizzes(data);
      } catch (error) {
        console.error("Failed to load quizzes", error);
      } finally {
        setLoading(false); // Stop the loading spinner
      }
    };

    fetchQuizzes();
  }, []);

  // 5. Show a spinner while fetching
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // 6. The Main UI
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-2xl font-bold mb-4">Live Olympics</Text>

        <FlatList
          data={quizzes}
          keyExtractor={(item) => item.id} // Uses the unique ID from your JSON
          renderItem={({ item }) => (
            // A simple Card for each quiz
            <View className="bg-gray-100 p-4 mb-3 rounded-lg border border-gray-200">
              {/* Title */}
              <Text className="text-lg font-semibold text-black mb-1">
                {item.title}
              </Text>

              {/* Description */}
              <Text className="text-sm text-gray-600 mb-2">
                {item.description}
              </Text>

              {/* Stats Row (Duration & Attempts) */}
              <View className="flex-row justify-between mt-2">
                <Text className="text-xs text-blue-600 font-medium">
                  ⏳ {formatDuration(item.duration_seconds)}
                </Text>
                <Text className="text-xs text-gray-500">
                  Attempts Allowed: {item.max_attempts}
                </Text>
              </View>
            </View>
          )}
          // Message to show if the list is empty
          ListEmptyComponent={
            <Text className="text-center text-gray-500 mt-10">
              No live quizzes available right now.
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default Olympics;
