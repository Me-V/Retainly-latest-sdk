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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { initializeApp, getApps, getApp } from "@react-native-firebase/app";
import { getAuth, signInWithPhoneNumber } from "@react-native-firebase/auth";
import { patchMe, patchPhone } from "@/services/api.auth";
import { useSelector } from "react-redux";
import { BotIcon, SendIcon, UserIcon } from "@/assets/logo2";
import PopupModal from "@/components/Popup-modal";
import type { RootState, store } from "@/store";
import { getClasses, getBoards, getStreams } from "@/services/api.edu";
import { useDispatch } from "react-redux";
import { setSelectedClass as setSelectedClassAction } from "@/store/slices/academicsSlice";
import { setSelectedBoard as setSelectedBoardAction } from "@/store/slices/academicsSlice";
import { setSelectedStream as setSelectedStreamAction } from "@/store/slices/academicsSlice";

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

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupHeading, setPopupHeading] = useState("Alert");
  const [popupContent, setPopupContent] = useState("");
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

  const showPopup = (content: string, heading = "Alert") => {
    setPopupHeading(heading);
    setPopupContent(content);
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
        // Remove older OTP messages to ensure only one OTP bubble
        const filtered = prev.filter((m) => m.type !== "otp");
        return [...filtered, { id: uid(), text, isUser, type }];
      }
      return [...prev, { id: uid(), text, isUser, type }];
    });
  };

  // Scroll to bottom when a new message appears
  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages]);

  // Cleanup navigation timer
  useEffect(() => {
    return () => {
      if (autoNavTimer.current) clearTimeout(autoNavTimer.current);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0 && step === "otp") {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, step]);

  // Load class options
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

    // Remove existing OTP messages too (clean chat)
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
        // Old OTP messages will be replaced automatically here
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
        // Old OTP messages will be replaced automatically here
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
    setCurrentInput(""); // clear after sending
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
      //   dispatch(
      //     setUser({
      //       token: token!,
      //       userInfo: {
      //         alias: userName,
      //         class: selectedClass?.id,
      //         board: selectedBoard?.id,
      //         stream: selectedStream?.id,
      //         school: name,
      //       } as any,
      //     })
      //   );
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
              <View className="ml-2 bg-[#FFF8D9] p-3 rounded-2xl">
                <Text className="text-zinc-800">{m.text}</Text>
              </View>
            </View>
            <View className="flex-row justify-end mb-4">
              <View className="bg-[#F47E54] p-3 rounded-2xl mr-2">
                <View className="flex-row mb-3 justify-center">
                  {otp.map((d, i) => (
                    <TextInput
                      key={i}
                      ref={(r) => {
                        otpInputRefs.current[i] = r;
                      }}
                      className="w-10 h-10 bg-white border border-gray-400 mr-1 text-center rounded-lg"
                      value={d}
                      onChangeText={(v) => {
                        const val = v.replace(/[^0-9]/g, "");
                        const next = [...otp];
                        next[i] = val;
                        setOtp(next);
                        if (val && i < 5) otpInputRefs.current[i + 1]?.focus();
                        if (next.join("").length === 6)
                          verifyOtp(next.join(""));
                      }}
                      onKeyPress={(e) => {
                        if (
                          e.nativeEvent.key === "Backspace" &&
                          !otp[i] &&
                          i > 0
                        )
                          otpInputRefs.current[i - 1]?.focus();
                      }}
                      keyboardType="number-pad"
                      maxLength={1}
                    />
                  ))}
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-white">
                    00:{countdown.toString().padStart(2, "0")}
                  </Text>
                  <TouchableOpacity
                    disabled={countdown > 0}
                    onPress={handleResendOtp}
                    className={countdown > 0 ? "opacity-50" : ""}
                  >
                    <Text className="text-white">Resend</Text>
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
          className={`flex-row mb-3 ${
            m.isUser ? "justify-end" : "justify-start"
          }`}
        >
          {!m.isUser && <BotIcon />}
          <View
            className={`${
              m.isUser ? "bg-[#F47E54]" : "bg-[#FFF8D9]"
            } px-4 py-3 rounded-2xl mx-2 max-w-[85%]`}
          >
            <Text
              className={
                m.isUser
                  ? "text-white text-[14px]"
                  : "text-zinc-800 text-[14px]"
              }
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
      colors={["#FFFFFF", "#FFEFE1", "#D9BEA4"]}
      className="flex-1"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0} // helps on iPhones
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 80, // extra space for bottom input
          }}
        >
          <View className="flex-1 items-end my-4">
            <Text>App Name/Logo</Text>
          </View>

          {renderMessages()}

          {step === "class" && !!classOptions.length && (
            <View className="flex-row mt-2">
              <BotIcon />
              <View className="ml-2 bg-transparent rounded-2xl py-3 flex-1">
                {/* Wrap all buttons in a container */}
                <View>
                  {/* Render in pairs - 2 per row */}
                  {classOptions
                    .reduce((rows, option, idx) => {
                      if (idx % 2 === 0) rows.push([option]);
                      else rows[rows.length - 1].push(option);
                      return rows;
                    }, [] as OptionItem[][])
                    .map((row, rowIndex) => (
                      <View
                        key={rowIndex}
                        className="flex-row justify-between mb-5"
                      >
                        {row.map((c) => (
                          <TouchableOpacity
                            key={c.id}
                            onPress={() => pickClass(c)}
                            className="bg-[#F98455] rounded-3xl py-4 shadow-lg mx-2 flex-1"
                          >
                            <Text className="text-white text-[15px] font-semibold text-center">
                              {`Class ${c.name}`}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {row.length === 1 && <View className="flex-1" />}
                      </View>
                    ))}
                </View>
              </View>
            </View>
          )}

          {step === "board" && !!boardOptions.length && (
            <View className="flex-row mt-2">
              <BotIcon />
              <View className="ml-2 bg-transparent rounded-2xl py-3 flex-1">
                <View>
                  {boardOptions
                    .reduce((rows, option, idx) => {
                      if (idx % 2 === 0) rows.push([option]);
                      else rows[rows.length - 1].push(option);
                      return rows;
                    }, [] as OptionItem[][])
                    .map((row, rowIndex) => (
                      <View
                        key={rowIndex}
                        className="flex-row justify-between mb-5"
                      >
                        {row.map((b) => (
                          <TouchableOpacity
                            key={b.id}
                            onPress={() => pickBoard(b)}
                            disabled={loadingBoards}
                            className="bg-[#F98455] rounded-3xl py-4 shadow-lg mx-2 flex-1"
                          >
                            <Text className="text-white text-[15px] font-semibold text-center">
                              {b.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {row.length === 1 && <View className="flex-1" />}
                      </View>
                    ))}
                </View>
              </View>
            </View>
          )}
          {step === "stream" && !!streamOptions.length && (
            <View className="flex-row mt-2">
              <BotIcon />
              <View className="ml-2 bg-transparent rounded-2xl py-3 flex-1">
                <View>
                  {streamOptions
                    .reduce((rows, option, idx) => {
                      if (idx % 2 === 0) rows.push([option]);
                      else rows[rows.length - 1].push(option);
                      return rows;
                    }, [] as OptionItem[][])
                    .map((row, rowIndex) => (
                      <View
                        key={rowIndex}
                        className="flex-row justify-between mb-5"
                      >
                        {row.map((s) => (
                          <TouchableOpacity
                            key={s.id}
                            onPress={() => pickStream(s)}
                            className="bg-[#F98455] rounded-3xl py-4 shadow-lg mx-2 flex-1"
                          >
                            <Text className="text-white text-[15px] font-semibold text-center">
                              {s.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {row.length === 1 && <View className="flex-1" />}
                      </View>
                    ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {(step === "name" || step === "phone" || step === "school") && (
          <View
            className="px-4 pt-2"
            style={{ paddingBottom: Platform.OS === "ios" ? 20 : 10 }}
          >
            <View className="flex-row bg-white border border-gray-300 rounded-xl px-3 py-2 mb-10">
              <TextInput
                className="flex-1 text-[14px] h-[45px] pl-3 text-gray-800 bg-white"
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
              />
              <TouchableOpacity
                onPress={
                  step === "name"
                    ? handleNameSubmit
                    : step === "phone"
                    ? handlePhoneSubmit
                    : saveSchoolAndFinish
                }
                className="mt-4 mr-2"
              >
                <SendIcon />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* {Platform.OS !== "web" && (
          <FirebaseRecaptchaVerifierModal
            ref={recaptchaVerifier}
            firebaseConfig={firebaseConfig}
          />
        )} */}

        <PopupModal
          isVisible={popupVisible}
          onClose={() => setPopupVisible(false)}
          heading={popupHeading}
          content={popupContent}
          cancelShow={false}
        />

        <PopupModal
          isVisible={phoneConflictOpen}
          onClose={() => setPhoneConflictOpen(false)}
          heading="Number already in use"
          content="This phone number is already linked to another account."
          primaryText="Change Number"
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
        />
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
