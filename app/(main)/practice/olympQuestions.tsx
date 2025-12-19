import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useLocalSearchParams, useRouter } from "expo-router"; // <--- 1. Import Hooks

import { startQuiz } from "@/services/api.olympics";
import {
  setQuizData,
  selectOption,
  setQuestionIndex,
} from "@/store/slices/quizSlice";
import { useAppSelector } from "@/utils/profileHelpers/profile.storeHooks";

const QuizScreen = () => {
  const router = useRouter(); // To handle navigation like "Back"
  const dispatch = useDispatch();
  const token = useAppSelector((s) => s.auth.token);

  // 2. GET PARAMS CORRECTLY
  // useLocalSearchParams returns an object where values can be strings or arrays.
  const params = useLocalSearchParams();
  const quizId = Array.isArray(params.quizId)
    ? params.quizId[0]
    : params.quizId;

  // Select data from Redux
  const { data, currentQuestionIndex, userAnswers } = useSelector(
    (state: any) => state.quiz
  );

  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  // 1. INITIALIZE QUIZ
  useEffect(() => {
    // If we have no quizId, we can't do anything.
    if (!quizId) return;

    // Only fetch if we don't have data
    if (!data) {
      loadQuiz(quizId);
    }
  }, [quizId]);

  const loadQuiz = async (id: string) => {
    setLoading(true);
    try {
      // TODO: Get this from your actual Auth store like you did in the previous screen

      const response = await startQuiz(id, token!);
      dispatch(setQuizData(response));
      // inside loadQuiz function in QuizScreen.tsx
    } catch (error: any) {
      // 1. Log the EXACT error from the backend
      if (error.response) {
        console.log("🔴 Server Error Data:", error.response.data);
        console.log("🔴 Server Status:", error.response.status);

        // Show the specific error to yourself in the alert
        Alert.alert("Failed", JSON.stringify(error.response.data));
      } else {
        console.error("🔴 Network/Code Error:", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. THE LAG-PROOF TIMER LOGIC (Same as before)
  useEffect(() => {
    if (!data?.expires_at) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(data.expires_at).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("00:00");
        clearInterval(interval);
        Alert.alert("Time's Up!", "The quiz has ended.", [
          { text: "OK", onPress: () => router.back() }, // Go back when time is up
        ]);
      } else {
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [data]);

  // 3. UI HANDLERS
  const handleOptionPress = (qId: string, optId: string) => {
    dispatch(selectOption({ questionId: qId, optionId: optId }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < data.questions.length - 1) {
      dispatch(setQuestionIndex(currentQuestionIndex + 1));
    } else {
      // Handle Submit Logic Here
      Alert.alert("Submit Quiz?", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", onPress: () => router.back() }, // Or call a submit API
      ]);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      dispatch(setQuestionIndex(currentQuestionIndex - 1));
    }
  };

  if (loading || !data)
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" className="text-blue-600" />
        <Text className="mt-4 text-gray-500">Starting Quiz...</Text>
      </View>
    );

  const currentQ = data.questions[currentQuestionIndex];
  const totalQ = data.questions.length;

  return (
    <View className="flex-1 bg-white p-4">
      {/* HEADER */}
      <View className="flex-row justify-between items-center mb-6 border-b border-gray-200 pb-4 mt-8">
        <Text className="text-gray-500 font-bold">
          Q {currentQuestionIndex + 1}/{totalQ}
        </Text>
        <Text className="text-red-600 font-bold text-lg">⏰ {timeLeft}</Text>
      </View>

      <ScrollView className="flex-1">
        <Text className="text-xl font-semibold mb-6 text-slate-800">
          {currentQ.text}
        </Text>

        {currentQ.options.map((option: any) => {
          const isSelected = userAnswers[currentQ.id] === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              onPress={() => handleOptionPress(currentQ.id, option.id)}
              className={`p-4 mb-3 rounded-lg border-2 ${
                isSelected
                  ? "bg-blue-50 border-blue-500"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <Text
                className={`${
                  isSelected ? "text-blue-700 font-bold" : "text-gray-700"
                }`}
              >
                {option.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* FOOTER */}
      <View className="flex-row justify-between mt-4 mb-6">
        <TouchableOpacity
          onPress={handlePrev}
          disabled={currentQuestionIndex === 0}
          className={`px-6 py-3 rounded-lg ${
            currentQuestionIndex === 0 ? "bg-gray-300" : "bg-gray-800"
          }`}
        >
          <Text className="text-white font-bold">Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          className="px-6 py-3 rounded-lg bg-blue-600"
        >
          <Text className="text-white font-bold">
            {currentQuestionIndex === totalQ - 1 ? "Submit" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default QuizScreen;
