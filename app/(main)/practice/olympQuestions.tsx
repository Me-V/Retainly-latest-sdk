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

import { startQuiz, submitAnswer, submitQuiz } from "@/services/api.olympics";
import {
  setQuizData,
  selectOption,
  setQuestionIndex,
  clearQuiz,
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
    if (!token) {
      Alert.alert("Error", "You are not logged in.");
      router.back();
      return;
    }

    setLoading(true);
    try {
      // 1. CALL API
      const response = await startQuiz(id, token);

      // 2. CHECK IF EXPIRED (Handle "Resume" vs "New" logic)
      const now = new Date().getTime();
      const expiry = new Date(response.expires_at).getTime();

      if (expiry - now <= 0) {
        Alert.alert("Quiz Expired", "This attempt has already expired.", [
          { text: "Go Back", onPress: () => router.back() },
        ]);
      } else {
        // 3. SUCCESS - Save to Redux
        dispatch(setQuizData(response));
      }
    } catch (error: any) {
      // 🟢 THIS IS THE MISSING PART
      if (error.response) {
        // 400 Bad Request usually means "Max attempts reached" or "Already finished"
        if (error.response.status === 400) {
          Alert.alert(
            "Access Denied",
            "You have used all your attempts for this quiz.",
            [{ text: "OK", onPress: () => router.back() }]
          );
        } else if (error.response.status === 401) {
          Alert.alert("Session Expired", "Please login again.");
        } else {
          // Show the actual message from server for debugging
          Alert.alert("Error", JSON.stringify(error.response.data));
        }
      } else {
        Alert.alert("Network Error", "Check your internet connection.");
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

  useEffect(() => {
    // Cleanup function: Runs when you LEAVE the screen
    return () => {
      dispatch(clearQuiz());
    };
  }, []);

  // 3. UI HANDLERS
  const handleOptionPress = (qId: string, optId: string) => {
    dispatch(selectOption({ questionId: qId, optionId: optId }));
  };

  const handleNext = async () => {
    // A. Save the current answer first (Standard logic)
    const currentQ = data.questions[currentQuestionIndex];
    const selectedOptionId = userAnswers[currentQ.id];

    if (selectedOptionId) {
      try {
        await submitAnswer(
          data.attempt_id,
          currentQ.id,
          selectedOptionId,
          token!
        );
      } catch (e) {
        // Silently fail or show toast - we want to proceed to submit anyway if user wants
        console.log("Could not save last answer");
      }
    }

    // B. Check if we are at the end
    if (currentQuestionIndex < data.questions.length - 1) {
      // Not the end? Just go next.
      dispatch(setQuestionIndex(currentQuestionIndex + 1));
    } else {
      // C. WE ARE AT THE END -> SUBMIT LOGIC
      Alert.alert("Finish Quiz", "Are you sure you want to submit?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: async () => {
            setLoading(true);
            try {
              // 1. CALL THE SUBMIT API
              const result = await submitQuiz(data.attempt_id, token!);

              // 2. Check success
              if (result.status === "SUBMITTED") {
                // 3. Clear Redux so the next attempt is fresh
                dispatch(clearQuiz());

                // 4. Success Message
                Alert.alert("Success", "Quiz Submitted Successfully!", [
                  { text: "OK", onPress: () => router.back() },
                ]);
              }
            } catch (error) {
              Alert.alert("Error", "Could not submit quiz. Please try again.");
              console.error(error);
            } finally {
              setLoading(false);
            }
          },
        },
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
