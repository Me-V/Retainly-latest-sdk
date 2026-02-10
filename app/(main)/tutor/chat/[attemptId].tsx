import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import Ionicons from "@expo/vector-icons/Ionicons";

// Services & Hooks
import { sendChatMessage, getChatHistory } from "@/services/api.chat"; // 🟢 Import getChatHistory
import { useVoiceRecognition } from "@/utils/useVoiceRecognition";
import { BackIcon } from "@/assets/logo";

type Message = {
  id: string;
  text: string;
  sender: "user" | "bot";
};

export default function ChatScreen() {
  const router = useRouter();
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const token = useSelector((s: RootState) => s.auth.token);

  // Voice Hook
  const { result, isListening, startListening, stopListening } =
    useVoiceRecognition();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true); // 🟢 Loading state for history

  const scrollViewRef = useRef<ScrollView>(null);

  // Sync Voice to Input
  useEffect(() => {
    if (result) {
      setInputText(result);
    }
  }, [result]);

  // 🟢 LOAD HISTORY ON MOUNT
  useEffect(() => {
    const fetchHistory = async () => {
      if (!attemptId || !token) return;
      try {
        const data = await getChatHistory(token, attemptId);

        if (data?.messages && Array.isArray(data.messages)) {
          // Convert API format to App format
          const history: Message[] = data.messages.map((msg: any) => ({
            id: msg.sequence.toString(),
            // If it's the bot (assistant), prefer the structured 'payload.message'
            // If it's the user, use 'text'
            text:
              msg.role === "assistant"
                ? msg.payload?.message || msg.text
                : msg.text,
            sender: msg.role === "assistant" ? "bot" : "user",
          }));
          setMessages(history);
        }
      } catch (error) {
        console.error("Failed to load history", error);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [attemptId, token]);

  const handleSend = async () => {
    const textToSend = inputText.trim();
    if (!textToSend || !attemptId || !token) return;

    // 1. Optimistic UI Update
    const userMsg: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: "user",
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setSending(true);

    try {
      // 2. Call API
      const data = await sendChatMessage(token, attemptId, textToSend);

      // 3. Parse Bot Response
      // Logic handles both flat 'message' and nested 'payload.message'
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
      console.error(error);
      Alert.alert("Error", "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const toggleMic = async () => {
    if (isListening) {
      await stopListening();
    } else {
      setInputText("");
      await startListening();
    }
  };

  return (
    <LinearGradient colors={["#3B0A52", "#180323"]} className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-6 pt-12 pb-4 flex-row justify-between items-center bg-[#3B0A52]/50">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <BackIcon color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">AI Tutor</Text>
          <View className="w-6" />
        </View>

        {/* Chat Content */}
        {loadingHistory ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#F59E51" />
            <Text className="text-white/50 mt-4">Resuming session...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 20 }}
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
          >
            {messages.length === 0 && (
              <View className="mt-10 items-center opacity-50">
                <Ionicons name="chatbubbles-outline" size={64} color="white" />
                <Text className="text-white text-center mt-4 text-lg">
                  Start speaking to discuss the question.
                </Text>
              </View>
            )}

            {messages.map((msg) => (
              <View
                key={msg.id}
                className={`mb-3 p-4 max-w-[85%] rounded-2xl ${
                  msg.sender === "user"
                    ? "self-end bg-[#F59E51] rounded-tr-none"
                    : "self-start bg-white/10 rounded-tl-none border border-white/10"
                }`}
              >
                <Text
                  className={`text-[16px] leading-6 ${msg.sender === "user" ? "text-white font-semibold" : "text-white/90"}`}
                >
                  {msg.text}
                </Text>
              </View>
            ))}

            {sending && (
              <View className="self-start p-4 bg-white/10 rounded-2xl rounded-tl-none mb-4">
                <ActivityIndicator color="white" size="small" />
              </View>
            )}
          </ScrollView>
        )}

        {/* Input Area */}
        <View className="p-4 bg-[#180323] border-t border-white/10">
          {isListening && (
            <Text className="text-white/50 text-sm mb-2 text-center italic">
              {result || "Listening..."}
            </Text>
          )}

          <View className="flex-row items-center gap-3">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type or speak..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="flex-1 bg-white/10 text-white rounded-full px-5 py-3 text-base border border-white/5"
            />

            <TouchableOpacity
              onPress={toggleMic}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                isListening ? "bg-red-500 animate-pulse" : "bg-white/10"
              }`}
            >
              <Ionicons
                name={isListening ? "mic" : "mic-outline"}
                size={24}
                color="white"
              />
            </TouchableOpacity>

            {inputText.length > 0 && (
              <TouchableOpacity
                onPress={handleSend}
                disabled={sending}
                className="w-12 h-12 rounded-full bg-[#F59E51] items-center justify-center"
              >
                {sending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Ionicons name="send" size={20} color="white" />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
