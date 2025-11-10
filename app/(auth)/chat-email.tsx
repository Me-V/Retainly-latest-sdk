// app/(auth)/chat-profile.tsx  — merged chat: name -> email -> class -> board -> stream? -> school -> complete
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { BotIcon, SendIcon, UserIcon } from "@/assets/logo2";
import PopupModal from "@/components/Popup-modal";
import type { RootState } from "@/store";
import { getClasses, getBoards, getStreams } from "@/services/api.edu";
import { patchEmail, patchMe } from "@/services/api.auth";

type ChatStep =
  | "name"
  | "email"
  | "class"
  | "board"
  | "stream"
  | "school"
  | "complete";

type MessageType = "text" | "options" | "input";
type Message = { id: string; text: string; isUser: boolean; type: MessageType };
type OptionItem = { id: string; name: string };

export default function ChatProfileScreen() {
  const router = useRouter();
  const token = useSelector((s: RootState) => s.auth.token);

  const scrollRef = useRef<ScrollView>(null);

  // Inputs for textual steps
  const [currentInput, setCurrentInput] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      text: "Welcome, Let start with Exchanging Name, My name is UDA, What can I call you? ",
      isUser: false,
      type: "text",
    },
  ]);

  // Options state
  const [classOptions, setClassOptions] = useState<OptionItem[]>([]);
  const [boardOptions, setBoardOptions] = useState<OptionItem[]>([]);
  const [streamOptions, setStreamOptions] = useState<OptionItem[]>([]);

  // Selections
  const [selectedClass, setSelectedClass] = useState<OptionItem | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<OptionItem | null>(null);
  const [selectedStream, setSelectedStream] = useState<OptionItem | null>(null);
  const [schoolName, setSchoolName] = useState("");

  const [loadingBoards, setLoadingBoards] = useState(false);
  const [loadingStreams, setLoadingStreams] = useState(false);

  const [step, setStep] = useState<ChatStep>("name");

  // Popup UI
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupHeading, setPopupHeading] = useState("Alert");
  const [popupContent, setPopupContent] = useState("");

  const showPopup = (content: string, heading = "Alert") => {
    setPopupHeading(heading);
    setPopupContent(content);
    setPopupVisible(true);
  };

  const uid = () =>
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const addMessage = (
    text: string,
    isUser = false,
    type: MessageType = "text"
  ) => setMessages((prev) => [...prev, { id: uid(), text, isUser, type }]);

  // Fetch classes once after token available
  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        const list = await getClasses(token); // [{ id, name }]
        const mapped: OptionItem[] = list.map((c) => ({
          id: c.id,
          name: c.name,
        }));
        mapped.sort((a, b) => {
          const an = parseInt(String(a.name).replace(/\D/g, ""), 10);
          const bn = parseInt(String(b.name).replace(/\D/g, ""), 10);
          if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
          return String(a.name).localeCompare(String(b.name));
        });
        setClassOptions(mapped);
      } catch {
        showPopup("Failed to load classes", "Error");
      }
    })();
  }, [token]);

  // Auto-scroll on new messages
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
  }, [messages]);

  // Senior for classes > 10
  const isSenior = useMemo(() => {
    const n = Number(selectedClass?.name);
    return Number.isFinite(n) && n > 10;
  }, [selectedClass]);

  // Textual steps handlers
  const handleSubmitName = () => {
    const name = currentInput.trim();
    if (!name) {
      showPopup("Please enter your name");
      return;
    }
    setUserName(name);
    addMessage(name, true, "text");
    setCurrentInput("");
    setTimeout(() => {
      addMessage(
        `Hello ${name}, please enter an email address.`,
        false,
        "input"
      );
      setStep("email");
    }, 600);
  };

  const handleSubmitEmail = async () => {
    const email = currentInput.trim();
    // basic check
    if (!/\S+@\S+\.\S+/.test(email)) {
      showPopup("Please enter a valid email address");
      return;
    }
    setUserEmail(email);
    if (userEmail) {
    }
    addMessage(email, true, "text");
    setCurrentInput("");

    try {
      await patchMe(token!, { alias: userName }); // save alias+email
      await patchEmail(token!, { email }); // save alias+email
    } catch {
      // non-blocking; user can proceed
    }

    // Move to class selection
    addMessage("Awesome! tell me your Class", false, "text");
    setStep("class");
  };

  // Option steps handlers
  const handlePickClass = async (opt: OptionItem) => {
    setSelectedClass(opt);
    const label = /^\d+$/.test(String(opt.name))
      ? `Class ${opt.name}`
      : String(opt.name);
    addMessage(label, true, "text");

    await patchMe(token!, { student_class: String(opt.id) }); // save alias+email
    // dispatch(
    //   setSelectedClassAction({ id: String(opt.id), name: String(opt.name) })
    // );
    addMessage("Now, please select your Board", false, "text");

    setLoadingBoards(true);
    try {
      const boards = await getBoards(token!, String(opt.id));
      const mappedBoards = boards
        .map((b) => ({ id: b.id, name: b.name }))
        .sort((a, b) => String(a.name).localeCompare(String(b.name)));
      setBoardOptions(mappedBoards);
      if (mappedBoards.length === 0)
        showPopup("No boards found for this class");
      setStep("board");
    } catch {
      showPopup("Failed to load boards", "Error");
    } finally {
      setLoadingBoards(false);
    }
  };

  const handlePickBoard = async (opt: OptionItem) => {
    setSelectedBoard(opt);
    addMessage(opt.name, true, "text");
    await patchMe(token!, { board: String(opt.id) });

    if (isSenior) {
      if (!selectedClass) {
        showPopup("Please pick a class first");
        return;
      }
      addMessage("Choose your Stream", false, "text");
      setLoadingStreams(true);
      try {
        const streams = await getStreams(token!, String(selectedClass.id));
        const mappedStreams = streams
          .map((s) => ({ id: s.id, name: s.name }))
          .sort((a, b) => String(a.name).localeCompare(String(b.name)));
        setStreamOptions(mappedStreams);
        if (mappedStreams.length === 0) {
          showPopup("No streams found—enter the school name next");
          setStep("school");
          return;
        }
        setStep("stream");
      } catch {
        showPopup("Failed to load streams", "Error");
      } finally {
        setLoadingStreams(false);
      }
    } else {
      addMessage("Nice! What’s the school’s name?", false, "text");
      setStep("school");
    }
  };

  const handlePickStream = async (opt: OptionItem) => {
    setSelectedStream(opt);
    addMessage(opt.name, true, "text");
    await patchMe(token!, { stream: String(opt.id) });
    addMessage("Nice! What’s the school’s name?", false, "text");
    setStep("school");
  };

  const handleSaveSchool = async () => {
    const name = schoolName.trim();
    if (!name) {
      showPopup("Please enter school name");
      return;
    }
    addMessage(name, true, "text");
    await patchMe(token!, {
      school: name,
    });

    addMessage(
      "Perfect, all set! Let’s get started with personalized lessons.",
      false,
      "text"
    );
    setStep("complete");
  };

  const goHome = () => {
    router.replace({ pathname: "/(main)/animation" }); // keep same navigation
  };

  // Option button
  const OptionBtn = ({
    item,
    onPress,
  }: {
    item: OptionItem;
    onPress: () => void;
  }) => {
    const disabled =
      (step === "board" && loadingBoards) ||
      (step === "stream" && loadingStreams);
    const label =
      step === "class" && /^\d+$/.test(String(item.name))
        ? `Class ${item.name}`
        : String(item.name);
    return (
      <TouchableOpacity
        onPress={!disabled ? onPress : undefined}
        className={`rounded-2xl px-6 py-4 shadow-md ${
          disabled ? "bg-neutral-300" : "bg-[#FF8A00]"
        }`}
        disabled={disabled}
      >
        <Text className="text-white text-[11px] font-semibold">{label}</Text>
      </TouchableOpacity>
    );
  };

  // Two-column grid
  const OptionGrid = ({
    items,
    onPick,
  }: {
    items: OptionItem[];
    onPick: (o: OptionItem) => void;
  }) => {
    const pairs: OptionItem[][] = [];
    for (let i = 0; i < items.length; i += 2) pairs.push(items.slice(i, i + 2));
    return (
      <View className="mt-3">
        {pairs.map((row, rowIdx) => (
          <View key={`row-${rowIdx}`} className="flex-row justify-between mb-3">
            {row.map((o) => (
              <View key={`opt-${String(o.id)}`} className="flex-1 mx-2">
                <OptionBtn item={o} onPress={() => onPick(o)} />
              </View>
            ))}
            {row.length === 1 && (
              <View key={`spacer-${rowIdx}`} className="flex-1 mx-2" />
            )}
          </View>
        ))}
      </View>
    );
  };

  // Message render
  const renderMessage = (m: Message) => (
    <View
      key={m.id}
      className={`flex-row items-start mb-4 ${
        m.isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!m.isUser && <BotIcon />}
      <View
        className={`max-w-[82%] ${
          m.isUser ? "bg-[#F47E54]" : "bg-[#FFF8D9]"
        } px-4 py-3 rounded-2xl ${
          m.isUser ? "rounded-br-md mr-2" : "rounded-bl-md shadow-sm ml-2"
        }`}
      >
        <Text
          className={`text-[14px] leading-6 font-medium ${
            m.isUser ? "text-[#1E1E1ECC]" : "text-zinc-800"
          }`}
        >
          {m.text}
        </Text>
      </View>
      {m.isUser && <UserIcon />}
    </View>
  );

  // Input area visibility: show input for name/email/school
  const showInput = step === "name" || step === "email" || step === "school";

  return (
    <LinearGradient
      colors={["#FFFFFF", "#FFEFE1", "#D9BEA4"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1 px-2 pb-5"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="py-5 px-4 items-end">
          <Text className="text-[13px] text-neutral-500">App Name/logo</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Conversation */}
          {messages.map(renderMessage)}

          {/* Class options */}
          {step === "class" && classOptions.length > 0 && (
            <View className="flex-row mt-1">
              <BotIcon />
              <View className="bg-[#FFF1C6] px-4 py-3 rounded-2xl rounded-bl-md ml-2 flex-1">
                <OptionGrid items={classOptions} onPick={handlePickClass} />
              </View>
            </View>
          )}

          {/* Board options */}
          {step === "board" && boardOptions.length > 0 && (
            <View className="flex-row mt-1">
              <BotIcon />
              <View className="bg-[#FFF1C6] px-4 py-3 rounded-2xl rounded-bl-md ml-2 flex-1">
                <OptionGrid items={boardOptions} onPick={handlePickBoard} />
              </View>
            </View>
          )}

          {/* Stream options (only for 11–12) */}
          {step === "stream" && streamOptions.length > 0 && (
            <View className="flex-row mt-1">
              <BotIcon />
              <View className="bg-[#FFF1C6] px-4 py-3 rounded-2xl rounded-bl-md ml-2 flex-1">
                <OptionGrid items={streamOptions} onPick={handlePickStream} />
              </View>
            </View>
          )}

          {/* School input bubble on the USER side
          {step === "school" && (
            <View className="flex-row mt-1 justify-end">
              <View className="max-w-[82%] px-4 py-3 rounded-2xl bg-[#F47E54] rounded-br-md mr-2">
                <Text className="text-[14px] leading-6 font-medium text-white mb-2">
                  Type school’s name
                </Text>
                <View className="flex-row items-center bg-white border border-[#E8E2D9] rounded-xl px-3 py-1">
                  <TextInput
                    className="flex-1 px-2 py-2 text-[14px] text-zinc-800"
                    placeholder="school’s name"
                    placeholderTextColor="#9A9A9A"
                    value={schoolName}
                    onChangeText={setSchoolName}
                    onSubmitEditing={handleSaveSchool}
                    autoFocus
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSaveSchool}
                  className="self-end mt-3 px-5 py-3 rounded-[10px] bg-[#F98455]"
                >
                  <Text className="text-white font-bold">Continue</Text>
                </TouchableOpacity>
              </View>
              <UserIcon />
            </View>
          )} */}

          {/* Final CTA */}
          {step === "complete" && (
            <View className="flex-row mt-3 mb-3">
              <BotIcon />
              <View className="bg-[#FFF1C6] px-4 py-3 rounded-2xl rounded-bl-md ml-2">
                <Text className="text-[14px] text-zinc-800">
                  All set! Head to your dashboard.
                </Text>
                <TouchableOpacity
                  onPress={goHome}
                  className="self-start mt-3 px-5 py-3 rounded-[10px] bg-[#F98455]"
                >
                  <Text className="text-white font-bold">Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area for name/email with same visual style as other inputs */}
        {showInput && (
          <View className="px-4 pb-5 pt-2">
            <View className="flex-row items-center bg-white border border-gray-400 rounded-xl px-3 py-1">
              <TextInput
                className="flex-1 px-2 py-2 text-[14px] text-zinc-800"
                placeholder={
                  step === "name"
                    ? "Enter name"
                    : step === "email"
                    ? "Enter email"
                    : "Enter school name"
                }
                placeholderTextColor="#9A9A9A"
                value={step === "school" ? schoolName : currentInput}
                onChangeText={(v) =>
                  step === "school" ? setSchoolName(v) : setCurrentInput(v)
                }
                keyboardType={step === "email" ? "email-address" : "default"}
                onSubmitEditing={
                  step === "name"
                    ? handleSubmitName
                    : step === "email"
                    ? handleSubmitEmail
                    : handleSaveSchool
                }
                autoFocus
              />
              <TouchableOpacity
                className="w-11 h-11 rounded-full items-center justify-center"
                onPress={
                  step === "name"
                    ? handleSubmitName
                    : step === "email"
                    ? handleSubmitEmail
                    : handleSaveSchool
                }
              >
                {/* reuse any send icon if preferred */}
                <Text className="text-[16px] text-[#F47E54]">
                  <SendIcon />
                </Text>
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
        />
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
