// app/(main)/olympics/quizQuestions.tsx
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
  StatusBar,
  BackHandler,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useLocalSearchParams, useRouter } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import { startQuiz, submitAnswer, submitQuiz } from "@/services/api.olympics";
import {
  setQuizData,
  selectOption,
  setQuestionIndex,
  clearQuiz,
} from "@/store/slices/quizSlice";
import { useAppSelector } from "@/utils/profileHelpers/profile.storeHooks";
import PopupModal from "@/components/Popup-modal";

const QuizScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const params = useLocalSearchParams();
  const quizId = Array.isArray(params.quizId)
    ? params.quizId[0]
    : params.quizId;

  const previewToken = Array.isArray(params.previewToken)
    ? params.previewToken[0]
    : params.previewToken;

  const { data, currentQuestionIndex, userAnswers, activeQuizId } = useSelector(
    (state: any) => state.quiz
  );

  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  // 🟢 Local State: Tracks the user's selection BEFORE saving
  const [currentSelection, setCurrentSelection] = useState<string | null>(null);

  // 🟢 State for Internet Connection
  const [isConnected, setIsConnected] = useState(true);
  const [exitModalVisible, setExitModalVisible] = useState(false);

  // 🟢 NEW: Track if the modal is for "Exit" or "Finish"
  const [isExitMode, setIsExitMode] = useState(true);

  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successTitle, setSuccessTitle] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 🟢 Network Listener Effect
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // 🟢 Sync Local Selection with Saved Redux Data
  // Whenever we change questions, we load the "Saved" answer into our local state.
  // If no saved answer exists, we reset to null (clearing any unsaved previous touches).
  useEffect(() => {
    if (data && data.questions) {
      const currentQId = data.questions[currentQuestionIndex].id;
      const savedAnswer = userAnswers[currentQId];
      setCurrentSelection(savedAnswer || null);
    }
  }, [currentQuestionIndex, data, userAnswers]);

  // 🟢 Handle Hardware Back Button -> EXIT MODE
  useEffect(() => {
    const backAction = () => {
      setIsExitMode(true); // Set to Exit Mode
      setExitModalVisible(true);
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, []);

  const submitQuizNow = async (autoSubmit = false) => {
    if (!isConnected) {
      Alert.alert("No Internet", "Please reconnect to submit.");
      return;
    }
    if (loading || !data) return;

    setLoading(true);
    try {
      const result = await submitQuiz(data.attempt_id, token!);
      if (result.status === "SUBMITTED") {
        // 🟢 Stop loading so the Modal can render over the UI
        setLoading(false);

        // 🟢 Set Success Messages
        setSuccessTitle(autoSubmit ? "Time's Up!" : "Success");
        setSuccessMessage(
          autoSubmit
            ? "Your quiz was automatically submitted."
            : "Quiz Submitted Successfully!"
        );

        // 🟢 Show Custom Success Modal
        setSuccessModalVisible(true);
      }
    } catch (error) {
      Alert.alert("Error", "Could not submit quiz. Please check internet.");
      setLoading(false);
    }
  };

  const handleViewResult = () => {
    setSuccessModalVisible(false);
    dispatch(clearQuiz()); // 🟢 Clear data only when leaving
    router.replace({
      pathname: "/(main)/olympics/results",
      params: { attemptId: data.attempt_id },
    });
  };

  const handleUserSubmit = () => {
    setIsExitMode(true); // Set to Exit Mode
    setExitModalVisible(true);
  };

  // Logic: Show End button if user is at the end OR has answered the last question
  useEffect(() => {
    if (!data || !data.questions || data.questions.length === 0) return;

    const totalQuestions = data.questions.length;
    const lastQuestionId = data.questions[totalQuestions - 1].id;

    // Check 1: Are we currently on the last page?
    const isAtEnd = currentQuestionIndex === totalQuestions - 1;

    // Check 2: Does the last question have an answer recorded in Redux?
    const hasAnsweredLast = !!userAnswers[lastQuestionId];

    if (isAtEnd || hasAnsweredLast) {
      setHasReachedEnd(true);
    }
  }, [currentQuestionIndex, data, userAnswers]);

  useEffect(() => {
    if (!quizId) return;
    if (!isConnected) return;

    if (data && activeQuizId === quizId) {
      console.log("Create: Resuming previous session...");
      return;
    }
    if (activeQuizId !== quizId) {
      dispatch(clearQuiz());
    }
    // Only load if we have the token
    if (previewToken) {
      loadQuiz(quizId);
    }
  }, [quizId, isConnected]);

  const loadQuiz = async (id: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await startQuiz(id, token, previewToken);
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

  const handleOptionPress = (optId: string) => {
    // 🟢 Update LOCAL state only. Do NOT dispatch to Redux yet.
    setCurrentSelection(optId);
  };

  const handleNext = async () => {
    const currentQ = data.questions[currentQuestionIndex];

    // 🟢 Check LOCAL selection
    if (currentSelection) {
      // 1. Commit to Redux (This "Saves" it and updates the orange bubble)
      dispatch(
        selectOption({ questionId: currentQ.id, optionId: currentSelection })
      );

      // 2. Submit to API
      try {
        if (isConnected) {
          await submitAnswer(
            data.attempt_id,
            currentQ.id,
            currentSelection,
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
      setIsExitMode(false);
      setExitModalVisible(true);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      dispatch(setQuestionIndex(currentQuestionIndex - 1));
    }
  };

  const jumpToQuestion = (index: number) => {
    dispatch(setQuestionIndex(index));
  };

  if (loading || !data) {
    return (
      <LinearGradient
        colors={["#3b0764", "#1a032a"]}
        className="flex-1 justify-center items-center"
      >
        <ActivityIndicator size="large" color="#F99C36" />
        <Text className="text-white mt-4">Loading Quiz...</Text>
      </LinearGradient>
    );
  }

  const currentQ = data.questions[currentQuestionIndex];
  const totalQ = data.questions.length;

  return (
    <LinearGradient
      colors={["#3b0764", "#1a032a"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      className="flex-1"
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        {/* NO INTERNET MODAL */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={!isConnected}
          onRequestClose={() => {}}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Ionicons name="cloud-offline" size={50} color="#DC2626" />
              <Text style={styles.modalText}>Connection Lost</Text>
              <Text style={styles.subText}>
                Your internet connection appears to be offline. The timer is
                still running on the server.
              </Text>
              <Text style={styles.subTextBold}>
                Please reconnect to continue.
              </Text>
            </View>
          </View>
        </Modal>

        {/* 🟢 CUSTOM MODAL (Reusable for Exit & Finish) */}
        <PopupModal
          isVisible={exitModalVisible}
          onClose={() => setExitModalVisible(false)}
          theme="dark"
          heading={isExitMode ? "Exit Quiz?" : "Finish Quiz?"}
          content={
            isExitMode
              ? "Your progress is saved locally. You can come back and resume this quiz later."
              : "Are you sure you want to submit your answers?\nYou cannot undo this action."
          }
          primaryText={isExitMode ? "Exit" : "Submit Quiz"}
          onPrimary={() => {
            setExitModalVisible(false);
            if (isExitMode) {
              // 🟢 EXIT MODE: Just go back, do NOT submit.
              router.back();
            } else {
              // 🔴 FINISH MODE: Actually submit the quiz to the backend.
              submitQuizNow(false);
            }
          }}
          secondaryText="Cancel"
          onSecondary={() => setExitModalVisible(false)}
        />

        {/* 🟢 SUCCESS MODAL */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={successModalVisible}
          onRequestClose={() => {}} // Prevent closing with back button
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.8)", // Slightly darker for focus
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <LinearGradient
              colors={["#3B0A52", "#180323"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                width: "100%",
                borderRadius: 24,
                paddingVertical: 40,
                paddingHorizontal: 24,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: "white",
                  textAlign: "center",
                  marginBottom: 12,
                }}
              >
                {successTitle} !
              </Text>

              <Text
                style={{
                  fontSize: 16,
                  color: "#E0E0E0",
                  textAlign: "center",
                  lineHeight: 24,
                  marginBottom: 32,
                }}
              >
                {successMessage}
              </Text>

              <TouchableOpacity
                onPress={handleViewResult}
                activeOpacity={0.8}
                style={{ width: "100%" }}
              >
                <View
                  style={{
                    backgroundColor: "#F99C36",
                    paddingVertical: 16,
                    borderRadius: 16,
                    alignItems: "center",
                    width: "100%",
                    shadowColor: "#F99C36",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 20,
                      fontWeight: "bold",
                    }}
                  >
                    View Result
                  </Text>
                </View>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </Modal>

        {/* --- HEADER --- */}
        <View className="px-5 pb-2">
          {/* QUESTION NAVIGATION BUBBLES */}
          <View className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-6">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ alignItems: "center", paddingRight: 20 }}
            >
              {data.questions.map((_: any, index: number) => {
                const isActive = index === currentQuestionIndex;
                // 🟢 Bubble now relies on Redux userAnswers (only updated on Save)
                const isAnswered = !!userAnswers[data.questions[index].id];

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => jumpToQuestion(index)}
                    className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                      isActive
                        ? "bg-white/20 border-white/40"
                        : isAnswered
                        ? "bg-[#10E315]/20 border-[#F99C36]/40"
                        : "bg-[#C22929]/20 border-white/10"
                    }`}
                  >
                    <Text
                      className={`${
                        isActive
                          ? "text-white font-bold"
                          : isAnswered
                          ? "text-[#3ae805]"
                          : "text-[#e40d0d]"
                      }`}
                    >
                      {index + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View className="flex-row justify-between items-end mb-4 pb-3 border-b border-white/10 px-2">
            <Text className="text-white/80 text-lg font-medium">
              Q {currentQuestionIndex + 1}/{totalQ}
            </Text>

            <View className="flex-row items-center gap-3">
              {/* {hasReachedEnd && (
                <TouchableOpacity
                  onPress={handleUserSubmit}
                  className="bg-red-500/20 border border-red-500/50 px-3 py-1.5 rounded-lg"
                >
                  <Text className="text-red-400 font-bold text-xs uppercase tracking-wide">
                    End Test
                  </Text>
                </TouchableOpacity>
              )} */}

              <Text className="text-[#EF4444] font-bold text-xl tracking-wider">
                {timeLeft}
              </Text>
            </View>
          </View>
        </View>

        {/* --- MAIN CONTENT --- */}
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* QUESTION CARD */}
          <View className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 mt-2">
            <Text className="text-white text-[20px] font-semibold leading-8">
              {currentQ.text}
            </Text>
          </View>

          {/* OPTIONS */}
          <View className="space-y-4 gap-4">
            {currentQ.options.map((option: any) => {
              // 🟢 Selection relies on LOCAL state for immediate feedback
              const isSelected = currentSelection === option.id;

              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => handleOptionPress(option.id)}
                  activeOpacity={0.8}
                  className={`p-5 rounded-2xl border ${
                    isSelected
                      ? "bg-[#F99C36]/20 border-[#F99C36]"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <Text
                    className={`text-[20px] font-medium ${
                      isSelected ? "text-white" : "text-white/80"
                    }`}
                  >
                    {option.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* --- FOOTER --- */}
        <View className="px-5 pb-6 pt-2 flex-row justify-between items-center">
          <TouchableOpacity
            onPress={handlePrev}
            disabled={currentQuestionIndex === 0}
            className={`bg-[#F99C36] px-10 py-4 rounded-2xl shadow-lg ${
              currentQuestionIndex === 0 ? "opacity-0" : "opacity-100"
            }`}
            style={{
              shadowColor: "#F99C36",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Text className="text-white font-semibold text-base">Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            className="bg-[#F99C36] px-4 py-4 rounded-2xl shadow-lg"
            style={{
              shadowColor: "#F99C36",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Text className="text-white font-bold text-base uppercase tracking-wide">
              {currentQuestionIndex === totalQ - 1
                ? "Save & Submit"
                : "Save & Continue"}
            </Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center gap-3 justify-center mb-4">
          {hasReachedEnd && (
            <TouchableOpacity
              onPress={handleUserSubmit}
              className="bg-[#FFFFFF0D] border border-gray-600 px-6 py-3 rounded-2xl"
            >
              <Text className="text-white font-bold text-[24px] uppercase tracking-wide">
                Submit
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "#1a032a",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalText: {
    marginBottom: 10,
    marginTop: 10,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  subText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginBottom: 5,
  },
  subTextBold: {
    textAlign: "center",
    color: "#F99C36",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
  },
});

export default QuizScreen;
