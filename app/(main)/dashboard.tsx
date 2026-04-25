import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  BackHandler, // 🟢 Import BackHandler
  Platform,
} from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { registerDeviceToken } from "@/services/api.auth";
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
import { router, Stack, useFocusEffect } from "expo-router";
import { GlowCard } from "@/components/Glow-Card";
import { getHealthPoints } from "@/services/api.auth";
import LeaderboardSection from "@/components/dashboard/LeaderboardSection";
import QuickActionsLeft from "@/components/dashboard/QuickActionsLeft";
import DailyProgressCard from "@/components/dashboard/DailyProgressCard";
import FloatingBottomBar from "@/components/dashboard/FloatingBottomBar";
import HomeHeader from "@/components/dashboard/Header";

const HomeDashboard: React.FC = () => {
  const token = useSelector((s: RootState) => s.auth.token);
  const userInfo = useSelector((s: RootState) => s.auth.userInfo as any);
  // const [rowH, setRowH] = useState<number | null>(null);
  // const rowGap = 12;
  // const capHeight = useMemo(() => (rowH ? rowH * 4 + rowGap * 3 : 240), [rowH]);

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

  const getFirebaseToken = async () => {
    // 🟢 1. Physical Device Check (Prevents crashes on simulators)
    if (!Device.isDevice) {
      console.log("Must use physical device for Push Notifications");
      return;
    }

    // 🟢 2. Required Android Notification Channel Configuration
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C", // You can change this to match your app's brand color
      });
    }

    // 🟢 3. Safe Permissions Flow
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permission not granted!");
      return;
    }

    try {
      // Fetch the raw device token (FCM token on Android)
      const deviceTokenData = await Notifications.getDevicePushTokenAsync();
      const firebaseToken = deviceTokenData.data;

      // 🔥 Call API
      if (token) {
        await registerDeviceToken(token, {
          token: firebaseToken,
          platform: Platform.OS,
          device_id: userInfo?.id?.toString() || "unknown-device",
          app_version: "1.0.0",
        });
      }
    } catch (error) {
      console.error("Error fetching Firebase token: ", error);
    }
  };

  useEffect(() => {
    if (token) {
      getFirebaseToken();
    }
  }, [token]);

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

  // const radius = 36;
  // const strokeWidth = 6;
  // const circumference = 2 * Math.PI * radius;
  // const progressOffset =
  //   circumference - (analyticsData.overall_average / 100) * circumference;

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
    if (key === "mock") router.push("/VoiceTester");
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

  // const displaySubjects = allFromApi.length > 0 ? allFromApi : mockSubjects;
  // const sortedSubjects = useMemo(
  //   () => [...displaySubjects].sort((a, b) => b.value - a.value),
  //   [displaySubjects],
  // );
  // const moreThanFour = sortedSubjects.length > 4;

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
        <HomeHeader displayName={displayName} healthBalance={healthBalance} />

        <View className="px-6 space-y-5 gap-5">
          {/* Leaderboard Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/(main)/LeaderboardScreen")}
          >
            <LeaderboardSection
              todayLeaders={todayLeaders}
              allTimeLeaders={allTimeLeaders}
            />
          </TouchableOpacity>

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
                  {/* Check if there is NO data and show the placeholder text */}
                  {weeklyTotal === 0 ? (
                    <View className="absolute inset-0 items-center justify-center bottom-4">
                      <Text className="text-white/60 text-[11px] text-center px-4">
                        No Progress in last week. You are{"\n"}lagging behind!!
                      </Text>
                    </View>
                  ) : null}
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
                  <Text className="text-[#EF4444] font-bold">
                    {" "}
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
            <QuickActionsLeft
              onQuickAction={handleQuickAction}
              showOlympics={quizzes.length > 0}
            />

            <DailyProgressCard
              overallAverage={analyticsData.overall_average}
              attempted={analyticsData.attempted_question_count}
              total={analyticsData.total_question_count}
            />
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Navigation Bar */}
      <View className="absolute bottom-6 left-6 right-6 h-[70px] bg-[#2A1C3E]/90 border border-white/10 rounded-[35px] flex-row items-center justify-around shadow-lg px-2 backdrop-blur-md">
        <FloatingBottomBar />
      </View>
    </LinearGradient>
  );
};

export default HomeDashboard;
