import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAppSelector } from "@/utils/profileHelpers/profile.storeHooks";
import { GlowCard } from "@/components/Glow-Card";
import { getQuizPreview, unlockQuiz } from "@/services/api.olympics";
import PopupModal from "@/components/Popup-modal";

// Define the type for the preview response
interface PreviewData {
  quiz: {
    id: string;
    title: string;
    description: string;
    instructions: string;
    duration_seconds: number;
    max_attempts: number;
  };
  set: {
    id: string;
    set_code: string;
  };
  preview_token: string;
}

// 🟢 Define possible modal states
type ModalState = "NONE" | "PIN_REQUIRED" | "LOCKED_ADMIN" | "LIMIT_REACHED";

const InstructionScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = useAppSelector((s) => s.auth.token);

  // Params
  const { quizId, title, duration, attempts } = params;

  // Data State
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  // 🟢 Enhanced Modal State
  const [currentModal, setCurrentModal] = useState<ModalState>("NONE");
  const [pinInput, setPinInput] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState<string | number>(3);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isAdminUnlock, setIsAdminUnlock] = useState(false);

  const [verifying, setVerifying] = useState(false);

  const fetchPreview = async (pin?: string) => {
    if (!quizId || !token) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const data = await getQuizPreview(String(quizId), token, pin);

      // ✅ Success: Data loaded
      setPreviewData(data as any);
      setCurrentModal("NONE");
    } catch (error: any) {
      console.log("Quiz Preview Error:", error.response?.data);

      if (error.response && error.response.status === 400) {
        const errorData = error.response.data;

        // 🟢 Case 1: Locked until Admin (0 attempts)
        if (
          errorData.locked_until_admin === "True" ||
          errorData.locked_until_admin === true
        ) {
          // 🟢 CHANGE: Use PIN_REQUIRED modal, but set Admin Mode to true
          setIsAdminUnlock(true);
          setCurrentModal("PIN_REQUIRED");
          setAttemptsLeft(0);
        }
        // 🟢 Case 2: PIN Required (Normal User)
        else if (
          errorData.pin_required === "True" ||
          errorData.pin_required === true
        ) {
          setIsAdminUnlock(false); // Normal mode
          setCurrentModal("PIN_REQUIRED");
          if (errorData.attempts_left) setAttemptsLeft(errorData.attempts_left);
        }
        // 🟢 Case 3: Generic Limit Reached
        else {
          setCurrentModal("LIMIT_REACHED");
        }
      } else {
        Alert.alert("Error", "Failed to load quiz instructions.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchPreview();
  }, [quizId, token]);

  const handleStart = () => {
    router.replace({
      pathname: "/(main)/olympics/quizQuestions",
      params: {
        quizId: String(quizId),
        previewToken: previewData?.preview_token,
      },
    });
  };

  const verifyPin = async () => {
    if (pinInput.length === 0) {
      setErrorMessage("Please enter a PIN");
      return;
    }

    setVerifying(true);
    setErrorMessage(null);

    try {
      const response = await unlockQuiz(String(quizId), token!, pinInput);

      if (response.unlocked === true) {
        setCurrentModal("NONE");
        setPinInput("");
        setIsAdminUnlock(false); // Reset admin mode
        await fetchPreview();
      }
    } catch (error: any) {
      console.log("Unlock Error:", error.response?.data);

      if (error.response && error.response.status === 400) {
        const data = error.response.data;

        if (data.attempts_left !== undefined) {
          setAttemptsLeft(data.attempts_left);
        }

        // CHECK: Is it completely locked now?
        if (String(data.locked_until_admin) === "True") {
          // 🟢 CHANGE: Switch to Admin Mode inside the same PIN modal
          setIsAdminUnlock(true);
          setErrorMessage("Maximum attempts reached. Admin PIN required.");
          setPinInput(""); // Clear input so admin can type
        } else {
          setPinInput("");
          setErrorMessage(data.detail || "Wrong password. Please try again.");
        }
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    } finally {
      setVerifying(false);
    }
  };

  // Use API data if available, otherwise fall back to params
  const displayTitle = previewData?.quiz?.title || title || "Quiz Title";
  const displayDuration = duration || "30 min";
  const displayAttempts = previewData?.quiz?.max_attempts || attempts || 1;
  const displaySetCode = previewData?.set?.set_code || "A";

  return (
    <LinearGradient
      colors={["#3b0764", "#1a032a"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      className="flex-1"
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-4 pt-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 pt-4">
          <View className="mb-8 items-center">
            <Text className="text-3xl font-bold text-white text-center mb-1 leading-tight">
              {displayTitle}
            </Text>
          </View>

          {/* Key Details Card */}
          <GlowCard className="w-full">
            <View className="flex-row items-center p-5 py-6">
              <View className="flex-1 items-center justify-center">
                <Ionicons name="hourglass-outline" size={25} color="#F97316" />
                <Text className="text-xl font-bold text-white">
                  {displayDuration}
                </Text>
                <Text className="text-white/60 text-sm">Duration</Text>
              </View>
              <View className="w-[1px] bg-white/20 h-24 mx-2" />
              <View className="flex-1 items-center justify-center">
                <Text className="text-3xl font-bold text-white mb-1">
                  {displayAttempts}
                </Text>
                <Text className="text-white/60 text-sm">Attempts</Text>
              </View>
            </View>
            <View className="h-[1px] bg-white/10 w-full" />
            <View className="py-4 items-center justify-center">
              {loading ? (
                <View className="flex-1 justify-center items-center">
                  <ActivityIndicator size="large" color="#F99C36" />
                </View>
              ) : (
                <Text className="text-xl font-bold text-white tracking-wider">
                  Set {displaySetCode}
                </Text>
              )}
            </View>
          </GlowCard>

          {/* Instructions List */}
          <Text className="text-xl font-bold text-white my-6">
            Instructions
          </Text>
          <View className="space-y-6 pb-8">
            <InstructionItem
              icon="time-outline"
              text="The timer starts immediately after you click 'Start Quiz'. It cannot be paused."
            />
            <InstructionItem
              icon="wifi-outline"
              text="Ensure you have a stable internet connection."
            />
            <InstructionItem
              icon="alert-circle-outline"
              text="Do not close the app. If you exit, the timer will keep running."
            />
            <InstructionItem
              icon="checkmark-circle-outline"
              text="Click 'Save & Submit' on the last question to finish."
            />
          </View>
        </ScrollView>

        {/* Start Button - 🟢 Updated to handle loading state */}
        <View className="p-6 pt-2 pb-8">
          <TouchableOpacity
            onPress={handleStart}
            activeOpacity={0.8}
            disabled={loading} // 🟢 Disable interaction while loading
            className={`py-4 rounded-2xl items-center shadow-lg ${
              loading ? "bg-white/10" : "bg-[#F99C36]"
            }`}
          >
            {loading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="#9CA3AF" />
              </View>
            ) : (
              <Text className="text-white font-bold text-lg tracking-wider uppercase">
                Start Quiz
              </Text>
            )}
          </TouchableOpacity>
        </View>
        {/* 🟢 MODAL LOGIC */}
        {/* 1. Limit Reached Modal (Old Behavior) */}
        <PopupModal
          isVisible={currentModal === "LIMIT_REACHED"}
          onClose={() => router.back()}
          heading="Limit Reached"
          content="All of your attempts are being used."
          // Primary Button: Go Back
          primaryText="Go Back"
          onPrimary={() => {
            router.back();
          }}
          // 🟢 NEW: Secondary Button for Results
          secondaryText="Show Results"
          onSecondary={() => {
            console.log("Show Results clicked - Logic pending");
            // Logic to be decided later
          }}
          dismissible={false}
          theme="dark"
        />
        {/* 2. Admin Locked Modal - 🟢 Updated to match "No Attempts Left" Screenshot */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={currentModal === "LOCKED_ADMIN"}
          onRequestClose={() => router.back()}
        >
          <View className="flex-1 justify-center items-center bg-black/80 px-6">
            {/* Modal Container: Matches the dark purple theme */}
            <View className="bg-[#1e0b36] w-full max-w-[340px] rounded-[30px] p-8 items-center border border-white/10 shadow-2xl">
              {/* Title */}
              <Text className="text-white text-2xl font-bold mb-6 text-center tracking-wide">
                No Attempts Left
              </Text>

              {/* Body Text - Section 1 */}
              <Text className="text-gray-300 text-center text-[15px] leading-6 mb-4">
                You have used all available attempts to enter this test.
              </Text>

              {/* Body Text - Section 2 */}
              <Text className="text-gray-300 text-center text-[15px] leading-6 mb-8">
                For security reasons, no further attempts are allowed.{"\n"}
                <Text className="text-gray-300 text-center text-[15px] leading-6 mb-8">
                  Please contact admin for assistance.
                </Text>
              </Text>

              {/* OK Button - Orange & Centered */}
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.8}
                className="bg-[#F99C36] w-32 py-3 rounded-xl items-center justify-center shadow-lg"
              >
                <Text className="text-white font-bold text-lg">OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* 3. PIN Entry Modal - 🟢 Updated to handle Admin Text */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={currentModal === "PIN_REQUIRED"}
          onRequestClose={() => router.back()}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 justify-center items-center bg-black/80 px-4"
          >
            {/* Modal Container */}
            <View className="bg-[#1e0b36] w-full max-w-[360px] rounded-[30px] p-6 items-center border border-white/10 shadow-2xl">
              {/* 🟢 Dynamic Title */}
              <Text className="text-white text-2xl font-bold mb-2 text-center tracking-wide">
                {isAdminUnlock ? "Admin Unlock" : "Enter Quiz PIN"}
              </Text>

              {/* 🟢 Dynamic Subtitle */}
              <Text className="text-gray-300 text-center mb-2 text-[15px] leading-5 px-2">
                {isAdminUnlock
                  ? "Maximum attempts reached.\nAsk the admin to put the PIN."
                  : "Please enter the admin quiz PIN to\naccess this quiz."}
              </Text>

              {/* 🟢 Attempts Remaining: Only show if NOT in admin mode */}
              {!isAdminUnlock && (
                <View className="mb-6 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  <Text className="text-gray-400 text-xs font-medium">
                    Attempts Remaining:{" "}
                    <Text className="text-[#F99C36] font-bold text-sm">
                      {attemptsLeft}
                    </Text>
                  </Text>
                </View>
              )}

              {/* Spacer for Admin mode (since we hid the attempts pill) */}
              {isAdminUnlock && <View className="mb-6" />}

              {/* Split Input Visuals (7 Boxes) - Keeps logic same */}
              <View className="w-full mb-4">
                <View className="flex-row justify-between w-full mb-2">
                  {Array(7)
                    .fill(0)
                    .map((_, index) => (
                      <View
                        key={index}
                        className={`w-[12%] aspect-[0.85] rounded-lg items-center justify-center border ${
                          pinInput.length === index
                            ? "border-[#F99C36] bg-white/10"
                            : "border-white/10 bg-white/5"
                        }`}
                      >
                        <Text className="text-white text-lg font-bold">
                          {pinInput[index] || ""}
                        </Text>
                      </View>
                    ))}
                </View>

                <TextInput
                  className="absolute inset-0 w-full h-full opacity-0"
                  keyboardType="number-pad"
                  value={pinInput}
                  onChangeText={(t) => {
                    if (t.length <= 7) {
                      setPinInput(t);
                      setErrorMessage(null);
                    }
                  }}
                  autoFocus={true}
                  caretHidden={true}
                />
              </View>

              {/* Error Message */}
              {errorMessage ? (
                <Text className="text-red-500 text-sm font-semibold mb-6 text-center">
                  {errorMessage}
                </Text>
              ) : (
                <View className="h-5 mb-6" />
              )}

              {/* Action Buttons */}
              <View className="flex-row w-full justify-end">
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="mr-5 px-5 rounded-xl bg-[#2D1B4E] border border-white/10 items-center justify-center"
                >
                  <Text className="text-white font-semibold text-lg">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={verifyPin}
                  disabled={verifying}
                  className={`px-5 py-3 rounded-xl items-center justify-center ${
                    verifying ? "bg-orange-500/50" : "bg-[#F99C36]"
                  }`}
                >
                  {verifying ? (
                    <Text className="text-white font-semibold text-lg">
                      Checking...
                    </Text>
                  ) : (
                    <Text className="text-white font-semibold text-lg">
                      {isAdminUnlock ? "Unlock" : "Enter Test"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

// Helper component
const InstructionItem = ({ icon, text }: { icon: any; text: string }) => (
  <View className="flex-row items-start pr-4 mb-5">
    <View className="mr-4 mt-0.5">
      <Ionicons name={icon} size={24} color="white" />
    </View>
    <Text className="text-white text-base leading-6 flex-1">{text}</Text>
  </View>
);

export default InstructionScreen;
