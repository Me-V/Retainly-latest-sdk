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

const dummyData: Topic[] = [
  { id: "1", title: "Projectile Motion" },
  { id: "2", title: "Uniform Circular Motion" },
  { id: "3", title: "Relative Velocity" },
  { id: "4", title: "Newton's First Law" },
  { id: "5", title: "Newton's Second Law" },
  { id: "6", title: "Friction" },
  { id: "7", title: "Circular Motion Dynamics" },
  { id: "8", title: "Work-Energy Theorem" },
  { id: "9", title: "Conservation of Energy" },
  { id: "10", title: "Collisions in 1D" },
];

// --- SOLID PURPLE GLASSY BUTTON COMPONENT (Consistent Design) ---
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
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
    }}
  >
    <LinearGradient
      // Subtle white gradient: Lighter at top (12%), Darker at bottom (4%)
      colors={["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0.04)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="rounded-xl py-4 items-center justify-center border border-white/10"
      style={{ borderRadius: 16 }}
    >
      <Text
        className="text-white font-semibold text-[16px] tracking-wide text-center px-4"
        adjustsFontSizeToFit={true}
        minimumFontScale={0.85}
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
  const GLOW_COLOR = "rgba(255, 255, 255, 0.1)"; // Adjusted for purple theme
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

  // --- SCROLL LOGIC ---
  const canScroll = useMemo(
    () => contentH > containerH + 10,
    [contentH, containerH]
  );

  const maxScroll = Math.max(0, contentH - containerH);
  const atBottom = canScroll && scrollY >= maxScroll - 20;

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
      // Updated to Deep Purple Gradient
      colors={["#3B0A52", "#180323"]}
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
            source={require("@/assets/AppLogo.png")}
            className="w-[90px] h-[90px] mt-6"
          />
        </View>

        {/* Title */}
        <View className="px-6 items-center z-10">
          <Text className="text-[26px] font-bold text-white mb-2 text-center tracking-wide">
            Select Chapters
          </Text>
          <Text className="text-[15px] text-white/70 font-normal text-center">
            {name ? `For ${name}` : "Choose what to practice today"}
          </Text>
        </View>

        {/* Main Content Area */}
        <View className="flex-1 items-center px-6 mt-10 mb-10 w-full relative">
          {loading ? (
            <ActivityIndicator size="large" color="#F59E51" className="mt-10" />
          ) : (
            <>
              {/* --- Up Arrow --- */}
              {canScroll && scrollY > 20 && (
                <View
                  pointerEvents="none"
                  className="absolute top-[-30px] z-20 items-center justify-center w-full"
                >
                  <Ionicons
                    name="chevron-up"
                    size={24}
                    color="white"
                    style={{ opacity: 0.8 }}
                  />
                </View>
              )}

              {/* --- GLASS CONTAINER WITH WHITE GRADIENT BACKGROUND --- */}
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.15)", // Lighter white at top
                  "rgba(255, 255, 255, 0.02)", // Fades to clear/dark at bottom
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
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
                      <Text className="text-white/60 text-[14px] text-center">
                        No chapters found.
                      </Text>
                    ) : (
                      topics.map((item) => (
                        <TopicBtn
                          key={item.id}
                          label={item.title || "Chapter"}
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
                  className="absolute bottom-[-10px] z-20 items-center justify-center w-full"
                >
                  <Ionicons
                    name="chevron-down"
                    size={24}
                    color="white"
                    style={{ opacity: 0.8 }}
                  />
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
