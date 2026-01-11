// app/(auth)/chat-onboarding-profile.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  InteractionManager,
  Keyboard,
  BackHandler,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { initializeApp, getApps, getApp } from "@react-native-firebase/app";
import { getAuth, signInWithPhoneNumber } from "@react-native-firebase/auth";
import { patchMe, patchPhone } from "@/services/api.auth";
import { useSelector } from "react-redux";
import { BotIcon, UserIcon } from "@/assets/logo2";
import PopupModal from "@/components/Popup-modal";
import type { RootState, store } from "@/store";
import { getClasses, getBoards, getStreams } from "@/services/api.edu";
import { useDispatch } from "react-redux";
import { setSelectedClass as setSelectedClassAction } from "@/store/slices/academicsSlice";
import { setSelectedBoard as setSelectedBoardAction } from "@/store/slices/academicsSlice";
import { setSelectedStream as setSelectedStreamAction } from "@/store/slices/academicsSlice";
import Feather from "@expo/vector-icons/Feather";

// ---- Firebase config ----
if (!getApps().length) {
  initializeApp({
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID!,
  });
}
const auth = getAuth(getApp());

type MessageType = "text" | "input" | "otp";
type Message = { id: string; text: string; isUser: boolean; type: MessageType };
type OptionItem = { id: string; name: string };
type Step =
  | "name"
  | "phone"
  | "otp"
  | "class"
  | "board"
  | "stream"
  | "school"
  | "done";

export default function ChatOnboardingProfile() {
  const router = useRouter();
  const token = useSelector((s: RootState) => s.auth.token);
  type AppDispatch = typeof store.dispatch; // or export from your store
  const dispatch = useDispatch<AppDispatch>();

  const scrollViewRef = useRef<ScrollView>(null);
  const otpInputRefs = useRef<Array<TextInput | null>>([]);
  const phoneInputRef = useRef<TextInput | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      text: "Welcome,\nLet's start by exchanging names! My name is UDA.\nWhat can I call you?",
      isUser: false,
      type: "text",
    },
  ]);

  const [step, setStep] = useState<Step>("name");
  const [currentInput, setCurrentInput] = useState("");
  const [userName, setUserName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [confirm, setConfirm] = useState<any>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupHeading, setPopupHeading] = useState("Alert");
  const [popupContent, setPopupContent] = useState("");
  const [popupTheme, setPopupTheme] = useState<"light" | "dark">("light");
  const [phoneConflictOpen, setPhoneConflictOpen] = useState(false);

  const [classOptions, setClassOptions] = useState<OptionItem[]>([]);
  const [boardOptions, setBoardOptions] = useState<OptionItem[]>([]);
  const [streamOptions, setStreamOptions] = useState<OptionItem[]>([]);

  const [selectedClass, setSelectedClass] = useState<OptionItem | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<OptionItem | null>(null);
  const [selectedStream, setSelectedStream] = useState<OptionItem | null>(null);
  const [schoolName, setSchoolName] = useState("");

  const [loadingBoards, setLoadingBoards] = useState(false);
  const [loadingStreams, setLoadingStreams] = useState(false);

  const autoNavTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showPopup = (
    content: string,
    heading = "Alert",
    theme: "light" | "dark" = "dark" // <--- Default to "dark" for consistent styling
  ) => {
    setPopupHeading(heading);
    setPopupContent(content);
    setPopupTheme(theme); // <--- Set the theme
    setPopupVisible(true);
  };

  const uid = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addMessage = (
    text: string,
    isUser = false,
    type: MessageType = "text"
  ) => {
    setMessages((prev) => {
      if (type === "otp") {
        const filtered = prev.filter((m) => m.type !== "otp");
        return [...filtered, { id: uid(), text, isUser, type }];
      }
      return [...prev, { id: uid(), text, isUser, type }];
    });
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      // Exit the app when back is pressed on this screen
      BackHandler.exitApp();
      return true; // Stop default navigation behavior
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (autoNavTimer.current) clearTimeout(autoNavTimer.current);
    };
  }, []);

  useEffect(() => {
    if (countdown > 0 && step === "otp") {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, step]);

  useEffect(() => {
    (async () => {
      try {
        const list = await getClasses(token!);
        const mapped = list
          .map((c: any) => ({ id: c.id, name: c.name }))
          .sort((a: any, b: any) =>
            String(a.name).localeCompare(String(b.name))
          );
        setClassOptions(mapped);
      } catch {
        showPopup("Failed to load classes", "Error");
      }
    })();
  }, [token]);

  const isSenior = useMemo(() => {
    const num = Number(selectedClass?.name);
    return Number.isFinite(num) && num > 10;
  }, [selectedClass]);

  const resetPhoneFlow = () => {
    setVerificationId("");
    setOtp(["", "", "", "", "", ""]);
    setCountdown(0);
    setPhoneNumber("");
    setCurrentInput("");
    setMessages((prev) => prev.filter((m) => m.type !== "otp"));
    setStep("phone");
    addMessage("Please enter your new mobile number.", false, "input");
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => phoneInputRef.current?.focus());
    });
  };

  const handleNameSubmit = async () => {
    if (!currentInput.trim()) return showPopup("Please enter your name");
    const name = currentInput.trim();
    setUserName(name);
    addMessage(name, true);
    setCurrentInput("");
    await patchMe(token!, { alias: name });
    setStep("phone");
    setTimeout(() => {
      addMessage(
        `Hello ${name},\nPlease enter your mobile number.`,
        false,
        "input"
      );
    }, 500);
  };

  const handlePhoneSubmit = async () => {
    const raw = currentInput.replace(/\D/g, "");
    if (raw.length < 10)
      return showPopup("Please enter a valid 10-digit number");

    const full = `+91${raw}`;
    addMessage(`+91 ${raw}`, true);
    setPhoneNumber(full);
    setCurrentInput("");

    try {
      const confirmation = await signInWithPhoneNumber(auth, full);
      setConfirm(confirmation);
      setCountdown(60);
      setStep("otp");
      setTimeout(() => {
        addMessage(
          `OTP sent to +91 ${raw}. \nPlease enter it below.`,
          false,
          "otp"
        );
      }, 400);
    } catch (err: any) {
      showPopup(err?.message || "Failed to send OTP", "Error");
    }
  };

  const verifyOtp = async (code: string) => {
    try {
      if (!confirm) return;
      await confirm.confirm(code);
      const user = auth.currentUser;
      const idToken = await user?.getIdToken(true);
      if (!idToken) throw new Error("Failed to get ID token from Firebase.");

      try {
        await patchPhone(token!, {
          phone_number: phoneNumber,
          phone_token: idToken,
        });
        addMessage(code, true);
        addMessage("Great, you are verified now!", false);
        proceedToClassSelection();
      } catch (e: any) {
        const detail = String(e?.response?.data?.detail || e?.message || "");
        const conflict = /already.*in use|exists|taken/i.test(detail);
        if (conflict || e?.response?.status === 409) {
          setPhoneConflictOpen(true);
          return;
        }
        addMessage(code, true);
        addMessage("Verified! (Profile update pending)", false);
        proceedToClassSelection();
      } finally {
        setIsUpdatingProfile(false);
      }
    } catch (err: any) {
      showPopup("Verification failed. Please try again.", "Error");
      setOtp(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return showPopup(`Please wait ${countdown}s to resend`);
    try {
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber);
      setConfirm(confirmation);
      setCountdown(60);
      setStep("otp");
      setTimeout(() => {
        addMessage(
          `OTP sent to +91 ${phoneNumber}. \nPlease enter it below.`,
          false,
          "otp"
        );
      }, 400);
      showPopup("OTP resent successfully", "Success");
    } catch {
      showPopup("Failed to resend OTP", "Error");
    }
  };

  const proceedToClassSelection = () => {
    InteractionManager.runAfterInteractions(() => {
      addMessage("Awesome! Tell me your class.", false, "text");
      setStep("class");
    });
  };

  const pickClass = async (c: OptionItem) => {
    setSelectedClass(c);
    addMessage(`Class ${c.name}`, true);
    await patchMe(token!, { student_class: String(c.id) });
    dispatch(
      setSelectedClassAction({
        id: String(c.id),
        name: String(c.name),
      })
    );
    addMessage("Now select your Board.", false);
    setLoadingBoards(true);
    try {
      const boards = await getBoards(token!, c.id);
      setBoardOptions(boards.map((b: any) => ({ id: b.id, name: b.name })));
      setStep("board");
    } catch {
      showPopup("Failed to load boards", "Error");
    } finally {
      setLoadingBoards(false);
    }
  };

  const pickBoard = async (b: OptionItem) => {
    setSelectedBoard(b);
    addMessage(b.name, true);
    await patchMe(token!, { board: String(b.id) });
    dispatch(
      setSelectedBoardAction({
        id: String(b.id),
        name: String(b.name),
      })
    );

    if (isSenior && selectedClass) {
      addMessage("Choose your Stream.", false);
      setLoadingStreams(true);
      try {
        const streams = await getStreams(token!, selectedClass.id);
        setStreamOptions(streams.map((s: any) => ({ id: s.id, name: s.name })));
        setStep("stream");
      } catch {
        showPopup("Failed to load streams", "Error");
      } finally {
        setLoadingStreams(false);
      }
    } else {
      addMessage("What’s your school’s name?", false);
      setStep("school");
    }
  };

  const pickStream = async (s: OptionItem) => {
    setSelectedStream(s);
    await patchMe(token!, { stream: String(s.id) });
    dispatch(
      setSelectedStreamAction({
        id: String(s.id),
        name: String(s.name),
      })
    );
    addMessage(s.name, true);
    addMessage("What’s your school’s name?", false);
    setStep("school");
  };

  const saveSchoolAndFinish = async () => {
    const name = currentInput.trim();
    if (!name) return showPopup("Please enter school name");
    setSchoolName(name);
    addMessage(name, true);
    setCurrentInput("");
    try {
      await patchMe(token!, {
        student_class: selectedClass?.id,
        board: selectedBoard?.id,
        stream: selectedStream?.id,
        school: name,
      });
    } catch {}
    addMessage("Perfect! Let's get started 🎉", false);
    setStep("done");

    autoNavTimer.current = setTimeout(() => {
      router.replace("/(main)/animation");
    }, 3000);
  };

  const renderMessages = () =>
    messages.map((m) => {
      if (m.type === "otp" && step === "otp") {
        return (
          <View key={m.id}>
            <View className="flex-row mb-2">
              <BotIcon />
              {/* Bot Bubble: Dark Glass */}
              <View className="ml-2 bg-[#2A1C3E]/80 border border-gray-500/30 p-3 rounded-2xl rounded-bl-none">
                <Text className="text-white/90">{m.text}</Text>
              </View>
            </View>

            {/* OTP User Input Bubble - Right Aligned */}
            <View className="flex-row justify-end mb-4 items-end">
              {/* Note: OTP container background is transparent in layout, but inputs are styled */}
              <View className="mr-2 items-end">
                <View className="flex-row justify-between my-3.5 w-[260px]">
                  {otp.map((d, i) => {
                    const isFilled = Boolean(d);
                    return (
                      <TextInput
                        key={i}
                        ref={(r) => {
                          otpInputRefs.current[i] = r;
                        }}
                        className={`w-10 h-12 rounded-lg text-center text-[18px] font-bold border ${
                          isFilled
                            ? "bg-transparent border-[#F59E51] text-[#F59E51]"
                            : "bg-[#2A1C3E]/60 border-gray-600 text-white"
                        }`}
                        value={d}
                        onChangeText={(v) => {
                          const val = v.replace(/[^0-9]/g, "").slice(0, 1);
                          const next = [...otp];
                          next[i] = val;
                          setOtp(next);
                          if (val && i < 5)
                            otpInputRefs.current[i + 1]?.focus();
                          if (next.join("").length === 6)
                            verifyOtp(next.join(""));
                        }}
                        onKeyPress={(e) => {
                          if (
                            e.nativeEvent.key === "Backspace" &&
                            !otp[i] &&
                            i > 0
                          ) {
                            otpInputRefs.current[i - 1]?.focus();
                          }
                        }}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectionColor="#F59E51"
                      />
                    );
                  })}
                </View>

                {/* Timer + Resend */}
                <View className="flex-row justify-end items-center px-1 w-full">
                  <Text className="text-white font-medium mr-4">
                    00:{countdown.toString().padStart(2, "0")}
                  </Text>
                  <TouchableOpacity
                    disabled={countdown > 0}
                    onPress={handleResendOtp}
                    className={`bg-[#F59E51] px-4 py-2 rounded-xl ${
                      countdown > 0 ? "opacity-50" : ""
                    }`}
                  >
                    <Text className="text-white font-semibold text-[12px]">
                      Resend
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <UserIcon />
            </View>
          </View>
        );
      }
      return (
        <View
          key={m.id}
          className={`flex-row mb-4 ${
            m.isUser ? "justify-end" : "justify-start"
          }`}
        >
          {!m.isUser && <BotIcon />}
          <View
            className={`max-w-[85%] px-4 py-3 rounded-2xl mx-2 ${
              m.isUser
                ? "bg-transparent border border-[#F59E51] rounded-br-none" // User: Transparent + Orange Border
                : "bg-[#2A1C3E]/80 border border-gray-500/30 rounded-bl-none" // Bot: Dark Glass + Gray Border
            }`}
          >
            <Text
              className={`text-[15px] leading-6 font-medium ${
                m.isUser ? "text-[#F59E51]" : "text-white/90"
              }`}
            >
              {m.text}
            </Text>
          </View>
          {m.isUser && <UserIcon />}
        </View>
      );
    });

  return (
    <LinearGradient
      colors={["#3B0A52", "#180323"]} // Golden Layout Background
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <Stack.Screen
        options={{
          headerShown: false, // Hides default header
          gestureEnabled: false, // 🟢 Disables Swipe-to-go-back (iOS)
          headerLeft: () => null, // Removes back button arrow
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 100, // Space for bottom input
          }}
        >
          {/* Header Spacer */}
          <View className="h-16" />

          {renderMessages()}

          {/* Options Grid (Class/Board/Stream) */}
          {(step === "class" || step === "board" || step === "stream") && (
            <View className="flex-row mt-2">
              <BotIcon />
              <View className="ml-2 flex-1">
                {/* Wrap options in a transparent container */}
                <View>
                  {(step === "class"
                    ? classOptions
                    : step === "board"
                    ? boardOptions
                    : streamOptions
                  )
                    .reduce((rows, option, idx) => {
                      if (idx % 2 === 0) rows.push([option]);
                      else rows[rows.length - 1].push(option);
                      return rows;
                    }, [] as OptionItem[][])
                    .map((row, rowIndex) => (
                      <View
                        key={rowIndex}
                        className="flex-row justify-between mb-3"
                      >
                        {row.map((opt) => (
                          <TouchableOpacity
                            key={opt.id}
                            onPress={() => {
                              if (step === "class") pickClass(opt);
                              else if (step === "board") pickBoard(opt);
                              else pickStream(opt);
                            }}
                            className="flex-1 mx-2 shadow-lg"
                          >
                            <LinearGradient
                              colors={["#FF8A33", "#F59E51"]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 0, y: 1 }}
                              className="rounded-2xl py-4"
                              style={{
                                borderRadius: 24,
                              }}
                            >
                              <Text className="text-white text-[14px] font-semibold text-center">
                                {step === "class"
                                  ? `Class ${opt.name}`
                                  : opt.name}
                              </Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        ))}
                        {row.length === 1 && <View className="flex-1 mx-2" />}
                      </View>
                    ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area (Name/Phone/School) */}
        {(step === "name" || step === "phone" || step === "school") && (
          <View
            className="px-4 pt-4 bg-transparent" // transparent so gradient shows through
            style={{ paddingBottom: Platform.OS === "ios" ? 40 : 20 }}
          >
            <View
              className={`flex-row items-center bg-white border border-gray-500/50 rounded-3xl mx-3 px-4 py-2 ${
                isKeyboardVisible ? "mb-10" : "mb-2"
              }`}
            >
              <TextInput
                className="flex-1 text-[16px] h-[45px] text-black"
                placeholderTextColor="#9CA3AF"
                placeholder={
                  step === "name"
                    ? "Enter your name"
                    : step === "phone"
                    ? "Enter your mobile number"
                    : "Enter your school name"
                }
                keyboardType={step === "phone" ? "phone-pad" : "default"}
                value={currentInput}
                onChangeText={setCurrentInput}
                onSubmitEditing={
                  step === "name"
                    ? handleNameSubmit
                    : step === "phone"
                    ? handlePhoneSubmit
                    : saveSchoolAndFinish
                }
                returnKeyType="done"
                ref={step === "phone" ? phoneInputRef : undefined}
              />
              <TouchableOpacity
                onPress={
                  step === "name"
                    ? handleNameSubmit
                    : step === "phone"
                    ? handlePhoneSubmit
                    : saveSchoolAndFinish
                }
                className="ml-2 w-10 h-10  items-center justify-center"
              >
                <Feather name="send" size={26} color="#FF9B42" />
                {/* Note: Ensure SendIcon color is handled or wrap in Text if needed */}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <PopupModal
          isVisible={popupVisible}
          onClose={() => setPopupVisible(false)}
          heading={popupHeading}
          content={popupContent}
          cancelShow={false}
          theme={popupTheme} // <--- Pass the theme state here
        />

        <PopupModal
          isVisible={phoneConflictOpen}
          onClose={() => setPhoneConflictOpen(false)}
          heading="Number already in use"
          content="This phone number is already linked to another account."
          primaryText="Change number"
          onPrimary={() => {
            setPhoneConflictOpen(false);
            resetPhoneFlow();
          }}
          secondaryText="Skip and continue"
          onSecondary={() => {
            setPhoneConflictOpen(false);
            proceedToClassSelection();
          }}
          dismissible={false}
          theme="dark" // <--- ADD THIS
        />
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
