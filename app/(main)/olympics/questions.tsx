import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useLocalSearchParams, useRouter } from "expo-router";
import NetInfo from "@react-native-community/netinfo"; // 🟢 1. Import NetInfo
import { Ionicons } from "@expo/vector-icons"; // For the warning icon

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

  const { data, currentQuestionIndex, userAnswers, activeQuizId } = useSelector(
    (state: any) => state.quiz
  );

  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  // 🟢 2. State for Internet Connection
  const [isConnected, setIsConnected] = useState(true);

  // 🟢 3. Network Listener Effect
  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      // state.isConnected can be null initially, treat it as true to avoid flash
      setIsConnected(state.isConnected ?? true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const submitQuizNow = async (autoSubmit = false) => {
    // Prevent submission if offline
    if (!isConnected) {
      Alert.alert("No Internet", "Please reconnect to submit.");
      return;
    }

    if (loading || !data) return;

    setLoading(true);
    try {
      const result = await submitQuiz(data.attempt_id, token!);
      if (result.status === "SUBMITTED") {
        dispatch(clearQuiz());

        const title = autoSubmit ? "Time's Up!" : "Success";
        const message = autoSubmit
          ? "Your quiz was automatically submitted."
          : "Quiz Submitted Successfully!";

        Alert.alert(title, message, [
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
      Alert.alert("Error", "Could not submit quiz. Please check internet.");
      setLoading(false);
    }
  };

  const handleUserSubmit = () => {
    Alert.alert("Finish Quiz", "Are you sure you want to submit?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Submit",
        onPress: () => submitQuizNow(false),
      },
    ]);
  };

  useEffect(() => {
    if (!data) return;
    if (currentQuestionIndex === data.questions.length - 1) {
      setHasReachedEnd(true);
    }
  }, [currentQuestionIndex, data]);

  useEffect(() => {
    if (!quizId) return;
    // Don't try to load if offline
    if (!isConnected) return;

    if (data && activeQuizId === quizId) {
      console.log("Create: Resuming previous session...");
      return;
    }
    if (activeQuizId !== quizId) {
      dispatch(clearQuiz());
    }
    loadQuiz(quizId);
  }, [quizId, isConnected]); // Added isConnected dependency so it retries when online

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
        dispatch(setQuizData({ response, quizId: id }));
      }
    } catch (error: any) {
      // Don't show alert if it failed just because of network (Modal handles that)
      if (isConnected) {
        Alert.alert("Error", "Failed to load quiz");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!data?.expires_at) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(data.expires_at).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("00:00");
        clearInterval(interval);
        submitQuizNow(true);
      } else {
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [data]);

  const handleOptionPress = (qId: string, optId: string) => {
    dispatch(selectOption({ questionId: qId, optionId: optId }));
  };

  const handleNext = async () => {
    const currentQ = data.questions[currentQuestionIndex];
    const selectedOptionId = userAnswers[currentQ.id];

    if (selectedOptionId) {
      // 🟢 Try to save answer. If offline, catch block runs.
      // Ideally, you'd queue this, but for now we just try.
      try {
        if (isConnected) {
          await submitAnswer(
            data.attempt_id,
            currentQ.id,
            selectedOptionId,
            token!
          );
        }
      } catch (e) {
        console.log("Silent save failed");
      }
    }

    if (currentQuestionIndex < data.questions.length - 1) {
      dispatch(setQuestionIndex(currentQuestionIndex + 1));
    } else {
      handleUserSubmit();
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
      {/* 🟢 4. NO INTERNET MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!isConnected} // Show when isConnected is false
        onRequestClose={() => {}} // Block back button close
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Ionicons name="cloud-offline" size={50} color="#DC2626" />
            <Text style={styles.modalText}>Connection Lost</Text>
            <Text style={styles.subText}>
              Your internet connection appears to be offline. The timer is still
              running on the server.
            </Text>
            <Text style={styles.subTextBold}>
              Please reconnect to continue.
            </Text>
          </View>
        </View>
      </Modal>

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
              onPress={handleUserSubmit}
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

// 🟢 5. STYLES FOR MODAL
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)", // Semi-transparent background
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
  },
  modalText: {
    marginBottom: 10,
    marginTop: 10,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  subText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    marginBottom: 5,
  },
  subTextBold: {
    textAlign: "center",
    color: "#333",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default QuizScreen;
