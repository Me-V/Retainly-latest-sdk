// app/(main)/practice/index.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { getSubjects } from "@/services/api.edu";
import { BackIcon } from "@/assets/logo";
import Ionicons from "@expo/vector-icons/Ionicons";

type Subject = {
  id?: string;
  uuid?: string;
  name?: string;
  title?: string;
};

const getId = (s: Subject) => s.id || s.uuid || "";
const getName = (s: Subject) => s.name || s.title || "Subject";

// --- GLASSY BUTTON COMPONENT ---
const SubjectBtn = ({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    className="w-full mb-5"
    style={{
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 6,
      elevation: 12,
    }}
  >
    <LinearGradient
      colors={["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.1)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="rounded-2xl py-5 border border-white/20 items-center justify-center"
      style={{ borderRadius: 16 }}
    >
      <Text
        className="text-white font-bold tracking-wide shadow-black/40 text-center px-2"
        style={{ fontSize: 18, textShadowRadius: 2 }}
        adjustsFontSizeToFit={true}
        numberOfLines={1}
      >
        {label}
      </Text>
    </LinearGradient>
  </TouchableOpacity>
);

// --- DUMMY DATA ---
const dummyList: Subject[] = [
  { id: "1", name: "Mathematics" },
  { id: "2", name: "Physics" },
  { id: "3", name: "Chemistry" },
  { id: "4", name: "Biology" },
  { id: "5", name: "Computer Science" },
  { id: "6", name: "English Literature" },
  { id: "7", name: "History" },
  { id: "8", name: "Geography" },
  { id: "9", name: "Civics" },
  { id: "10", name: "Economics" },
  { id: "11", name: "Business Studies" },
  { id: "12", name: "Accountancy" },
  { id: "13", name: "Psychology" },
  { id: "14", name: "Sociology" },
  { id: "15", name: "Political Science" },
  { id: "16", name: "Environmental Science" },
  { id: "17", name: "Physical Education" },
  { id: "18", name: "Art & Design" },
  { id: "19", name: "General Knowledge" },
  { id: "20", name: "Logic & Reasoning" },
];

export default function PracticeSubjects() {
  const router = useRouter();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();

  const token = useSelector((s: RootState) => s.auth.token);
  const userInfo = useSelector((s: RootState) => s.auth.userInfo as any);
  const boardId: string | undefined = userInfo?.board;
  const classId: string | undefined = userInfo?.class;
  const streamId: string | undefined = userInfo?.stream;

  const [data, setData] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  // --- SCROLL STATE LOGIC ---
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  // Glow Config
  const GLOW_COLOR = "rgba(255, 255, 255, 0.2)";
  const GLOW_SIZE = 12;

  useEffect(() => {
    const load = async () => {
      if (!token || !boardId || !classId) return;
      setLoading(true);
      try {
        const res = await getSubjects(token, {
          boardId,
          classId,
          ...(streamId ? { streamId } : {}),
        });
        setData(Array.isArray(res) ? res : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, boardId, classId, streamId]);

  const renderList = data.length > 0 ? data : dummyList;

  // Responsive Dimensions
  const containerMaxHeight = screenHeight * 0.6;
  const isTablet = screenWidth > 768;
  const containerWidth = isTablet ? 600 : "100%";

  // Scroll Logic
  const isScrollable = contentHeight > layoutHeight + 10;
  const maxScroll = Math.max(0, contentHeight - layoutHeight);
  const atBottom = isScrollable && scrollY >= maxScroll - 20;

  const onLayout = (e: LayoutChangeEvent) => {
    setLayoutHeight(e.nativeEvent.layout.height);
  };

  const onContentSizeChange = (_w: number, h: number) => {
    setContentHeight(h);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollY(e.nativeEvent.contentOffset.y);
  };

  const handleSelect = (s: Subject) => {
    const subjectId = getId(s);
    const name = getName(s);
    if (!subjectId) return;

    router.push({
      pathname: "/practice/[subjectId]/chooseChapter",
      params: { subjectId, name },
    } as const);
  };

  return (
    <LinearGradient
      colors={["#C96E25", "#B73403"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <ScrollView className="flex-1" contentContainerClassName="pb-6 flex-grow">
        {/* Header */}
        <View className="px-6 pt-12 flex-row justify-between items-center z-10">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <BackIcon color="white" />
          </TouchableOpacity>
          <View className="w-10 h-10 rounded-full bg-[#E3642A] border border-white/20 items-center justify-center">
            <Text className="text-white font-bold text-[8px]">LOGO</Text>
          </View>
        </View>

        {/* Title */}
        <View className="px-6 mt-6 items-center z-10">
          <Text className="text-[28px] font-bold text-white mb-2 text-center">
            Select Subject
          </Text>
          <Text className="text-[16px] text-white/80 font-medium text-center">
            What you want to practice today
          </Text>
        </View>

        {/* Main Content Area */}
        <View className="flex-1 items-center px-6 mt-8 mb-10 w-full relative">
          {loading ? (
            <ActivityIndicator size="large" color="white" className="mt-10" />
          ) : (
            <>
              {/* --- Up Arrow (Outside Container) --- */}
              {/* {isScrollable && atBottom && (
                <View
                  pointerEvents="none"
                  className="absolute top-[-20px] z-20"
                >
                  <Ionicons name="chevron-up" size={32} color="white" />
                </View>
              )} */}

              {/* --- GLASS CONTAINER --- */}
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.15)",
                  "rgba(255, 255, 255, 0.05)",
                ]}
                className="rounded-[30px] border border-white/10 p-1 overflow-hidden"
                style={{
                  maxHeight: containerMaxHeight,
                  width: containerWidth,
                  borderRadius: 30,
                }}
              >
                {/* Inner Glows */}
                <LinearGradient
                  colors={[GLOW_COLOR, "transparent"]}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: GLOW_SIZE,
                    zIndex: -1,
                  }}
                  pointerEvents="none"
                />
                <LinearGradient
                  colors={["transparent", GLOW_COLOR]}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: GLOW_SIZE,
                    zIndex: -1,
                  }}
                  pointerEvents="none"
                />
                <LinearGradient
                  colors={[GLOW_COLOR, "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: GLOW_SIZE,
                    zIndex: -1,
                  }}
                  pointerEvents="none"
                />
                <LinearGradient
                  colors={["transparent", GLOW_COLOR]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    right: 0,
                    width: GLOW_SIZE,
                    zIndex: -1,
                  }}
                  pointerEvents="none"
                />

                <View className="w-full px-5 py-6 relative">
                  {/* Scrollable List Wrapper */}
                  <View onLayout={onLayout}>
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                      onContentSizeChange={onContentSizeChange}
                      onScroll={onScroll}
                      scrollEventThrottle={16}
                    >
                      {renderList.length === 0 ? (
                        <Text className="text-white/60 text-[14px] text-center mt-4">
                          No subjects available.
                        </Text>
                      ) : (
                        renderList.map((item) => (
                          <SubjectBtn
                            key={getId(item) || getName(item)}
                            label={getName(item)}
                            onPress={() => handleSelect(item)}
                          />
                        ))
                      )}
                    </ScrollView>
                  </View>
                </View>
              </LinearGradient>

              {/* --- Down Arrow (Outside Container) --- */}
              {isScrollable && !atBottom && (
                <View
                  pointerEvents="none"
                  className="absolute bottom-[-5px] z-20"
                >
                  <Ionicons name="chevron-down" size={32} color="white" />
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
