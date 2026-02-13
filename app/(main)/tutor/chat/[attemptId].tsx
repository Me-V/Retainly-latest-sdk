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
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

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

  const handleSend = async () => {
    const textToSend = inputText.trim();
    if (!textToSend) return;

    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: "user",
      isError: false,
    };
    setMessages((prev) => [...prev, userMsg]);

    // 2. Clear Staging Area
    if (isRecording) ExpoSpeechRecognitionModule.stop();
    setInputText("");
    transcriptRef.current = "";
    setSending(true);

    // 3. API Call
    try {
      const data = await sendChatMessage(token!, attemptId || "", textToSend);

      console.log("--------------------->>>>>>API Response:", data);

      const botText = data?.payload?.message || data?.message || data?.response;

      if (botText) {
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: botText,
          sender: "bot",
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
            isError:
              msg.payload?.decision === "Need Study" ||
              msg.payload?.decision === "Improvements",
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
        {!inputText && !isRecording && messages.length <= 1 && (
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
          contentContainerClassName="pb-60" // LARGE padding for footer area
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {loadingHistory && messages.length <= 1 ? (
            <ActivityIndicator size="large" color="#EA580C" className="mt-10" />
          ) : (
            messages.map((msg) => {
              const isBot = msg.sender === "bot";
              return (
                <View
                  key={msg.id}
                  className={`flex-row mb-6 items-start w-full ${isBot ? "justify-start" : "justify-end"}`}
                >
                  {/* Bot Icon */}
                  {isBot && (
                    <View className="w-10 h-10 rounded-full bg-[#F97316] items-center justify-center mr-2 mt-1">
                      <BotIcon />
                    </View>
                  )}

                  {/* Bubble */}
                  <View
                    className={`max-w-[80%] p-4 rounded-2xl relative ${
                      isBot
                        ? "bg-white/10 rounded-tl-none border border-white/5"
                        : "bg-[#3f2020] border border-[#d97706] rounded-tr-none"
                    }`}
                  >
                    <Text
                      className={`text-[16px] leading-6 ${isBot ? "text-white/90" : "text-[#fdba74]"}`}
                    >
                      {msg.text}
                    </Text>

                    {!isBot && msg.isError !== false && (
                      <View className="absolute -bottom-3 -left-3 bg-[#FBBF24] rounded-full border-2 border-[#3f2020]">
                        <Ionicons
                          name="alert-circle"
                          size={24}
                          color="#78350f"
                        />
                      </View>
                    )}
                  </View>

                  {/* User Icon */}
                  {!isBot && (
                    <View className="w-10 h-10 rounded-full bg-[#EA580C] items-center justify-center border-2 border-white ml-2 mt-1">
                      <Ionicons name="person" size={20} color="white" />
                    </View>
                  )}
                </View>
              );
            })
          )}

          {/* 🟢 SIMPLER "THINKING" BUBBLE */}
          {sending && (
            <View className="flex-row items-start justify-start mb-6 w-full">
              {/* Bot Avatar */}
              <View className="w-10 h-10 rounded-full bg-[#F97316] items-center justify-center mr-2 mt-1">
                <BotIcon />
              </View>

              {/* Bubble with Standard Loader */}
              <View className="p-4 rounded-2xl bg-white/10 rounded-tl-none border border-white/5 min-w-[60px] items-center justify-center">
                {/* The Built-in Loader */}
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
              onPress={handleToggleMic}
              className={`w-20 h-20 rounded-full items-center justify-center shadow-xl ${
                isRecording
                  ? "bg-red-500 border-4 border-red-300 scale-110"
                  : "bg-[#EA580C] border-4 border-[#F97316]"
              }`}
              style={{
                elevation: 10,
                shadowColor: "#EA580C",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                marginBottom: 10,
              }}
            >
              <Ionicons
                name={isRecording ? "stop" : "mic"}
                size={40}
                color="white"
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
