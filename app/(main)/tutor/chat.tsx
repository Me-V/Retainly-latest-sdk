import React from "react";
import {
  StatusBar,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useVoiceRecognition } from "@/utils/useVoiceRecognition"; // 🟢 Import your hook

export default function App() {
  // 🟢 Use the hook here
  const { result, isListening, startListening, stopListening } =
    useVoiceRecognition();

  const handleToggle = async () => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  };

  return (
    <View className="flex-1 bg-[#0f172a]">
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Background Blobs */}
      <View className="absolute top-10 left-[-50px] w-80 h-80 bg-purple-900 rounded-full opacity-50" />
      <View className="absolute bottom-20 right-[-50px] w-80 h-80 bg-cyan-900 rounded-full opacity-50" />

      <SafeAreaView className="flex-1 items-center justify-center p-6">
        {/* Header */}
        <Text className="text-white/40 font-bold tracking-widest uppercase mb-10 text-xs">
          Voice Transcription
        </Text>

        {/* Glass Card */}
        <View className="w-full h-3/5 mb-12 rounded-3xl overflow-hidden border border-white/10 bg-white/5">
          <View className="flex-1 p-8 justify-center items-center">
            {result ? (
              <Text className="text-white text-3xl font-medium text-center leading-9">
                {result}
              </Text>
            ) : (
              <Text className="text-white/30 text-xl font-light italic text-center">
                {isListening ? "Listening..." : "Tap the button and speak"}
              </Text>
            )}
          </View>
        </View>

        {/* Glass Button */}
        <TouchableOpacity
          onPress={handleToggle}
          activeOpacity={0.8}
          className={`flex-row items-center justify-center w-full py-5 rounded-2xl border border-white/20 ${
            isListening
              ? "bg-red-500/20 border-red-500/50"
              : "bg-cyan-500/20 border-cyan-500/50"
          }`}
        >
          {/* Status Dot */}
          <View
            className={`w-3 h-3 rounded-full mr-3 shadow-sm ${
              isListening ? "bg-red-500" : "bg-cyan-400"
            }`}
          />

          <Text className="text-white font-semibold text-lg tracking-wide">
            {isListening ? "Stop Listening" : "Start Listening"}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}
