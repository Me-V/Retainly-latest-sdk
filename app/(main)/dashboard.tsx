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
import {
  getSubjects,
  getClassboardAnalytics,
  getLeaderboard,
  getLastNDaysAnalytics,
} from "@/services/api.edu";
import { router, Stack, useFocusEffect } from "expo-router"; // 🟢 Import Stack & useFocusEffect
import {
  Fontisto,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { GlowCard } from "@/components/Glow-Card";
import { LiveBadge } from "@/components/dashboard/LiveBadge";
import Svg, { Circle } from "react-native-svg";
import { getHealthPoints } from "@/services/api.auth";

// ... [Keep your ProgressBar, SubjectRow, Types, and mockSubjects exactly as they are] ...

// Mock subjects (Ensure this block exists if you use it below)
const palette = ["#FF8A33", "#F59E51", "#FFB74D", "#FFA726"];
const mockSubjects = Array.from({ length: 10 }, (_, i) => ({
  name: `Subject ${i + 1}`,
  value: Math.floor(Math.random() * 100),
  fill: palette[Math.floor(Math.random() * palette.length)],
}));

// Helper function to get medal colors
const getMedalStyles = (rank: number) => {
  if (rank === 1) return { bg: "#FACC15", text: "#A16207", ribbon: "#EF4444" }; // Gold / Red
  if (rank === 2) return { bg: "#E5E7EB", text: "#4B5563", ribbon: "#22C55E" }; // Silver / Green
  if (rank === 3) return { bg: "#D97706", text: "#78350F", ribbon: "#3B82F6" }; // Bronze / Blue
  return { bg: "#4B5563", text: "#E5E7EB", ribbon: "#374151" }; // Star / Grey
};

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
  const [analyticsData, setAnalyticsData] = useState({
    overall_average: 0,
    attempted_question_count: 0,
    total_question_count: 0,
  });

  // Leaderboard State & Helpers
  type LeaderboardUser = {
    rank: number | null;
    name: string;
    score: number | string;
    isMe?: boolean;
  };
  type LeaderboardData = { top: LeaderboardUser[]; me: LeaderboardUser | null };

  const getMedalStyles = (rank: number | null) => {
    if (rank === 1)
      return { bg: "#FACC15", text: "#A16207", ribbon: "#EF4444" }; // Gold / Red
    if (rank === 2)
      return { bg: "#E5E7EB", text: "#4B5563", ribbon: "#22C55E" }; // Silver / Green
    if (rank === 3)
      return { bg: "#D97706", text: "#78350F", ribbon: "#3B82F6" }; // Bronze / Blue
    return { bg: "#4B5563", text: "#E5E7EB", ribbon: "#374151" }; // Star / Grey
  };

  const [todayLeaders, setTodayLeaders] = useState<LeaderboardData>({
    top: [],
    me: null,
  });

  const [allTimeLeaders, setAllTimeLeaders] = useState<LeaderboardData>({
    top: [],
    me: null,
  });

  // Weekly Graph State
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [weeklyTotal, setWeeklyTotal] = useState(0);

  // Health Points State
  const [healthBalance, setHealthBalance] = useState<number | string>("--");

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
        onBackPress,
      );

      // Remove the listener using the subscription object (Fixes the deprecation error)
      return () => subscription.remove();
    }, []),
  );

  const radius = 36;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const progressOffset =
    circumference - (analyticsData.overall_average / 100) * circumference;

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!token || !boardId || !classId) return;
      try {
        const data = await getClassboardAnalytics(token, {
          boardId,
          classId,
          ...(includeStream ? { streamId } : {}),
        });

        setAnalyticsData({
          overall_average: data.overall_average || 0,
          attempted_question_count: data.attempted_question_count || 0,
          total_question_count: data.total_question_count || 0,
        });
      } catch (error) {
        console.error("Failed to load analytics", error);
      }
    };
    fetchAnalytics();
  }, [token, boardId, classId, streamId, includeStream]);

  // Fetch Both Leaderboards Simultaneously
  useEffect(() => {
    const fetchLeaderboards = async () => {
      if (!token || !boardId || !classId) return;
      try {
        // Fetch Today and All-Time simultaneously using Promise.all for speed
        const [todayData, allTimeData] = await Promise.all([
          getLeaderboard(token, {
            boardId,
            classId,
            streamId: includeStream && streamId ? streamId : undefined,
            mode: "attempts",
            timeframe: "today",
          }),
          getLeaderboard(token, {
            boardId,
            classId,
            streamId: includeStream && streamId ? streamId : undefined,
            mode: "attempts",
            timeframe: "all-time",
          }),
        ]);

        // Helper function to process leaderboard data to prevent duplicating logic
        const processLeaderboard = (data: any) => {
          // 1. Map the top 3 users
          const top3 = (data.top || []).slice(0, 3).map((u: any) => {
            const isMe =
              u.user_id === userInfo?.id || u.user_id === data.my_rank?.user_id;
            return {
              rank: u.rank,
              name: isMe ? displayName || "Me" : u.name || "User",
              score: u.questions_completed ?? 0,
              isMe,
            };
          });

          // 2. Map your own rank ONLY if you are not already in the top 3
          let myRankData = null;
          if (
            data.my_rank &&
            data.my_rank.rank !== null &&
            data.my_rank.rank > 3
          ) {
            myRankData = {
              rank: data.my_rank.rank,
              name: displayName || "Me",
              score: data.my_rank.questions_completed ?? 0,
              isMe: true,
            };
          }

          return { top: top3, me: myRankData };
        };

        // Set state for both!
        setTodayLeaders(processLeaderboard(todayData));
        setAllTimeLeaders(processLeaderboard(allTimeData));
      } catch (error) {
        console.error("Failed to load leaderboards:", error);
      }
    };

    fetchLeaderboards();
  }, [
    token,
    boardId,
    classId,
    streamId,
    includeStream,
    displayName,
    userInfo?.id,
  ]);

  // Fetch Last 7 Days Graph Data
  useEffect(() => {
    const fetchWeeklyStats = async () => {
      if (!token) return;
      try {
        const data = await getLastNDaysAnalytics(token, { n: 7 });

        setWeeklyTotal(data.questions_completed || 0);

        const today = new Date();

        // Calculate the date of Monday for the current week
        const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
        const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;

        const mondayDate = new Date(today);
        mondayDate.setDate(today.getDate() - daysSinceMonday);

        const currentWeekDays = [];
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        // Loop to generate Monday through Sunday for the current week
        for (let i = 0; i < 7; i++) {
          const d = new Date(mondayDate);
          d.setDate(mondayDate.getDate() + i);

          // Format date to strictly match API's 'YYYY-MM-DD'
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const dayName = dayNames[d.getDay()];

          const dayData = (data.daily || []).find(
            (item: any) => item.date === dateStr,
          );

          currentWeekDays.push({
            day: dayName,
            value: dayData ? dayData.questions_completed : 0,
            isToday: d.toDateString() === today.toDateString(),
          });
        }
        setWeeklyData(currentWeekDays);
      } catch (err) {
        console.error("Failed to load weekly stats:", err);
      }
    };
    fetchWeeklyStats();
  }, [token]);

  // ... [Keep handleQuickAction and useEffects for data loading exactly as is] ...
  const handleQuickAction = (key: string) => {
    if (key === "practice") router.push("/practice/chooseSubject");
    if (key === "olympics") router.push("/olympics/quizes");
    if (key === "tutorials") router.push("/tutor/chat");
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

  //Fetch Health Points
  useEffect(() => {
    const fetchHealth = async () => {
      if (!token) return;
      try {
        const data = await getHealthPoints(token);
        if (data && data.balance !== undefined) {
          setHealthBalance(data.balance);
        }
      } catch (error) {
        console.error("Failed to load health points:", error);
      }
    };
    fetchHealth();
  }, [token]);

  const allFromApi = useMemo(() => {
    return (list as any[]).map((s, i) => ({
      name: s.name || s.title || `Subject ${i + 1}`,
      value: Math.max(
        0,
        Math.min(100, Number(s.progress ?? s.percentage ?? s.completion ?? 0)),
      ),
      fill: palette[i % palette.length],
    }));
  }, [list]);

  const displaySubjects = allFromApi.length > 0 ? allFromApi : mockSubjects;
  const sortedSubjects = useMemo(
    () => [...displaySubjects].sort((a, b) => b.value - a.value),
    [displaySubjects],
  );
  const moreThanFour = sortedSubjects.length > 4;

  return (
    <LinearGradient
      colors={["#5A1C44", "#3B0A52", "#3A0353"]}
      start={{ x: 1, y: 1 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
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
        <View className="pt-2 pb-4 flex-row items-center justify-between my-2 px-6">
          {/* Left Side: Health Points Placeholder & Greeting */}
          <View className="flex-row items-center flex-1 ml-2">
            {/* Health Points Indicator */}

            {/* Greeting */}
            <Text className="text-[18px] font-bold text-white">
              Hello,{" "}
              <Text className="text-[#FF8D28]">
                {displayName || "Username"}
              </Text>
            </Text>
          </View>

          {/* Right Side: Notifications & Profile */}
          <View className="flex-row items-center space-x-4 gap-4">
            <View className="flex-row items-center">
              <MaterialCommunityIcons
                name="heart-pulse"
                size={20}
                color="#EF4444"
              />
              <Text className="text-white font-bold text-[16px] ml-1.5">
                {healthBalance}
              </Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="notifications" size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(main)/profile")}>
              <View className="w-9 h-9 rounded-full bg-[#F59E51] items-center justify-center border-2 border-[#3B0A52]">
                <Ionicons name="person" size={18} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ... [Rest of your UI: GlowCards, Floating Nav, etc.] ... */}
        <View className="px-6 space-y-5 gap-5">
          {/* Leaderboard Card */}
          <GlowCard className="p-4 py-5">
            <View className="flex-row items-start">
              {/* --- Reusable Render Function for Leaderboard Items --- */}
              {(() => {
                const renderItem = (item: LeaderboardUser, key: string) => {
                  const styles = getMedalStyles(item.rank);
                  return (
                    <View
                      key={key}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: "rgba(255, 255, 255, 0.04)",
                        borderColor: "rgba(255, 255, 255, 0.08)",
                        borderWidth: 1,
                        borderRadius: 14,
                        paddingVertical: 10,
                        paddingHorizontal: 10,
                        shadowColor: "rgba(255, 255, 255, 0.9)",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 18,
                      }}
                    >
                      <View className="flex-row items-center flex-1 pr-2 overflow-hidden">
                        {/* Medal Icon Composition */}
                        <View className="relative w-5 h-[22px] items-center justify-start mr-2.5 flex-shrink-0">
                          <View className="absolute bottom-0 flex-row w-[12px] justify-between">
                            <View
                              style={{
                                width: 4,
                                height: 8,
                                backgroundColor: styles.ribbon,
                                transform: [{ rotate: "25deg" }],
                              }}
                            />
                            <View
                              style={{
                                width: 4,
                                height: 8,
                                backgroundColor: styles.ribbon,
                                transform: [{ rotate: "-25deg" }],
                              }}
                            />
                          </View>
                          <View
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 8,
                              backgroundColor: styles.bg,
                              alignItems: "center",
                              justifyContent: "center",
                              zIndex: 10,
                            }}
                          >
                            {item.rank === null || item.rank > 3 ? (
                              <Ionicons
                                name="star"
                                size={8}
                                color={styles.text}
                                style={{ marginLeft: 0.5, marginTop: 0.5 }}
                              />
                            ) : (
                              <Text
                                style={{
                                  fontSize: 9,
                                  fontWeight: "bold",
                                  color: styles.text,
                                }}
                              >
                                {item.rank}
                              </Text>
                            )}
                          </View>
                        </View>

                        {/* 🟢 UPDATED: Name Color Conditional & Badge Removed */}
                        <Text
                          className={`text-[13px] font-medium flex-shrink ${
                            item.isMe ? "text-[#FF8D28]" : "text-white"
                          }`}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item.name}
                        </Text>
                      </View>
                      <Text className="text-[#FF8D28] text-[13px] font-bold ml-1 flex-shrink-0">
                        {item.score}
                      </Text>
                    </View>
                  );
                };

                return (
                  <>
                    {/* Left Side: All time */}
                    <View className="flex-1 pr-2">
                      <Text className="text-white font-semibold text-[14px] text-center mb-3">
                        All-time <Text className="text-[#FF8D28]">Leaders</Text>
                      </Text>
                      <View className="gap-y-1.5">
                        {allTimeLeaders.top.map((item, index) =>
                          renderItem(item, `alltime-top-${index}`),
                        )}

                        {allTimeLeaders.top.length > 0 && allTimeLeaders.me && (
                          <View className="flex-row justify-center gap-1.5 my-1">
                            {[1, 2, 3, 4].map((dot) => (
                              <View
                                key={dot}
                                className="w-[3px] h-[3px] rounded-full bg-white/30"
                              />
                            ))}
                          </View>
                        )}
                        {allTimeLeaders.me &&
                          renderItem(allTimeLeaders.me, "alltime-me")}
                      </View>
                    </View>

                    {/* Vertical Divider */}
                    <View className="w-[1px] h-[95%] bg-white/10 self-center rounded-full mx-1" />

                    {/* Right Side: Today */}
                    <View className="flex-1 pl-2">
                      <Text className="text-white font-semibold text-[14px] text-center mb-3">
                        Today's <Text className="text-[#FF8D28]">Leaders</Text>
                      </Text>
                      <View className="gap-y-1.5">
                        {todayLeaders.top.map((item, index) =>
                          renderItem(item, `today-top-${index}`),
                        )}

                        {todayLeaders.top.length > 0 && todayLeaders.me && (
                          <View className="flex-row justify-center gap-1.5 my-1">
                            {[1, 2, 3, 4].map((dot) => (
                              <View
                                key={dot}
                                className="w-[3px] h-[3px] rounded-full bg-white/30"
                              />
                            ))}
                          </View>
                        )}
                        {todayLeaders.me &&
                          renderItem(todayLeaders.me, "today-me")}
                      </View>
                    </View>
                  </>
                );
              })()}
            </View>
          </GlowCard>

          {/* Graph Section */}
          <View className="mt-1 mb-2">
            <GlowCard className="p-4 pt-3">
              <Text className="text-[#FF8D28] text-[16px] font-bold mb-8 text-center">
                Last 7 Days Usage
              </Text>
              {/* Chart Container */}
              <View className="flex-row items-stretch h-[80px] w-full">
                {/* Y-Axis Label */}
                <View className="justify-center items-center w-6 mr-1">
                  <Text
                    className="text-white/60 text-[9px] text-center w-[140px]"
                    style={{ transform: [{ rotate: "-90deg" }] }}
                  >
                    Questions Answered
                  </Text>
                </View>

                {/* Bars & Axes Area */}
                <View className="flex-1 border-l border-b border-white/20 flex-row items-end justify-between px-2 relative pb-0">
                  {weeklyData.map((item, index) => {
                    const maxChartValue =
                      Math.max(...weeklyData.map((d) => d.value)) || 1;

                    // Height calculation (give it a tiny minimum height so 0 isn't completely invisible if desired, but 0 is standard)
                    const barHeight = `${(item.value / maxChartValue) * 100}%`;

                    // Example: Green if they answered more than 20 questions, otherwise Orange
                    let barColor = "";
                    if (item.value >= 10) {
                      barColor = "#4F9C55"; // Green for great performance
                    } else if (item.value >= 7) {
                      barColor = "#D4A03A"; // Yellow/Gold for okay performance
                    } else {
                      barColor = "#C16131"; // Burnt Orange for low performance
                    }

                    return (
                      <View key={index} className="items-center flex-1">
                        {/* Value above the bar */}
                        <Text className="text-white/80 text-[11px] mb-1.5 font-medium">
                          {item.value > 0 ? item.value : ""}
                        </Text>

                        {/* The Solid Bar */}
                        <View
                          style={{
                            height: item.value > 0 ? barHeight : 0,
                            width: "60%",
                            maxWidth: 22,
                            backgroundColor: barColor,
                            borderTopLeftRadius: 2,
                            borderTopRightRadius: 2,
                          }}
                        />

                        {/* X-Axis Day Label */}
                        <Text
                          className={`text-[11px] absolute -bottom-6 ${
                            item.isToday
                              ? "text-[#EF4444] font-bold"
                              : "text-white/60"
                          }`}
                        >
                          {item.day}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Spacer for the X-axis labels */}
              <View className="h-8" />

              {/* Footer Stat */}
              <View className="flex-row justify-center items-center mt-2">
                <Text className="text-white/70 text-[13px]">
                  <Text className="text-[#FF8D28] font-bold">
                    {weeklyTotal}
                  </Text>{" "}
                  Questions Last 7 Days
                </Text>
              </View>
            </GlowCard>
          </View>

          {/* Main Actions & Goal Row (Side by Side) */}
          <View className="flex-row gap-4 mb-6 items-stretch">
            {/* Left Column: Quick Actions */}
            <View className="flex-1 flex-col justify-evenly">
              {/* Start Practice */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleQuickAction("practice")}
              >
                <LinearGradient
                  colors={["#8E2622", "#D64536"]} // Dark to lighter red
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    borderRadius: 16,
                  }}
                >
                  <View className="w-8 h-8 rounded-full bg-black/20 items-center justify-center mr-3">
                    <Ionicons name="play" size={16} color="#FF7A00" />
                  </View>
                  <Text className="flex-1 text-white text-[12px] font-semibold">
                    Start Practice
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="white" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Mock Test */}
              <TouchableOpacity activeOpacity={0.8}>
                <LinearGradient
                  // Dark to lighter brown/orange
                  colors={["#1B521E", "#3A863D"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    borderRadius: 16,
                  }}
                >
                  <View className="w-8 h-8 rounded-xl bg-black/20 items-center justify-center mr-3">
                    <Ionicons name="book" size={16} color="#FFB300" />
                  </View>
                  <Text className="flex-1 text-white text-[12px] font-semibold">
                    Mock Test
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="white" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Math Olympics */}
              {quizzes.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleQuickAction("olympics")}
                  className="relative"
                >
                  <LinearGradient
                    colors={["#875014", "#CA802E"]} // Dark to lighter green
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      borderRadius: 16,
                    }}
                  >
                    <View className="w-8 h-8 bg-black/20 rounded-xl items-center justify-center mr-3">
                      <Image
                        source={require("@/assets/olympiadLogo.png")}
                        className="w-5 h-5"
                        resizeMode="contain"
                      />
                    </View>
                    <Text className="flex-1 text-white text-[12px] font-semibold">
                      Math Olympics
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="white" />
                  </LinearGradient>

                  {/* Live Badge (Absolutely Positioned) */}
                  <View className="absolute top-3 right-1 z-10">
                    <LiveBadge />
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Right Column: Daily Practice Goal */}
            <View className="flex-1">
              <GlowCard className="p-4 items-center justify-center flex-1 py-4">
                <View className="relative w-[88px] h-[88px] items-center justify-center">
                  <View className="absolute inset-0 items-center justify-center">
                    <Svg width="88" height="88">
                      <Circle
                        stroke="rgba(255, 255, 255, 0.1)"
                        fill="none"
                        cx="44"
                        cy="44"
                        r="30"
                        strokeWidth="3"
                      />
                      {/* Filled Progress Circle */}
                      <Circle
                        stroke="#FF8D28"
                        fill="none"
                        cx="44"
                        cy="44"
                        r="30"
                        strokeWidth="3"
                        strokeDasharray={2 * Math.PI * 36}
                        strokeDashoffset={
                          2 * Math.PI * 36 -
                          (analyticsData.overall_average / 100) *
                            (2 * Math.PI * 36)
                        }
                        strokeLinecap="round"
                        transform="rotate(-90 44 44)" // Rotates so the stroke starts from the top
                      />
                    </Svg>
                  </View>

                  <Text className="text-white font-bold text-[18px] z-10">
                    {Number(analyticsData.overall_average.toFixed(1))}%
                  </Text>
                </View>

                <Text className="text-white text-[15px] font-bold text-center mb-1">
                  Your Progress
                </Text>
                <Text className="text-white/60 text-[12px] text-center leading-[18px] mt-1 px-2">
                  You've completed{"\n"}
                  {analyticsData.attempted_question_count}/
                  {analyticsData.total_question_count} questions today.
                </Text>
              </GlowCard>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Navigation Bar */}
      <View className="absolute bottom-6 left-6 right-6 h-[70px] bg-[#2A1C3E]/90 border border-white/10 rounded-[35px] flex-row items-center justify-around shadow-lg px-2 backdrop-blur-md">
        <TouchableOpacity className="items-center justify-center">
          <Ionicons name="home" size={24} color="#F59E51" />
          <Text className="text-[10px] text-white mt-1">Home</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center justify-center opacity-60">
          <MaterialIcons name="my-library-books" size={24} color="white" />
          <Text className="text-[10px] text-white mt-1">Subjects</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center justify-center opacity-60">
          <Fontisto name="heartbeat-alt" size={24} color="white" />
          <Text className="text-[10px] text-white mt-1">Progress</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default HomeDashboard;
