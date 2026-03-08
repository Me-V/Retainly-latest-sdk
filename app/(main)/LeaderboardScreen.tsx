import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { getLeaderboard } from "@/services/api.edu";
import { SafeAreaView } from "react-native-safe-area-context";

// --- REUSABLE GLOW CARD COMPONENT ---
const GlowCard = ({ children, className, style, padding = "p-5" }: any) => {
  const GLOW_COLOR = "rgba(255, 255, 255, 0.06)";
  const GLOW_SIZE = 25;

  return (
    <LinearGradient
      colors={["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0.03)"]}
      className={`rounded-[28px] border border-white/10 overflow-hidden relative ${className}`}
      style={style}
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
      <View className={padding}>{children}</View>
    </LinearGradient>
  );
};

// Helper function to get medal colors
const getMedalStyles = (rank: number | null) => {
  if (rank === 1) return { bg: "#FACC15", text: "#A16207", ribbon: "#EF4444" };
  if (rank === 2) return { bg: "#E5E7EB", text: "#4B5563", ribbon: "#22C55E" };
  if (rank === 3) return { bg: "#D97706", text: "#78350F", ribbon: "#3B82F6" };
  return { bg: "#4B5563", text: "#E5E7EB", ribbon: "#374151" };
};

type LeaderboardUser = {
  rank: number | null;
  name: string;
  score: number | string;
  isMe?: boolean;
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const token = useSelector((s: RootState) => s.auth.token);
  const userInfo = useSelector((s: RootState) => s.auth.userInfo as any);

  const boardId: string | undefined = userInfo?.board;
  const classId: string | undefined = userInfo?.class;
  const streamId: string | undefined = userInfo?.stream;
  const includeStream = Boolean(streamId);

  const getFirstWord = (s?: string) => {
    if (!s) return "";
    const clean = s.trim().replace(/\s+/g, " ");
    return clean.split(" ")[0] || "";
  };
  const displayName = getFirstWord(userInfo?.alias || userInfo?.name);

  const [todayTop, setTodayTop] = useState<LeaderboardUser[]>([]);
  const [allTimeTop, setAllTimeTop] = useState<LeaderboardUser[]>([]);
  const [myStats, setMyStats] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      if (!token || !boardId || !classId) return;
      try {
        const [todayData, allTimeData] = await Promise.all([
          getLeaderboard(token, {
            boardId,
            classId,
            streamId: includeStream ? streamId : undefined,
            mode: "attempts",
            timeframe: "today",
          }),
          getLeaderboard(token, {
            boardId,
            classId,
            streamId: includeStream ? streamId : undefined,
            mode: "attempts",
            timeframe: "all-time",
          }),
        ]);

        const processList = (data: any) => {
          return (data.top || []).map((u: any) => {
            const isMe =
              u.user_id === userInfo?.id || u.user_id === data.my_rank?.user_id;
            return {
              rank: u.rank,
              name: isMe ? displayName || "Me" : u.name || "Username",
              score: u.questions_completed ?? 0,
              isMe,
            };
          });
        };

        setTodayTop(processList(todayData));
        setAllTimeTop(processList(allTimeData));

        // Use the all-time stats for the bottom sticky card
        if (allTimeData.my_rank) {
          setMyStats({
            rank: allTimeData.my_rank.rank,
            name: displayName || "Me",
            score: allTimeData.my_rank.questions_completed ?? 0,
            isMe: true,
          });
        }
      } catch (error) {
        console.error("Failed to load leaderboards:", error);
      } finally {
        setLoading(false);
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

  const renderItem = (item: LeaderboardUser, key: string) => {
    const styles = getMedalStyles(item.rank);
    return (
      <View
        key={key}
        className="flex-row items-center justify-between bg-white/5 border border-white/10 rounded-[14px] px-3 py-3 mb-2"
      >
        <View className="flex-row items-center flex-1 pr-2 overflow-hidden">
          {/* Medal Icon */}
          <View className="relative w-5 h-[22px] items-center justify-start mr-3 flex-shrink-0">
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

          <Text
            className={`text-[13px] font-medium flex-shrink ${item.isMe ? "text-[#FF8D28]" : "text-white"}`}
            numberOfLines={1}
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
    <LinearGradient
      colors={["#5A1C44", "#3B0A52", "#3A0353"]}
      start={{ x: 1, y: 1 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        {/* --- HEADER --- */}
        <View className="flex-row items-center px-6 pt-4 pb-2 w-full relative">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="p-2 -ml-2 z-10"
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <View className="absolute inset-0 items-center justify-center pt-4 pointer-events-none">
            <Text className="text-white text-[20px] font-bold tracking-wide">
              Leaderboard
            </Text>
          </View>
        </View>

        {/* --- DUAL COLUMN HEADERS --- */}
        <View className="mx-6 mt-4 mb-2 bg-white/5 border border-white/10 rounded-[20px] p-3 flex-row shadow-sm">
          <View className="flex-1 items-center border-r border-white/10 pr-2">
            <Text className="text-white font-bold text-[14px]">
              All-time <Text className="text-[#FF8D28]">Leaders</Text>
            </Text>
            <Text className="text-white/50 text-[10px] mt-0.5">
              (Questions Answered)
            </Text>
          </View>
          <View className="flex-1 items-center pl-2">
            <Text className="text-white font-bold text-[14px]">
              Today's <Text className="text-[#FF8D28]">Leaders</Text>
            </Text>
            <Text className="text-white/50 text-[10px] mt-0.5">
              (Questions Answered)
            </Text>
          </View>
        </View>

        {/* --- MAIN LIST SCROLLVIEW --- */}
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 130 }}
          showsVerticalScrollIndicator={false}
        >
          <GlowCard padding="p-3">
            {loading ? (
              <ActivityIndicator
                size="large"
                color="#FF8D28"
                className="my-10"
              />
            ) : (
              <View className="flex-row">
                {/* Left Column: All Time */}
                <View className="flex-1 pr-1.5">
                  {allTimeTop.map((item, i) =>
                    renderItem(item, `alltime-${i}`),
                  )}
                </View>
                {/* Vertical Divider */}
                <View className="w-[1px] bg-white/10 rounded-full mx-1 my-2" />
                {/* Right Column: Today */}
                <View className="flex-1 pl-1.5">
                  {todayTop.map((item, i) => renderItem(item, `today-${i}`))}
                </View>
              </View>
            )}
          </GlowCard>
        </ScrollView>

        {/* --- STICKY BOTTOM "ME" CARD --- */}
        <View className="absolute bottom-8 left-6 right-6">
          <GlowCard padding="p-4 flex-row items-center justify-between shadow-2xl">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center mr-4">
                <Ionicons name="camera" size={24} color="white" />
              </View>
              <View className="flex-shrink pr-2">
                <View className="flex-row items-end">
                  <Text className="text-white/60 font-bold text-[16px] mr-1.5">
                    #{myStats?.rank || "--"}
                  </Text>
                  <Text
                    className="text-white font-bold text-[18px]"
                    numberOfLines={1}
                  >
                    {myStats?.name || "Username"}
                  </Text>
                </View>
              </View>
            </View>

            <View className="items-end flex-shrink-0">
              <Text className="text-[#FF8D28] font-extrabold text-[24px]">
                {myStats?.score || "0"}
              </Text>
              <View className="flex-row items-center mt-0.5">
                <Ionicons name="star" size={10} color="#FF8D28" />
                <Text className="text-white/60 text-[10px] ml-1">
                  Questions{"\n"}Answered
                </Text>
              </View>
            </View>
          </GlowCard>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
