// app/(main)/practice/[subjectId]/chooseChapter.tsx
import React, { useEffect, useMemo, useState } from "react";
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
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { getTopics } from "@/services/api.edu";
import { BackIcon } from "@/assets/logo";
import Ionicons from "@expo/vector-icons/Ionicons";

// --- TYPES ---
type Topic = {
  id: string;
  title: string;
};
const dummyTopics: Topic[] = [
  { id: "1", title: "Kinematics" },
  { id: "2", title: "Laws of Motion" },
  { id: "3", title: "Work, Energy and Power" },
  { id: "4", title: "Rotational Motion" },
  { id: "5", title: "Gravitation" },
  { id: "6", title: "Properties of Solids" },
  { id: "7", title: "Thermodynamics" },
  { id: "8", title: "Oscillations" },
  { id: "9", title: "Waves" },
  { id: "10", title: "Electrostatics" },
  { id: "11", title: "Current Electricity" },
  { id: "12", title: "Magnetic Effects of Current" },
  { id: "13", title: "Electromagnetic Induction" },
  { id: "14", title: "Alternating Current" },
  { id: "15", title: "Optics" },
  { id: "16", title: "Dual Nature of Radiation" },
  { id: "17", title: "Atoms and Nuclei" },
  { id: "18", title: "Electronic Devices" },
];
// --- GLASSY BUTTON COMPONENT (Replaced previous flat orange button) ---
const TopicBtn = ({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    className="w-full mb-4"
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
      className="rounded-2xl py-5 border border-white/20 items-center justify-center px-4"
      style={{ borderRadius: 16 }}
    >
      <Text
        className="text-white font-bold tracking-wide shadow-black/40 text-center"
        style={{ fontSize: 16, textShadowRadius: 2 }}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
    </LinearGradient>
  </TouchableOpacity>
);

export default function SubjectTopics() {
  const router = useRouter();
  const { subjectId, name } = useLocalSearchParams<{
    subjectId: string;
    name?: string;
  }>();
  const token = useSelector((s: RootState) => s.auth.token);
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);

  // Measurements for scroll state
  const [containerH, setContainerH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  // --- DESIGN CONSTANTS ---
  const GLOW_COLOR = "rgba(255, 255, 255, 0.2)";
  const GLOW_SIZE = 12;

  // Responsive Dimensions
  const containerMaxHeight = screenHeight * 0.6;
  const isTablet = screenWidth > 768;
  const containerWidth = isTablet ? 600 : "100%";

  // --- API LOGIC (Unchanged) ---
  useEffect(() => {
    const load = async () => {
      if (!token || !subjectId) return;
      setLoading(true);
      try {
        const res = await getTopics(token, { subjectId: String(subjectId) });
        setTopics(
          (res || []).map((t: any) => ({
            id: String(t.id),
            title: String(t.name ?? t.title ?? ""),
          }))
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, subjectId]);

  const handleOpenTopic = (topic: Topic) => {
    if (!topic?.id) return;
    router.push({
      pathname: "/practice/[topicId]/chooseSubTopics",
      params: {
        topicId: topic.id,
      },
    } as const);
  };

  // --- SCROLL LOGIC (Unchanged logic, mapped to new design vars) ---
  const hasLongItems = useMemo(
    () =>
      topics.some(
        (t) => (t.title?.length ?? 0) > 28 || /\n/.test(t.title ?? "")
      ),
    [topics]
  );
  const manyItems = useMemo(() => topics.length > 5, [topics.length]);

  // Logic to determine if we need the limited height container
  const shouldCapAndScroll =
    manyItems || hasLongItems || contentH > containerMaxHeight;

  // Determine if scrolling is active
  const canScroll = useMemo(
    () => contentH > containerH + 1,
    [contentH, containerH]
  );

  const maxScroll = Math.max(0, contentH - containerH);
  const atBottom = canScroll && scrollY >= maxScroll - 20; // Increased tolerance slightly

  const onContainerLayout = (e: LayoutChangeEvent) => {
    setContainerH(e.nativeEvent.layout.height);
  };
  const onContentSizeChange = (_w: number, h: number) => {
    setContentH(h);
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollY(e.nativeEvent.contentOffset.y);
  };

  return (
    <LinearGradient
      colors={["#C96E25", "#B73403"]} // Updated to Orange/Red gradient
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <ScrollView className="flex-1" contentContainerClassName="pb-6 flex-grow">
        {/* Header */}
        <View className="px-6 flex-row justify-between items-center z-10">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <BackIcon color="white" />
          </TouchableOpacity>
          <Image
            source={require("@/assets/AppLogo.png")} // 🟢 Replace 'logo.png' with your actual file name
            className="w-[90px] h-[90px] mt-6" // 🟢 Size matches your old SVG
          />
        </View>

        {/* Title */}
        <View className="px-6 mt-6 items-center z-10">
          <Text className="text-[28px] font-bold text-white mb-2 text-center">
            Select Chapters
          </Text>
          <Text className="text-[16px] text-white/80 font-medium text-center">
            {name ? `For ${name}` : "Choose what to practice today"}
          </Text>
        </View>

        {/* Main Content Area */}
        <View className="flex-1 items-center px-6 mt-8 mb-10 w-full relative">
          {loading ? (
            <ActivityIndicator size="large" color="white" className="mt-10" />
          ) : (
            <>
              {/* --- Up Arrow --- */}
              {canScroll && scrollY > 20 && (
                <View
                  pointerEvents="none"
                  className="absolute top-[-25px] z-20"
                >
                  <Ionicons name="chevron-up" size={32} color="white" />
                </View>
              )}

              {/* --- GLASS CONTAINER --- */}
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.15)",
                  "rgba(255, 255, 255, 0.05)",
                ]}
                className="rounded-[30px] border border-white/10 p-1 overflow-hidden mt-6"
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

                <View
                  className="w-full px-5 py-6 relative"
                  onLayout={onContainerLayout}
                >
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                    onContentSizeChange={onContentSizeChange}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    scrollEnabled={true}
                  >
                    {topics.length === 0 ? (
                      <Text className="text-white/60 text-[14px] text-center mt-4">
                        No topics found.
                      </Text>
                    ) : (
                      topics.map((item) => (
                        <TopicBtn
                          key={item.id}
                          label={item.title || "Topic"}
                          onPress={() => handleOpenTopic(item)}
                        />
                      ))
                    )}
                  </ScrollView>
                </View>
              </LinearGradient>

              {/* --- Down Arrow --- */}
              {canScroll && !atBottom && (
                <View
                  pointerEvents="none"
                  className="absolute bottom-[-25px] z-20"
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
