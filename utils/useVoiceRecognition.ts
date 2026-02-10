import { useState, useEffect, useCallback, useRef } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import {
  startListening as startNative,
  stopListening as stopNative,
  addEventListener,
} from "@ascendtis/react-native-voice-to-text";

export function useVoiceRecognition() {
  const [result, setResult] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isListeningRef = useRef(false);

  useEffect(() => {
    const startListener = addEventListener("onSpeechStart", () => {
      setIsListening(true);
      isListeningRef.current = true;
    });

    const endListener = addEventListener("onSpeechEnd", () => {
      setIsListening(false);
      isListeningRef.current = false;
    });

    const errorListener = addEventListener("onSpeechError", (e: any) => {
      console.log("Speech Error:", e);
      setError(e.error?.message || "Unknown error");
      setIsListening(false);
      isListeningRef.current = false;
    });

    // 🟢 FIX: Handle both Array and String responses
    const handleSpeechResult = (e: any) => {
      //   console.log("Raw Result:", e);
      if (e.value) {
        // If it's an array (standard), take the first item
        if (Array.isArray(e.value)) {
          setResult(e.value[0] || "");
        }
        // If it's a string (some devices/versions), take the whole string
        else if (typeof e.value === "string") {
          setResult(e.value);
        }
      }
    };

    const resultsListener = addEventListener(
      "onSpeechResults",
      handleSpeechResult,
    );
    const partialListener = addEventListener(
      "onSpeechPartialResults",
      handleSpeechResult,
    );

    return () => {
      startListener.remove();
      endListener.remove();
      resultsListener.remove();
      errorListener.remove();
      partialListener.remove();
      stopNative().catch((err) => console.log("Cleanup stop error", err));
    };
  }, []);

  const requestPermission = async () => {
    if (Platform.OS !== "android") return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: "Microphone Permission",
          message: "App needs access to your microphone to transcribe text.",
          buttonPositive: "OK",
          buttonNegative: "Cancel",
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const startListening = useCallback(async () => {
    if (isListeningRef.current) return;

    const hasPermission = await requestPermission();
    if (hasPermission) {
      setError(null);
      setResult("");
      try {
        // 🟢 Best Practice: Always define the language
        await startNative();
      } catch (e: any) {
        console.error("Start Error:", e);
        setError(e.message);
      }
    } else {
      setError("Microphone permission denied");
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      await stopNative();
    } catch (e: any) {
      console.error("Stop Error:", e);
    }
  }, []);

  return {
    result,
    isListening,
    error,
    startListening,
    stopListening,
  };
}
