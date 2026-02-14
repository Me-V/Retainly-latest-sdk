import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
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
  payload?: {
    buttons?: { label: string; value: string }[];
    hint_type?: "radio" | "checkbox"; // Though you mentioned radio only, keeping flexibility
    decision?: string;
    message?: string;
  };
};

export default function ChatScreen() {
  const router = useRouter();
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const token = useSelector((s: RootState) => s.auth.token);

  // --- STATE ---
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init-1",
      text: "If the distance traveled is 40 km in 1200 seconds, what is the speed? Explain your answer.",
      sender: "bot",
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  // 🟢 NEW: State to control "Next Question" button visibility
  const [showNextButton, setShowNextButton] = useState(false);

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);
  const transcriptRef = useRef("");

  // --- VOICE LOGIC ---
  useSpeechRecognitionEvent("start", () => setIsRecording(true));
  useSpeechRecognitionEvent("end", () => setIsRecording(false));
  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results[0]?.transcript || "";
    if (event.isFinal) {
      transcriptRef.current += text + " ";
      setInputText(transcriptRef.current);
    } else {
      setInputText(transcriptRef.current + text);
    }
  });

  const handleToggleMic = async () => {
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
    if (isRecording) ExpoSpeechRecognitionModule.stop();
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

      // 🟢 Determine Status
      const isAnswerCorrect =
        decision === "correct" || decision === "repeat_with_correction";
      const isAnswerWrong =
        decision === "Need Study" || decision === "Improvements";

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
    }
  };

  const handleClear = () => {
    setInputText("");
    transcriptRef.current = "";
    if (isRecording) ExpoSpeechRecognitionModule.stop();
  };

  const handleOptionSelect = (value: string) => {
    // For radio buttons, we just select one and immediately can trigger send or wait for submit
    // Here we strictly follow radio button behavior (single select)
    setSelectedOptions([value]);
  };

  const submitOption = () => {
    if (selectedOptions.length > 0) {
      handleSend(selectedOptions[0]);
    }
  };

  // --- API & HISTORY ---
  useEffect(() => {
    const fetchHistory = async () => {
      if (!attemptId || !token) return;
      try {
        const data = await getChatHistory(token, attemptId);
        if (data?.messages && Array.isArray(data.messages)) {
          const history: Message[] = data.messages.map((msg: any) => ({
            id: msg.sequence.toString(),
            text:
              msg.role === "assistant"
                ? msg.payload?.message || msg.text
                : msg.text,
            sender: msg.role === "assistant" ? "bot" : "user",
            // Orange Condition
            isError:
              msg.payload?.decision === "Need Study" ||
              msg.payload?.decision === "Improvements",
            // Green Condition
            isCorrect:
              msg.payload?.decision === "correct" ||
              msg.payload?.decision === "repeat_with_correction",
            payload: msg.payload,
          }));
          setMessages(history);
        }
      } catch (error) {
        console.error("History Error", error);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [attemptId, token]);

  const lastMessage = messages[messages.length - 1];
  const isBotOptionsInteraction =
    lastMessage?.sender === "bot" &&
    lastMessage?.payload?.buttons &&
    lastMessage.payload.buttons.length > 0;

  const isMicDisabled = sending || isBotOptionsInteraction;

  const hasUserMessage = messages.some((msg) => msg.sender === "user");

  return (
    <LinearGradient colors={["#240b36", "#1a0b2e"]} className="flex-1">
      <SafeAreaView className="flex-1">
        {/* --- HEADER --- */}
        <View className="px-5 pt-4 pb-2 w-full">
          <View className="flex-row justify-end mb-2">
            <Text className="text-white font-bold text-[16px]">
              Score: 1/20
            </Text>
          </View>
          <View className="h-[12px] w-full bg-[#FFE4C4] rounded-full relative">
            <View className="h-full bg-[#EA580C] rounded-full w-[5%]" />
            <View className="absolute top-[-2px] left-[5%] w-4 h-4 rounded-full bg-[#EA580C] border-2 border-white shadow-sm" />
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
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 mt-4"
          contentContainerClassName="pb-60"
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {loadingHistory && messages.length <= 1 ? (
            <ActivityIndicator size="large" color="#EA580C" className="mt-10" />
          ) : (
            // 🟢 FIX: Directly map the array. Do NOT wrap in { messages: ... }
            messages.map((msg, index) => {
              const isBot = msg.sender === "bot";

              // Logic: Show options ONLY for the latest bot message that has buttons
              const showOptions =
                isBot &&
                index === messages.length - 1 &&
                msg.payload?.buttons &&
                msg.payload.buttons.length > 0;
              const isLastMessage = index === messages.length - 1;

              // 🟢 HELPER: Determine if we need space for the icon
              // Only add bottom padding if the answer is explicitly Correct OR Error
              const hasStatus = msg.isCorrect || msg.isError;

              return (
                <View key={msg.id} className="w-full mb-6">
                  {/* --- Message Bubble Row --- */}
                  <View
                    className={`flex-row items-start w-full ${isBot ? "justify-start" : "justify-end"}`}
                  >
                    {/* Bot Avatar */}
                    {isBot && (
                      <View className="w-10 h-10 rounded-full bg-[#F97316] items-center justify-center mr-2 mt-1">
                        <BotIcon />
                      </View>
                    )}

                    {/* Bubble */}
                    <View
                      className={`max-w-[80%] rounded-2xl relative ${
                        isBot
                          ? "bg-white/10 p-4 rounded-tl-none border border-white/5"
                          : `${
                              msg.isCorrect
                                ? "bg-[#2f4f4f] border-[#4ade80]/30" // Green Theme
                                : "bg-[#3f2020] border-[#d97706]" // Orange Theme
                            } p-4 border rounded-tr-none ${
                              // 🟢 FIX: Only take height (pb-10) if status exists
                              hasStatus ? "pb-10" : ""
                            }`
                      }`}
                    >
                      <Text
                        className={`text-[15px] leading-6 ${isBot ? "text-white/90" : msg.isCorrect ? "text-[#4ade80]" : "text-[#fdba74]"}`}
                      >
                        {msg.text}
                      </Text>

                      {/* 🟢 Status Icons (Positioned Bottom-Left INSIDE) */}
                      {!isBot && (
                        <View className="absolute bottom-3 left-3">
                          {msg.isCorrect ? (
                            // Blue Checkmark Circle
                            <View className="bg-[#3b82f6] rounded-full p-1 shadow-sm items-center justify-center w-6 h-6">
                              <Ionicons
                                name="checkmark"
                                size={14}
                                color="white"
                                strokeWidth={5}
                              />
                            </View>
                          ) : msg.isError ? (
                            // Yellow Exclamation Circle
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

                    {/* User Avatar */}
                    {!isBot && (
                      <View className="w-10 h-10 rounded-full bg-[#EA580C] items-center justify-center border-2 border-white ml-2 mt-1">
                        <Ionicons name="person" size={20} color="white" />
                      </View>
                    )}
                  </View>

                  {/* Radio Buttons */}
                  {showOptions && msg.payload?.buttons && (
                    <View className="mt-3 ml-12 w-[80%]">
                      <Text className="text-white/60 text-xs mb-2 uppercase tracking-widest font-bold">
                        Select an option:
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
                        return (
                          <TouchableOpacity
                            key={i}
                            onPress={() => handleOptionSelect(val)}
                            activeOpacity={0.7}
                            className={`flex-row items-center p-3 mb-2 rounded-xl border ${isSelected ? "bg-[#EA580C]/20 border-[#EA580C]" : "bg-white/5 border-white/10"}`}
                          >
                            <Ionicons
                              name={
                                isSelected
                                  ? "radio-button-on"
                                  : "radio-button-off"
                              }
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
                      {selectedOptions.length > 0 && (
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

                  {/* Next Question Button */}
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

          {/* Thinking Bubble */}
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
        <View className="absolute bottom-0 w-full pb-8 pt-4 z-50 bg-transparent">
          {/* 1. STAGING AREA (The "Draft" Bubble) */}
          {/* Visible if there is text OR if recording */}
          {(inputText.length > 0 || isRecording) && (
            <View className="w-full items-center mb-6 px-6">
              <View className="w-full bg-black/40 border border-[#d97706]/50 rounded-2xl p-4 shadow-lg backdrop-blur-md">
                <Text className="text-[#fdba74] text-[16px] text-center italic leading-6">
                  {inputText || "Listening..."}
                </Text>
              </View>
            </View>
          )}

          {/* 2. CONTROLS ROW */}
          <View className="flex-row items-center justify-center w-full px-10 gap-x-6">
            {/* LEFT: Clear Button (Visible if text exists) */}
            <View className="w-14 h-14 items-center justify-center">
              {inputText.length > 0 && (
                <TouchableOpacity
                  onPress={handleClear}
                  className="w-12 h-12 rounded-full bg-white/10 items-center justify-center border border-white/10"
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              )}
            </View>

            {/* CENTER: Mic Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              // 🟢 Disable interaction based on logic
              disabled={isMicDisabled}
              onPress={handleToggleMic}
              className={`w-20 h-20 rounded-full items-center justify-center shadow-xl ${
                isMicDisabled
                  ? "bg-gray-600 border-4 border-gray-500 opacity-50" // 🟢 Grayed out style
                  : isRecording
                    ? "bg-red-500 border-4 border-red-300 scale-110"
                    : "bg-[#EA580C] border-4 border-[#F97316]"
              }`}
              style={{
                elevation: 10,
                shadowColor: isMicDisabled ? "#000" : "#EA580C",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                marginBottom: 10,
              }}
            >
              <Ionicons
                name={isRecording ? "stop" : isMicDisabled ? "mic-off" : "mic"} // 🟢 Optional: Change icon to mic-off
                size={40}
                color={isMicDisabled ? "#ccc" : "white"}
              />
            </TouchableOpacity>

            {/* RIGHT: Send Button (Visible if text exists) */}
            <View className="w-14 h-14 items-center justify-center">
              {inputText.length > 0 && (
                <TouchableOpacity
                  onPress={() => handleSend()}
                  className="w-12 h-12 rounded-full bg-[#EA580C] items-center justify-center shadow-lg border-2 border-white/20"
                >
                  <Ionicons name="arrow-up" size={28} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
