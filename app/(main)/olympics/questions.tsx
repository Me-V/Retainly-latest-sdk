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
import { useLocalSearchParams, useRouter } from "expo-router";

import { startQuiz, submitAnswer, submitQuiz } from "@/services/api.olympics";
import {
  setQuizData,
  selectOption,
  setQuestionIndex,
  clearQuiz,
} from "@/store/slices/quizSlice";
import { useAppSelector } from "@/utils/profileHelpers/profile.storeHooks";

const QuizScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const params = useLocalSearchParams();
  const quizId = Array.isArray(params.quizId)
    ? params.quizId[0]
    : params.quizId;

  // 🟢 1. GET 'activeQuizId' from Redux
  const { data, currentQuestionIndex, userAnswers, activeQuizId } = useSelector(
    (state: any) => state.quiz
  );

  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  // --- LOGIC: Check if user visited the last question ---
  useEffect(() => {
    if (!data) return;
    if (currentQuestionIndex === data.questions.length - 1) {
      setHasReachedEnd(true);
    }
  }, [currentQuestionIndex, data]);

  // --- SUBMIT LOGIC ---
  const handleFinalSubmit = () => {
    Alert.alert("Finish Quiz", "Are you sure you want to submit?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Submit",
        onPress: async () => {
          setLoading(true);
          try {
            const result = await submitQuiz(data.attempt_id, token!);
            if (result.status === "SUBMITTED") {
              dispatch(clearQuiz());
              Alert.alert("Success", "Quiz Submitted Successfully!", [
                {
                  text: "View Result",
                  onPress: () =>
                    router.replace({
                      pathname: "/(main)/olympics/results",
                      params: { attemptId: data.attempt_id },
                    }),
                },
              ]);
            }
          } catch (error) {
            Alert.alert("Error", "Could not submit quiz. Please try again.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // 🟢 2. THE CORRECT RESUME LOGIC
  // Move the check INSIDE useEffect. Do NOT use 'return' in the main body.
  useEffect(() => {
    if (!quizId) return;

    // CHECK: Is there data? AND Does the saved ID match the ID we clicked?
    if (data && activeQuizId === quizId) {
      console.log("Create: Resuming previous session...");
      // We stop here. We do NOT call loadQuiz.
      // The quiz will simply render from Redux state.
      return;
    }

    // If mismatch, we clear the old data and fetch new
    if (activeQuizId !== quizId) {
      dispatch(clearQuiz());
    }

    loadQuiz(quizId);
  }, [quizId]);

  const loadQuiz = async (id: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await startQuiz(id, token);
      const now = new Date().getTime();
      const expiry = new Date(response.expires_at).getTime();

      if (expiry - now <= 0) {
        Alert.alert("Quiz Expired", "This attempt has already expired.", [
          { text: "Go Back", onPress: () => router.back() },
        ]);
      } else {
        // 🟢 3. SAVE THE ID ALONG WITH DATA
        dispatch(setQuizData({ response, quizId: id }));
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (!data?.expires_at) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(data.expires_at).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("00:00");
        clearInterval(interval);
        handleFinalSubmit();
      } else {
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [data]);

  // 🟢 4. REMOVED THE CLEANUP
  // We do NOT want to clearQuiz() when leaving the screen anymore.
  // Because we want the data to persist if the app closes!
  // useEffect(() => { return () => { dispatch(clearQuiz()); }; }, []); <--- DELETED THIS

  const handleOptionPress = (qId: string, optId: string) => {
    dispatch(selectOption({ questionId: qId, optionId: optId }));
  };

  const handleNext = async () => {
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
        console.log("Silent save failed");
      }
    }

    if (currentQuestionIndex < data.questions.length - 1) {
      dispatch(setQuestionIndex(currentQuestionIndex + 1));
    } else {
      handleFinalSubmit();
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      dispatch(setQuestionIndex(currentQuestionIndex - 1));
    }
  };

  if (loading || !data) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const currentQ = data.questions[currentQuestionIndex];
  const totalQ = data.questions.length;

  return (
    <View className="flex-1 bg-white p-4">
      {/* HEADER */}
      <View className="flex-row justify-between items-center mb-6 border-b border-gray-200 pb-4 mt-8">
        <Text className="text-gray-500 font-bold">
          Q {currentQuestionIndex + 1}/{totalQ}
        </Text>

        <View className="flex-row items-center gap-3">
          <Text className="text-red-600 font-bold text-lg mr-2">
            ⏰ {timeLeft}
          </Text>
          {hasReachedEnd && (
            <TouchableOpacity
              onPress={handleFinalSubmit}
              className="bg-red-100 px-3 py-1 rounded border border-red-200"
            >
              <Text className="text-red-600 font-bold text-xs">End Test</Text>
            </TouchableOpacity>
          )}
        </View>
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
                className={
                  isSelected ? "text-blue-700 font-bold" : "text-gray-700"
                }
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
          className={`px-6 py-3 rounded-lg ${
            currentQuestionIndex === totalQ - 1 ? "bg-green-600" : "bg-blue-600"
          }`}
        >
          <Text className="text-white font-bold">
            {currentQuestionIndex === totalQ - 1 ? "Save & Submit" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default QuizScreen;
