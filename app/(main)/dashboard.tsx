import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MyLogo2 } from "@/assets/logo2";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { getSubjects } from "@/services/api.edu";
import { LevelCard } from "@/components/dashboard/LevelCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { LayoutChangeEvent } from "react-native";
import { router } from "expo-router";

// Utility progress bar
const ProgressBar = ({
  value,
  track = "#BFB6B0",
  fill = "#EA6A35",
}: {
  value: number;
  track?: string;
  fill?: string;
}) => (
  <View
    className="w-full h-[5px] rounded-full overflow-hidden"
    style={{ backgroundColor: track }}
  >
    <View
      className="h-[10px]"
      style={{
        width: `${Math.max(0, Math.min(100, value ?? 0))}%`,
        backgroundColor: fill,
      }}
    />
  </View>
);

const SubjectRow = ({
  name,
  value,
  fill,
  onLayout,
}: {
  name: string;
  value: number;
  fill: string;
  onLayout?: (e: LayoutChangeEvent) => void;
}) => (
  <View onLayout={onLayout} className="w-full flex-row items-center mb-3">
    <Text className="text-[16px] text-neutral-800 w-[96px]">{name}</Text>
    <View className="flex-1 mx-3">
      <ProgressBar value={value} fill={fill} />
    </View>
    <Text className="text-[14px] text-neutral-700 w-[36px] text-right">
      {value}%
    </Text>
  </View>
);

type Subject = {
  id?: string;
  uuid?: string;
  name?: string;
  title?: string;
  progress?: number;
  percentage?: number;
  completion?: number;
};

const palette = ["#E96A34", "#FFA144", "#F2C335", "#F2C335"];

// Mock subjects to force scrolling during testing
const mockSubjects = Array.from({ length: 10 }, (_, i) => ({
  name: `Subject ${i + 1}`,
  value: Math.floor(Math.random() * 100),
  fill: palette[Math.floor(Math.random() * palette.length)],
}));

const HomeDashboard: React.FC = () => {
  // Read from Redux persistent store
  const token = useSelector((s: RootState) => s.auth.token);
  const userInfo = useSelector((s: RootState) => s.auth.userInfo as any);
  const [rowH, setRowH] = useState<number | null>(null);
  const rowGap = 12; // matches mb-3 on each row (≈12px)
  const capHeight = useMemo(
    () => (rowH ? rowH * 4 + rowGap * 3 : 240), // fallback 240 until measured
    [rowH]
  );

  // Greeting name -> first word only
  const getFirstWord = (s?: string) => {
    if (!s) return "";
    const clean = s.trim().replace(/\s+/g, " ");
    return clean.split(" ")[0] || "";
  };
  const displayName = getFirstWord(userInfo?.alias || userInfo?.name);

  // IDs normalized from persisted userInfo
  const boardId: string | undefined = userInfo?.board;
  const classId: string | undefined = userInfo?.class;
  const streamId: string | undefined = userInfo?.stream;
  const includeStream = Boolean(streamId);

  // Subjects state
  const [list, setList] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Map ALL API subjects with palette cycling (not just top 4)
  const allFromApi = useMemo(() => {
    const colors = ["#E96A34", "#FFA144", "#F2C335", "#F2C335"];
    return (list as Subject[]).map((s, i) => ({
      name: s.name || s.title || `Subject ${i + 1}`,
      value: Math.max(
        0,
        Math.min(100, Number(s.progress ?? s.percentage ?? s.completion ?? 0))
      ),
      fill: colors[i % colors.length],
    }));
  }, [list]);

  // Use API subjects when available, else mock list to force scrolling
  const displaySubjects = allFromApi.length > 0 ? allFromApi : mockSubjects;
  const sortedSubjects = useMemo(
    () => [...displaySubjects].sort((a, b) => b.value - a.value),
    [displaySubjects]
  );

  // Enable inner scrolling when there are more than 4 subjects
  const moreThanFour = sortedSubjects.length > 4;

  return (
    <LinearGradient
      colors={["#FFFFFF", "#F3E8DD", "#E4C7A6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-4 pt-6 flex-row items-center justify-between">
          <MyLogo2 />
          <View className="flex-row items-center">
            <View className="w-9 h-9 rounded-full bg-neutral-200 items-center justify-center mr-3">
              <Text className="text-[16px]">🔔</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(main)/home")}
              className="w-9 h-9 rounded-full bg-neutral-300 items-center justify-center"
            >
              <Text className="text-[16px]">👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome heading */}
        <View className="px-4 mt-5">
          <Text className="text-[24px] font-extrabold text-neutral-900 ml-3">
            Welcome Back, Champion
          </Text>
          <Text className="text-[24px] font-extrabold text-neutral-900 ml-3">
            {displayName || "Username"}
          </Text>
        </View>

        <View className="bg-[#FFD3B3] m-5 rounded-xl">
          <LevelCard />
        </View>

        {/* Ask Your AI Tutor */}
        <View className="px-4 mt-4">
          <View className="bg-[#F15D22] rounded-2xl px-4 py-4">
            <Text className="text-white text-[20px] font-bold mb-1">
              Ask Your AI Tutor
            </Text>
            <Text className="text-white/90 text-[12px] mb-3">
              Doubts, Explainations, personalized study tips.
            </Text>
            <TouchableOpacity activeOpacity={0.8} className="self-start">
              <View className="bg-[#C74D22] px-4 py-2 rounded-xl">
                <Text className="text-white font-semibold text-[16px]">
                  Chat Now
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Study progress (scrolls if > 4, only 4 visible initially) */}
        <View className="px-6 mt-8">
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
                        ? (e) => setRowH(Math.ceil(e.nativeEvent.layout.height))
                        : undefined
                    }
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="pb-20">
          <QuickActions />
        </View>
      </ScrollView>
      <View
        className="bg-white border-t border-neutral-200 flex-row items-center justify-around h-[64px]"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 3,
          elevation: 10,
        }}
      >
        <View className="items-center">
          <Text className="text-[18px]">🏠</Text>
          <Text className="text-[12px] text-neutral-900">Home</Text>
        </View>
        <View className="items-center">
          <Text className="text-[18px]">📚</Text>
          <Text className="text-[12px] text-neutral-600">Subjects</Text>
        </View>
        <View className="items-center">
          <Text className="text-[18px]">📈</Text>
          <Text className="text-[12px] text-neutral-600">Progress</Text>
        </View>
        <View className="items-center">
          <Text className="text-[18px]">📒</Text>
          <Text className="text-[12px] text-neutral-600">Planner</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

export default HomeDashboard;
