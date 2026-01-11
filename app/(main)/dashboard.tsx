import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  BackHandler, // 🟢 Import BackHandler
} from "react-native";
import { getLiveQuizzes, OlympicQuiz } from "@/services/api.olympics";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { getSubjects } from "@/services/api.edu";
import { router, Stack, useFocusEffect } from "expo-router"; // 🟢 Import Stack & useFocusEffect
import { Ionicons } from "@expo/vector-icons";
import { GlowCard } from "@/components/Glow-Card";
import { LiveBadge } from "@/components/dashboard/LiveBadge";

// ... [Keep your ProgressBar, SubjectRow, Types, and mockSubjects exactly as they are] ...

// Mock subjects (Ensure this block exists if you use it below)
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

  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [quizzes, setQuizzes] = useState<OlympicQuiz[]>([]);

  // 🟢 SOLUTION 1: Handle Android Hardware Back Button
  // Using 'useFocusEffect' ensures this only runs when the Dashboard is the active screen.
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Exit the app completely when Back is pressed
        BackHandler.exitApp();
        return true; // Stop the event from bubbling up (prevents default back navigation)
      };

      // Add the listener and keep the subscription
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      // Remove the listener using the subscription object (Fixes the deprecation error)
      return () => subscription.remove();
    }, [])
  );

  // ... [Keep handleQuickAction and useEffects for data loading exactly as is] ...
  const handleQuickAction = (key: string) => {
    if (key === "practice") router.push("/practice/chooseSubject");
    if (key === "olympics") router.push("/olympics/quizes");
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
        setList([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, boardId, classId, streamId, includeStream]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        if (token) {
          const data = await getLiveQuizzes(token);
          setQuizzes(data);
        }
      } catch (error) {
        console.error("Failed to load quizzes", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [token]);

  const allFromApi = useMemo(() => {
    return (list as any[]).map((s, i) => ({
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

  return (
    <LinearGradient
      colors={["#5A1C44", "#3B0A52", "#3A0353"]}
      start={{ x: 1, y: 1 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      {/* 🟢 SOLUTION 2: Disable Gestures (Swipe Back) & Remove Header */}
      <Stack.Screen
        options={{
          headerShown: false, // Hides the header (and its back button)
          gestureEnabled: false, // Disables the swipe-to-go-back gesture
          headerLeft: () => null, // Ensures no back button is rendered
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="pt-2 pb-4 flex-row items-center justify-between mb-2">
          <Image
            source={require("@/assets/AppLogo.png")}
            className="w-[100px] h-[100px]"
            resizeMode="contain"
          />
          <View className="flex-row items-center space-x-4 gap-4 mr-10">
            <TouchableOpacity>
              <Ionicons name="notifications" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(main)/profile")}>
              <View className="w-10 h-10 rounded-full bg-[#F59E51] items-center justify-center border-2 border-[#3B0A52]">
                <Ionicons name="person" size={20} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Text */}
        <View className="px-8 mb-8">
          <Text className="text-[28px] font-bold text-white leading-tight">
            Welcome Back, Champion
          </Text>
          <Text className="text-[28px] font-bold text-white leading-tight">
            {displayName || "Username"}
          </Text>
        </View>

        {/* ... [Rest of your UI: GlowCards, Floating Nav, etc.] ... */}
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

          {/* Quick Actions List */}
          <GlowCard className="p-0">
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

            {quizzes.length > 0 && (
              <TouchableOpacity
                onPress={() => handleQuickAction("olympics")}
                className="flex-row items-center p-5 active:bg-white/5"
              >
                <Image
                  source={require("@/assets/olympiadLogo.png")}
                  className="w-[30px] h-[30px] mr-4"
                  resizeMode="contain"
                />
                <View className="flex-1 justify-center">
                  <View className="flex-row items-center self-start">
                    <Text className="text-white text-[20px] font-semibold">
                      Maths Olympics
                    </Text>
                    <LiveBadge />
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="white" />
              </TouchableOpacity>
            )}
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
