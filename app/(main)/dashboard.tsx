import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  LayoutChangeEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { getSubjects } from "@/services/api.edu";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// Utility progress bar
const ProgressBar = ({
  value,
  track = "rgba(255,255,255,0.2)",
  fill = "#F59E51",
}: {
  value: number;
  track?: string;
  fill?: string;
}) => (
  <View
    className="w-full h-[6px] rounded-full overflow-hidden"
    style={{ backgroundColor: track }}
  >
    <View
      className="h-full rounded-full"
      style={{
        width: `${Math.max(0, Math.min(100, value ?? 0))}%`,
        backgroundColor: fill,
      }}
    />
  </View>
);

// const SubjectRow = ({
//   name,
//   value,
//   fill,
//   onLayout,
// }: {
//   name: string;
//   value: number;
//   fill: string;
//   onLayout?: (e: LayoutChangeEvent) => void;
// }) => (
//   <View onLayout={onLayout} className="w-full flex-row items-center mb-4">
//     <View className="flex-1">
//       <View className="flex-row justify-between mb-1">
//         <Text className="text-[14px] text-white/90 font-medium">{name}</Text>
//         <Text className="text-[12px] text-white/70">{value}%</Text>
//       </View>
//       <ProgressBar value={value} fill={fill} />
//     </View>
//   </View>
// );

type Subject = {
  id?: string;
  uuid?: string;
  name?: string;
  title?: string;
  progress?: number;
  percentage?: number;
  completion?: number;
};

// Mock subjects
const palette = ["#FF8A33", "#F59E51", "#FFB74D", "#FFA726"];
const mockSubjects = Array.from({ length: 10 }, (_, i) => ({
  name: `Subject ${i + 1}`,
  value: Math.floor(Math.random() * 100),
  fill: palette[Math.floor(Math.random() * palette.length)],
}));

const HomeDashboard: React.FC = () => {
  const token = useSelector((s: RootState) => s.auth.token);
  const userInfo = useSelector((s: RootState) => s.auth.userInfo as any);
  const [rowH, setRowH] = useState<number | null>(null);
  const rowGap = 12;
  const capHeight = useMemo(() => (rowH ? rowH * 4 + rowGap * 3 : 240), [rowH]);

  const getFirstWord = (s?: string) => {
    if (!s) return "";
    const clean = s.trim().replace(/\s+/g, " ");
    return clean.split(" ")[0] || "";
  };
  const displayName = getFirstWord(userInfo?.alias || userInfo?.name);

  const boardId: string | undefined = userInfo?.board;
  const classId: string | undefined = userInfo?.class;
  const streamId: string | undefined = userInfo?.stream;
  const includeStream = Boolean(streamId);

  const [list, setList] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  // Configuration for the glow design
  const GLOW_COLOR = "rgba(255, 255, 255, 0.15)";
  const GLOW_SIZE = 12;

  // --- Logic restored from QuickActions component ---
  const handleQuickAction = (key: string) => {
    if (key === "practice") {
      // Functional navigation restored
      router.push("/practice/chooseSubject");
    }
    if (key === "olympics") {
      // Functional navigation restored
      router.push("/olympics/quizes");
    }
    // Placeholder for other actions
    console.log("Quick Action Pressed:", key);
  };

  useEffect(() => {
    const load = async () => {
      if (!token || !boardId || !classId) return;
      setLoading(true);
      try {
        const subjects = await getSubjects(token, {
          boardId,
          classId,
          ...(includeStream ? { streamId } : {}),
        });
        setList(Array.isArray(subjects) ? subjects : []);
      } catch (e: any) {
        console.error("Subjects load error:", e);
        setList([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, boardId, classId, streamId, includeStream]);

  const allFromApi = useMemo(() => {
    return (list as Subject[]).map((s, i) => ({
      name: s.name || s.title || `Subject ${i + 1}`,
      value: Math.max(
        0,
        Math.min(100, Number(s.progress ?? s.percentage ?? s.completion ?? 0))
      ),
      fill: palette[i % palette.length],
    }));
  }, [list]);

  const displaySubjects = allFromApi.length > 0 ? allFromApi : mockSubjects;
  const sortedSubjects = useMemo(
    () => [...displaySubjects].sort((a, b) => b.value - a.value),
    [displaySubjects]
  );

  const moreThanFour = sortedSubjects.length > 4;

  const GlowCard = ({
    children,
    className = "",
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <LinearGradient
      colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className={`rounded-[24px] border border-white/10 overflow-hidden ${className}`}
    >
      <LinearGradient
        colors={[GLOW_COLOR, "transparent"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: GLOW_SIZE,
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
        }}
        pointerEvents="none"
      />
      {children}
    </LinearGradient>
  );

  return (
    <LinearGradient
      // Warm tint at top-left (#5A1C44) fading to dark purple
      colors={["#5A1C44", "#3B0A52", "#3A0353"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-6 pt-12 flex-row items-center justify-between mb-6">
          <View className="w-12 h-12 rounded-full bg-[#F59E51] items-center justify-center">
            <Text className="text-white font-bold text-xs">LOGO</Text>
          </View>
          <View className="flex-row items-center space-x-4 gap-4">
            <TouchableOpacity>
              <Ionicons name="notifications" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(main)/profile2")}>
              <View className="w-10 h-10 rounded-full bg-[#F59E51] items-center justify-center border-2 border-[#3B0A52]">
                <Ionicons name="person" size={20} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Text */}
        <View className="px-6 mb-8">
          <Text className="text-[28px] font-bold text-white leading-tight">
            Welcome Back, Champion
          </Text>
          <Text className="text-[28px] font-bold text-white leading-tight">
            {displayName || "Username"}
          </Text>
        </View>

        {/* --- CARDS SECTION --- */}
        <View className="px-6 space-y-5 gap-5">
          {/* Ask AI Tutor Card */}
          <GlowCard className="flex-row items-center p-5 py-6">
            <View className="mr-4">
              <Ionicons name="bulb" size={96} color="#FBC02D" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-[24px] font-bold mb-1">
                Ask Your AI Tutor
              </Text>
              <Text className="text-white/70 text-[16px] leading-5">
                Solve doubts. Get instant explanations.
              </Text>
            </View>
          </GlowCard>

          {/* Daily Practice Goal Card */}
          <GlowCard className="flex-row items-center px-5 py-10 h-32">
            <View className="w-24 h-24 rounded-full border-4 border-[#F59E51] items-center justify-center mr-5">
              <Text className="text-white font-bold text-[20px]">80%</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white text-[20px] font-bold mb-1">
                Daily Practice Goal
              </Text>
              <Text className="text-white/70 text-[16px] leading-5 mt-1">
                You've completed 20/50 questions today.
              </Text>
            </View>
          </GlowCard>

          {/* <View className="px-6 mt-8">
            <Text className="text-[20px] font-extrabold text-neutral-900 mb-3">
              Study progress
            </Text>

            {loading ? (
              <ActivityIndicator />
            ) : displaySubjects.length === 0 ? (
              <Text className="text-neutral-600 text-[12px] mb-2">
                No subjects available.
              </Text>
            ) : (
              <View
                style={{
                  width: "100%",
                  maxHeight: moreThanFour ? capHeight : undefined,
                }}
              >
                <ScrollView
                  style={{ width: "100%" }}
                  contentContainerStyle={{ paddingBottom: 0 }}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={moreThanFour}
                  nestedScrollEnabled
                >
                  {sortedSubjects.map((s, i) => (
                    <SubjectRow
                      key={`${s.name}-${i}`}
                      name={s.name}
                      value={s.value}
                      fill={s.fill}
                      onLayout={
                        i === 0 && !rowH
                          ? (e) =>
                              setRowH(Math.ceil(e.nativeEvent.layout.height))
                          : undefined
                      }
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </View> */}

          {/* Quick Actions List (FUNCTIONAL) */}
          <GlowCard className="p-0">
            {/* Start Practice - Wired to Router */}
            <TouchableOpacity
              onPress={() => handleQuickAction("practice")}
              className="flex-row items-center p-5 active:bg-white/5"
            >
              <View className="w-10 h-10 rounded-full bg-[#C65D3B]/40 items-center justify-center mr-4">
                <Ionicons name="play" size={20} color="#F59E51" />
              </View>
              <Text className="flex-1 text-white text-[20px] font-semibold">
                Start Practice
              </Text>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>

            {/* Mock Test */}
            <TouchableOpacity
              onPress={() => handleQuickAction("mock")}
              className="flex-row items-center p-5 active:bg-white/5"
            >
              <View className="w-10 h-10 rounded-full bg-[#C99C33]/40 items-center justify-center mr-4">
                <Ionicons name="document-text" size={20} color="#FBC02D" />
              </View>
              <Text className="flex-1 text-white text-[20px] font-semibold">
                Mock Test
              </Text>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickAction("olympics")}
              className="flex-row items-center p-5 active:bg-white/5"
            >
              <View className="w-10 h-10 rounded-full bg-[#C99C33]/40 items-center justify-center mr-4">
                <Ionicons name="search" size={20} color="#FBC02D" />
              </View>
              <Text className="flex-1 text-white text-[20px] font-semibold">
                Olympics
              </Text>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          </GlowCard>
        </View>
      </ScrollView>

      {/* Floating Bottom Navigation Bar */}
      <View className="absolute bottom-6 left-6 right-6 h-[70px] bg-[#2A1C3E]/90 border border-white/10 rounded-[35px] flex-row items-center justify-around shadow-lg px-2 backdrop-blur-md">
        <TouchableOpacity className="items-center justify-center">
          <Ionicons name="home" size={24} color="#F59E51" />
          <Text className="text-[10px] text-white mt-1">Home</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center justify-center opacity-60">
          <Ionicons name="book" size={24} color="white" />
          <Text className="text-[10px] text-white mt-1">Subjects</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center justify-center opacity-60">
          <Ionicons name="stats-chart" size={24} color="white" />
          <Text className="text-[10px] text-white mt-1">Progress</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center justify-center opacity-60">
          <Ionicons name="calendar" size={24} color="white" />
          <Text className="text-[10px] text-white mt-1">Planner</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default HomeDashboard;
