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
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { getSubjects } from "@/services/api.edu";
import Ionicons from "@expo/vector-icons/Ionicons";
import { GlassyListBtn } from "@/components/GlassyListBtn";
import Octicons from "@expo/vector-icons/Octicons";

type Subject = {
  id?: string;
  uuid?: string;
  name?: string;
  title?: string;
};

const getId = (s: Subject) => s.id || s.uuid || "";
const getName = (s: Subject) => s.name || s.title || "Subject";

// --- DUMMY DATA ---
const dummyList: Subject[] = [
  { id: "1", name: "Biology" },
  { id: "2", name: "Physics" },
  { id: "3", name: "Chemistry" },
  { id: "4", name: "History" },
  { id: "5", name: "Civics" },
  { id: "6", name: "Mathematics" },
  { id: "7", name: "Geography" },
  { id: "8", name: "Economics" },
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
  const GLOW_COLOR = "rgba(255, 255, 255, 0.04)";
  const GLOW_SIZE = 20;

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
      // Updated to Deep Purple Gradient
      colors={["#3B0A52", "#180323"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <ScrollView className="flex-1" contentContainerClassName="pb-6 flex-grow">
        {/* Header */}
        <View className="px-6 flex-row justify-between items-center z-10">
          <TouchableOpacity
            onPress={() => router.push("/(main)/dashboard")}
            activeOpacity={0.8}
          >
            <Octicons
              name="home-fill"
              size={28}
              color="#FFA629"
              className="ml-2.5"
            />
          </TouchableOpacity>
          <Image
            source={require("@/assets/AppLogo.png")}
            className="w-[90px] h-[90px] mt-6"
          />
        </View>

        {/* Title */}
        <View className="px-6 items-center z-10">
          <Text className="text-[26px] font-bold text-white mb-2 text-center tracking-wide">
            Select Subject
          </Text>
          <Text className="text-[15px] text-white/70 font-normal text-center">
            What you want to practice today
          </Text>
        </View>

        {/* Main Content Area */}
        <View className="flex-1 items-center px-6 mt-10 mb-10 w-full relative">
          {loading ? (
            <ActivityIndicator size="large" color="#F59E51" className="mt-10" />
          ) : (
            <>
              {/* --- Up Arrow --- */}
              {isScrollable && scrollY > 20 && (
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

              {/* --- GLASS CONTAINER --- */}
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.10)",
                  "rgba(255, 255, 255, 0.03)",
                ]}
                className="rounded-[30px] border border-white/10 p-1 overflow-hidden"
                style={{
                  maxHeight: containerMaxHeight,
                  width: containerWidth,
                  borderRadius: 30,
                }}
              >
                {/* Glow Effects */}
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
                          <GlassyListBtn
                            key={getId(item) || getName(item)}
                            label={getName(item)}
                            onPress={() => handleSelect(item)}
                            numberOfLines={1} // 🟢 Subjects are 1 line
                          />
                        ))
                      )}
                    </ScrollView>
                  </View>
                </View>
              </LinearGradient>

              {/* --- Down Arrow --- */}
              {isScrollable && !atBottom && (
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
