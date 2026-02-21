import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import Ionicons from "@expo/vector-icons/Ionicons";

// Services
import { sendChatMessage, getChatHistory } from "@/services/api.chat";

// Voice Library
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { SafeAreaView } from "react-native-safe-area-context";
import { BotIcon } from "@/assets/logo2";

type Message = {
  id: string;
  text: string;
  sender: "user" | "bot";
  isError?: boolean;
  isCorrect?: boolean;
  userSelected?: string[];
  payload?: {
    buttons?: { label: string; value: string }[];
    hint_type?: "radio" | "checkbox";
    decision?: string;
    message?: string;
    // 🟢 NEW: Added score properties to fix the TypeScript error
    progress_score?: number;
    penalty_score?: number;
  };
};

export default function ChatScreen() {
  const router = useRouter();
  const { attemptId, initialQuestion } = useLocalSearchParams<{
    attemptId: string;
    initialQuestion?: string;
  }>();
  const token = useSelector((s: RootState) => s.auth.token);

  // --- STATE ---
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init-1",
      // 🟢 2. Use the passed question text as the starting message
      text: initialQuestion || "Loading question...",
      sender: "bot",
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showNextButton, setShowNextButton] = useState(false);

  const [progressScore, setProgressScore] = useState(0);
  const [penaltyScore, setPenaltyScore] = useState(0);

  const [isKeyboardMode, setIsKeyboardMode] = useState(false);

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);
  const transcriptRef = useRef("");

  const isSendingRef = useRef(false);

  // --- VOICE LOGIC ---
  useSpeechRecognitionEvent("start", () => setIsRecording(true));
  useSpeechRecognitionEvent("end", () => setIsRecording(false));
  useSpeechRecognitionEvent("result", (event) => {
    if (isSendingRef.current) return;

    const text = event.results[0]?.transcript || "";
    if (event.isFinal) {
      transcriptRef.current += text + " ";
      setInputText(transcriptRef.current);
    } else {
      setInputText(transcriptRef.current + text);
    }
  });

  const handleToggleMic = async () => {
    setIsKeyboardMode(false);

    if (isRecording) {
      ExpoSpeechRecognitionModule.stop();
    } else {
      const perms =
        await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();
      if (!perms.granted) {
        Alert.alert("Permission", "Microphone access is required.");
        return;
      }

      // Start Fresh (Only if input is empty, otherwise append?)
      // User likely wants to start fresh if they tap mic again after sending
      if (!inputText) {
        transcriptRef.current = "";
      } else {
        // If there is text, append a space
        transcriptRef.current = inputText + " ";
      }

      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: true,
      });
    }
  };

  const handleSend = async (manualText?: string) => {
    const textToSend = manualText || inputText.trim();
    if (!textToSend) return;

    isSendingRef.current = true;
    setIsKeyboardMode(false);

    const userMsgId = Date.now().toString();

    // 1. Add User Message
    const userMsg: Message = {
      id: userMsgId,
      text: textToSend,
      sender: "user",
      isError: false,
      isCorrect: false,
    };
    setMessages((prev) => [...prev, userMsg]);

    // Reset UI states
    if (isRecording) {
      if (typeof ExpoSpeechRecognitionModule.abort === "function") {
        ExpoSpeechRecognitionModule.abort();
      } else {
        ExpoSpeechRecognitionModule.stop();
      }
    }
    setInputText("");
    transcriptRef.current = "";
    setSelectedOptions([]);
    setSending(true);
    setShowNextButton(false); // 🟢 Hide button while processing new answer

    try {
      const data = await sendChatMessage(token!, attemptId || "", textToSend);
      console.log("API Response:", JSON.stringify(data, null, 2));

      const botText = data?.payload?.message || data?.message || data?.response;
      const decision = data?.payload?.decision;

      //Update Scores if provided by API
      if (data?.payload?.progress_score !== undefined) {
        setProgressScore(data.payload.progress_score);
      }
      if (data?.payload?.penalty_score !== undefined) {
        setPenaltyScore(data.payload.penalty_score);
      }

      // 🟢 Determine Status
      const isAnswerCorrect = decision === "correct";
      const isAnswerWrong =
        decision === "Need Study" ||
        decision === "Improvements" ||
        decision === "repeat_with_correction" ||
        decision === "Penalty";

      // 🟢 Show Next Button if answer is correct
      if (isAnswerCorrect) {
        setShowNextButton(true);
      }

      // 2. Update User Message Color & Status
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMsgId
            ? { ...m, isCorrect: isAnswerCorrect, isError: isAnswerWrong }
            : m,
        ),
      );

      // 3. Add Bot Message
      if (botText) {
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: botText,
          sender: "bot",
          payload: data?.payload,
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to send message.");
    } finally {
      setSending(false);
      isSendingRef.current = false;
    }
  };

  const handleClear = () => {
    setInputText("");
    transcriptRef.current = "";
    setIsKeyboardMode(false);

    if (isRecording) {
      if (typeof ExpoSpeechRecognitionModule.abort === "function") {
        ExpoSpeechRecognitionModule.abort();
      } else {
        ExpoSpeechRecognitionModule.stop();
      }
    }
  };

  const handleOptionSelect = (value: string, type: string = "radio") => {
    if (type === "checkbox") {
      setSelectedOptions((prev) => {
        if (prev.includes(value)) {
          // Unselect
          return prev.filter((item) => item !== value);
        } else {
          // Select
          return [...prev, value];
        }
      });
    } else {
      // Radio behavior (default) - only one selected
      setSelectedOptions([value]);
    }
  };

  const submitOption = () => {
    if (selectedOptions.length > 0) {
      // Sends "Option A, Option B" for checkboxes, or just "Option A" for radio
      handleSend(selectedOptions.join(", "));
    }
  };

  // --- API & HISTORY ---
  useEffect(() => {
    const fetchHistory = async () => {
      if (!attemptId || !token) return;
      try {
        const data = await getChatHistory(token, attemptId);

        if (
          data?.messages &&
          Array.isArray(data.messages) &&
          data.messages.length > 0
        ) {
          // 1. First Pass: Map raw data to Message objects
          let history: Message[] = data.messages.map((msg: any) => ({
            id: msg.sequence.toString(),
            text:
              msg.role === "assistant"
                ? msg.payload?.message || msg.text
                : msg.text,
            sender: msg.role === "assistant" ? "bot" : "user",
            // We initialize these as false, then fix them in the loop below
            isError: false,
            isCorrect: false,
            payload: msg.payload,
          }));

          // 2. Second Pass: "Look Back" to apply Bot decisions to User messages
          for (let i = 0; i < history.length; i++) {
            const msg = history[i];

            // If we find a Bot message with a decision...
            if (msg.sender === "bot" && msg.payload?.decision) {
              const decision = msg.payload.decision;
              const isCorrect = decision === "correct";
              const isError =
                decision === "Need Study" ||
                decision === "Improvements" ||
                decision === "repeat_with_correction" ||
                decision === "Penalty";

              // ...Apply that status to the PREVIOUS message (if it was from the user)
              if (i > 0 && history[i - 1].sender === "user") {
                history[i - 1].isCorrect = isCorrect;
                history[i - 1].isError = isError;
              }
            }
          }

          // 3. Check if we should restore the "Next Question" button
          const lastMsg = history[history.length - 1];
          if (
            lastMsg &&
            lastMsg.sender === "bot" &&
            lastMsg.payload?.decision
          ) {
            const d = lastMsg.payload.decision;
            if (d === "correct") {
              setShowNextButton(true);
            }
          }

          // 4. Prepend Initial Question if missing
          if (initialQuestion) {
            const firstMsg = history[0];
            // Check if history already starts with the question
            const isQuestionMissing =
              !firstMsg || firstMsg.text.trim() !== initialQuestion.trim();

            if (isQuestionMissing) {
              const questionMsg: Message = {
                id: "init-1",
                text: initialQuestion,
                sender: "bot",
              };
              setMessages([questionMsg, ...history]);
            } else {
              setMessages(history);
            }
          } else {
            setMessages(history);
          }

          const lastBotMsgWithScores = [...history]
            .reverse()
            .find(
              (m) =>
                m.sender === "bot" && m.payload?.progress_score !== undefined,
            );

          if (lastBotMsgWithScores && lastBotMsgWithScores.payload) {
            setProgressScore(lastBotMsgWithScores.payload.progress_score || 0);
            setPenaltyScore(lastBotMsgWithScores.payload.penalty_score || 0);
          }
        }
      } catch (error) {
        console.error("History Error", error);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [attemptId, token, initialQuestion]);

  const lastMessage = messages[messages.length - 1];
  const isBotOptionsInteraction =
    lastMessage?.sender === "bot" &&
    lastMessage?.payload?.buttons &&
    lastMessage.payload.buttons.length > 0;

  const isMicDisabled = sending || isBotOptionsInteraction;

  const hasUserMessage = messages.some((msg) => msg.sender === "user");

  const getProgressBarColor = (score: number) => {
    if (score < 50) return "#FF0000";
    if (score > 80) return "#62E362";
    return "#FF7724";
  };

  const progressColor = getProgressBarColor(progressScore);

  return (
    // 🟢 FIX 1: Removed className from LinearGradient, using style instead
    <LinearGradient colors={["#240b36", "#1a0b2e"]} style={{ flex: 1 }}>
      {/* 🟢 FIX 2: Removed className from SafeAreaView, using style instead */}
      <SafeAreaView style={{ flex: 1 }}>
        {/* --- HEADER --- */}
        <View className="px-5 pb-2 w-full">
          <View className="flex-row justify-end mb-2">
            <Text className="text-white font-bold text-[16px] mb-2">
              Score: {progressScore}%
            </Text>
          </View>
          <View className="h-[12px] w-full bg-[#FFE4C4] rounded-full relative">
            <View
              className="absolute left-0 top-0 bottom-0 rounded-full"
              style={{
                width: `${progressScore}%`,
                backgroundColor: progressColor,
                zIndex: 1,
              }}
            />
            {penaltyScore > 0 && (
              <View
                className="absolute right-0 top-0 bottom-0 bg-red-600 rounded-r-full"
                style={{ width: `${penaltyScore}%`, zIndex: 1 }}
              />
            )}
            <View
              className="absolute top-[-2px] w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{
                left: `${progressScore}%`,
                backgroundColor: progressColor,
                transform: [{ translateX: -16 * (progressScore / 100) }],
                zIndex: 2,
              }}
            />
          </View>
        </View>

        {!inputText && !isRecording && !hasUserMessage && (
          <View
            className="absolute inset-0 justify-center items-center z-0"
            pointerEvents="none"
          >
            <Text className="text-white/20 text-lg font-bold tracking-widest uppercase text-center px-10">
              Tap the mic to give your answer
            </Text>
          </View>
        )}

        {/* --- CHAT AREA --- */}
        {/* 🟢 FIX 3: Removed className from ScrollView, using style instead */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, paddingHorizontal: 16, marginTop: 16 }}
          contentContainerStyle={{ paddingBottom: 240 }}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {loadingHistory && messages.length <= 1 ? (
            <ActivityIndicator
              size="large"
              color="#EA580C"
              style={{ marginTop: 40 }}
            />
          ) : (
            messages.map((msg, index) => {
              const isBot = msg.sender === "bot";
              const showOptions =
                isBot && msg.payload?.buttons && msg.payload.buttons.length > 0;
              const isLastMessage = index === messages.length - 1;
              const isCheckbox = msg.payload?.hint_type === "checkbox";
              const hasStatus = msg.isCorrect || msg.isError;

              return (
                <View key={msg.id} className="w-full mb-6">
                  <View
                    className={`flex-row items-start w-full ${isBot ? "justify-start" : "justify-end"}`}
                  >
                    {isBot && (
                      <View className="w-10 h-10 rounded-full bg-[#F97316] items-center justify-center mr-2 mt-1">
                        <BotIcon />
                      </View>
                    )}

                    <View
                      className={`max-w-[80%] rounded-2xl relative ${
                        isBot
                          ? "bg-white/10 p-4 rounded-tl-none border border-white/5"
                          : `${
                              msg.isCorrect
                                ? "bg-[#2f4f4f] border-[#4ade80]/30"
                                : "bg-[#3f2020] border-[#d97706]"
                            } p-4 border rounded-tr-none ${
                              hasStatus ? "pb-10" : ""
                            }`
                      }`}
                    >
                      <Text
                        className={`text-[15px] leading-6 ${isBot ? "text-white/90" : msg.isCorrect ? "text-[#4ade80]" : "text-[#fdba74]"}`}
                      >
                        {msg.text}
                      </Text>

                      {!isBot && (
                        <View className="absolute bottom-3 left-3">
                          {msg.isCorrect ? (
                            <View className="bg-[#3b82f6] rounded-full p-1 shadow-sm items-center justify-center w-6 h-6">
                              <Ionicons
                                name="checkmark"
                                size={14}
                                color="white"
                                strokeWidth={5}
                              />
                            </View>
                          ) : msg.isError ? (
                            <View className="bg-[#FACC15] rounded-full p-1 shadow-sm items-center justify-center w-6 h-6">
                              <Ionicons
                                name="alert"
                                size={14}
                                color="#451a03"
                              />
                            </View>
                          ) : null}
                        </View>
                      )}
                    </View>

                    {!isBot && (
                      <View className="w-10 h-10 rounded-full bg-[#EA580C] items-center justify-center border-2 border-white ml-2 mt-1">
                        <Ionicons name="person" size={20} color="white" />
                      </View>
                    )}
                  </View>

                  {showOptions && msg.payload?.buttons && (
                    <View className="mt-3 ml-12 w-[80%]">
                      <Text className="text-white/60 text-xs mb-2 uppercase tracking-widest font-bold">
                        {isCheckbox
                          ? "Select all that apply:"
                          : "Select an option:"}
                      </Text>

                      {msg.payload.buttons.map((btn: any, i: number) => {
                        let val = "";
                        let displayLabel = "";
                        if (typeof btn === "object" && btn !== null) {
                          val =
                            btn.value || btn.label || btn.text || `opt_${i}`;
                          displayLabel =
                            btn.label || btn.text || btn.value || "Option";
                        } else {
                          val = String(btn);
                          displayLabel = String(btn);
                        }

                        const isSelected = selectedOptions.includes(val);

                        let iconName: any = "radio-button-off";
                        if (isCheckbox) {
                          iconName = isSelected ? "checkbox" : "square-outline";
                        } else {
                          iconName = isSelected
                            ? "radio-button-on"
                            : "radio-button-off";
                        }

                        return (
                          <TouchableOpacity
                            key={i}
                            disabled={!isLastMessage}
                            onPress={() =>
                              handleOptionSelect(
                                val,
                                msg.payload?.hint_type || "radio",
                              )
                            }
                            activeOpacity={0.7}
                            className={`flex-row items-center p-3 mb-2 rounded-xl border ${
                              isSelected
                                ? "bg-[#EA580C]/20 border-[#EA580C]"
                                : "bg-white/5 border-white/10"
                            } ${!isLastMessage ? "opacity-50" : ""}`}
                          >
                            <Ionicons
                              name={iconName}
                              size={20}
                              color={
                                isSelected ? "#EA580C" : "rgba(255,255,255,0.4)"
                              }
                              style={{ marginRight: 10 }}
                            />
                            <Text
                              className={`flex-1 text-[15px] ${isSelected ? "text-white font-semibold" : "text-white/70"}`}
                            >
                              {displayLabel}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}

                      {selectedOptions.length > 0 && isLastMessage && (
                        <TouchableOpacity
                          onPress={submitOption}
                          className="flex-row items-center justify-center p-3 mt-2 rounded-xl bg-[#EA580C]"
                        >
                          <Text className="mr-2 font-bold text-white">
                            Submit Answer
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={18}
                            color="white"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {isBot && isLastMessage && showNextButton && (
                    <View className="mt-6 ml-12 self-start">
                      <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-[#F97316] py-3 px-6 rounded-xl shadow-lg border border-white/20"
                      >
                        <Text className="text-white font-bold text-[15px]">
                          Next question
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}

          {sending && (
            <View className="flex-row items-start justify-start mb-6 w-full">
              <View className="w-10 h-10 rounded-full bg-[#F97316] items-center justify-center mr-2 mt-1">
                <BotIcon />
              </View>
              <View className="p-4 rounded-2xl bg-white/10 rounded-tl-none border border-white/5 min-w-[60px] items-center justify-center">
                <ActivityIndicator size="small" color="white" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* --- FOOTER (STAGING & CONTROLS) --- */}
        <KeyboardAvoidingView
          // 🟢 FIX 1: Enforce "padding" behavior on both platforms
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          // 🟢 FIX 2: Increased vertical offset to push it higher over the keyboard
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 40}
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            zIndex: 50,
            backgroundColor: "transparent",
          }}
        >
          {/* 🟢 FIX 3: Dynamic paddingBottom to make it float slightly above the keyboard when typing */}
          <View
            style={{
              width: "100%",
              paddingBottom: isKeyboardMode
                ? Platform.OS === "ios"
                  ? 40
                  : 24
                : 32,
              paddingTop: 16,
            }}
          >
            {isKeyboardMode ? (
              /* ---------------------------------------------------- */
              /* 🟢 KEYBOARD MODE                                     */
              /* ---------------------------------------------------- */
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-end",
                  paddingHorizontal: 24,
                  width: "100%",
                }}
              >
                {/* Text Field */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "white", // Darkened slightly for better contrast
                    borderColor: "rgba(217, 119, 6, 0.5)",
                    borderWidth: 1,
                    borderRadius: 24,
                    paddingTop: 12,
                    paddingBottom: 12,
                    paddingHorizontal: 20,
                    maxHeight: 120,
                    marginRight: 12,
                  }}
                >
                  <TextInput
                    value={inputText}
                    onChangeText={(text) => {
                      setInputText(text);
                      transcriptRef.current = text;
                    }}
                    placeholder="Type your answer..."
                    placeholderTextColor="black"
                    style={{
                      color: "black",
                      fontSize: 16,
                      lineHeight: 24,
                      padding: 0,
                      margin: 0,
                    }}
                    autoFocus={true}
                    multiline={true}
                  />
                </View>

                {/* Send Button */}
                <View style={{ paddingBottom: 4 }}>
                  <TouchableOpacity
                    onPress={() => handleSend()}
                    disabled={!inputText.trim() || sending}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: "rgba(255,255,255,0.2)",
                      backgroundColor:
                        inputText.trim() && !sending
                          ? "#EA580C"
                          : "rgba(75, 85, 99, 0.5)",
                    }}
                  >
                    <Ionicons
                      name="arrow-up"
                      size={26}
                      color={
                        inputText.trim() && !sending
                          ? "white"
                          : "rgba(255,255,255,0.4)"
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* ---------------------------------------------------- */
              /* 🟢 MIC MODE                                          */
              /* ---------------------------------------------------- */
              <>
                {/* 1. STAGING AREA */}
                {(inputText.length > 0 || isRecording) && (
                  <View
                    style={{
                      width: "100%",
                      alignItems: "center",
                      marginBottom: 24,
                      paddingHorizontal: 24,
                    }}
                  >
                    <View
                      style={{
                        width: "100%",
                        backgroundColor: "rgba(0,0,0,0.4)",
                        borderColor: "rgba(217, 119, 6, 0.5)",
                        borderWidth: 1,
                        borderRadius: 16,
                        padding: 16,
                      }}
                    >
                      <Text
                        style={{
                          color: "#fdba74",
                          fontSize: 16,
                          textAlign: "center",
                          fontStyle: "italic",
                          lineHeight: 24,
                        }}
                      >
                        {inputText || "Listening..."}
                      </Text>
                    </View>
                  </View>
                )}

                {/* 2. CONTROLS ROW */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    paddingHorizontal: 40,
                  }}
                >
                  {/* LEFT: Clear Button OR Keyboard Toggle */}
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 24,
                    }}
                  >
                    {inputText.length > 0 || isRecording ? (
                      <TouchableOpacity
                        onPress={handleClear}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: "rgba(255,255,255,0.1)",
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.1)",
                        }}
                      >
                        <Ionicons name="close" size={24} color="white" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => setIsKeyboardMode(true)}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: "rgba(255,255,255,0.1)",
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.1)",
                        }}
                      >
                        <Ionicons name="keypad" size={22} color="white" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* CENTER: Mic Button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={isMicDisabled}
                    onPress={handleToggleMic}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isMicDisabled
                        ? "rgba(75, 85, 99, 0.5)"
                        : isRecording
                          ? "#EF4444"
                          : "#EA580C",
                      borderWidth: 4,
                      borderColor: isMicDisabled
                        ? "#6B7280"
                        : isRecording
                          ? "#FCA5A5"
                          : "#F97316",
                      elevation: 10,
                      shadowColor: isMicDisabled ? "#000" : "#EA580C",
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.4,
                      shadowRadius: 8,
                      marginBottom: 10,
                    }}
                  >
                    <Ionicons
                      name={
                        isRecording ? "stop" : isMicDisabled ? "mic-off" : "mic"
                      }
                      size={40}
                      color={isMicDisabled ? "#ccc" : "white"}
                    />
                  </TouchableOpacity>

                  {/* RIGHT: Send Button */}
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: 24,
                    }}
                  >
                    {inputText.length > 0 && (
                      <TouchableOpacity
                        onPress={() => handleSend()}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: "#EA580C",
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 2,
                          borderColor: "rgba(255,255,255,0.2)",
                        }}
                      >
                        <Ionicons name="arrow-up" size={28} color="white" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
