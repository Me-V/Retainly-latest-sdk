import React, { useEffect, useState } from "react";
import {
  PermissionsAndroid,
  Platform,
  StatusBar,
  Text,
  useColorScheme,
  View,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import {
  stopListening,
  startListening,
  addEventListener,
} from "@ascendtis/react-native-voice-to-text";

// 🟢 NativeWind Import (Required to inject styles)
function App() {
  const isDarkMode = useColorScheme() === "dark";

  const [result, setResult] = useState(null);
  const [isListening, setInListening] = useState(false);

  useEffect(() => {
    requestMicrophonePermission();

    const startEventListener = addEventListener("onSpeechStart", () => {
      setInListening(true);
    });

    const endEventListener = addEventListener("onSpeechEnd", () => {
      setInListening(false);
    });

    const resultsEventListener = addEventListener("onSpeechResults", (e) => {
      setResult(e.value);
    });

    const errorEventListener = addEventListener("onSpeechError", (e) => {
      console.log("onSpeechError", e);
      setInListening(false);
    });

    const resultsPartialEventListener = addEventListener(
      "onSpeechPartialResults",
      (e) => {
        setResult(e.value);
      }
    );

    return () => {
      startEventListener.remove();
      endEventListener.remove();
      resultsEventListener.remove();
      errorEventListener.remove();
    };
  }, []);

  async function requestMicrophonePermission() {
    if (Platform.OS !== "android") return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: "Microphone Permission",
          message: "App needs access to your microphone",
          buttonPositive: "OK",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }

  const _handlePressButton = async () => {
    try {
      if (isListening) {
        await stopListening();
      } else {
        await startListening();
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  return (
    <View className="flex-1 bg-[#0f172a]">
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* 🟢 BACKGROUND BLOBS */}
      <View className="absolute top-10 left-[-50px] w-80 h-80 bg-purple-900 rounded-full opacity-50" />
      <View className="absolute bottom-20 right-[-50px] w-80 h-80 bg-cyan-900 rounded-full opacity-50" />

      <SafeAreaView className="flex-1 items-center justify-center p-6">
        {/* Header */}
        <Text className="text-white/40 font-bold tracking-widest uppercase mb-10 text-xs">
          Voice Transcription
        </Text>

        {/* 🟢 GLASS CARD */}
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

        {/* GLASS BUTTON */}
        <TouchableOpacity
          onPress={_handlePressButton}
          activeOpacity={0.8}
          className={`flex-row items-center justify-center w-full py-5 rounded-2xl border border-white/20 ${
            isListening
              ? "bg-red-500/20 border-red-500/50"
              : "bg-cyan-500/20 border-cyan-500/50"
          }`}
        >
          {/* Status Indicator Dot */}
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

export default App;