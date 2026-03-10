import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
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

// --- REUSABLE GLOW CARD COMPONENT 2 ---
const GlowCard2 = ({ children, className, style, padding = "p-5" }: any) => {
  const GLOW_COLOR = "rgba(205, 127, 50, 0.2)";
  const GLOW_SIZE = 60;

  return (
    <LinearGradient
      colors={["transparent", "transparent"]}
      className={`rounded-[14px] border border-white/5 overflow-hidden relative ${className}`}
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

  const { type } = useLocalSearchParams<{ type: string }>();
  const isAllTime = type === "all-time";

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

  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [myStats, setMyStats] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!token || !boardId || !classId) return;

      try {
        const data = await getLeaderboard(token, {
          boardId,
          classId,
          streamId: includeStream ? streamId : undefined,
          mode: "attempts",
          timeframe: isAllTime ? "all-time" : "today",
        });

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

        setLeaders(processList(data));

        if (data.my_rank) {
          setMyStats({
            rank: data.my_rank.rank,
            name: displayName || "Me",
            score: data.my_rank.questions_completed ?? 0,
            isMe: true,
          });
        }
      } catch (error) {
        console.error("Failed to load leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [
    token,
    boardId,
    classId,
    streamId,
    includeStream,
    displayName,
    userInfo?.id,
    isAllTime,
  ]);

  const renderItem = (item: LeaderboardUser, key: string) => {
    const styles = getMedalStyles(item.rank);
    return (
      <GlowCard2
        key={key}
        className="mb-3"
        padding="flex-row items-center justify-between px-4 py-3.5"
      >
        {/* LEFT COLUMN: Medal (Fixed width ensures center column stays centered) */}
        <View className="w-[60px] items-start justify-center">
          <View className="relative w-6 h-[26px] items-center justify-start flex-shrink-0">
            <View className="absolute bottom-0 flex-row w-[14px] justify-between">
              <View
                style={{
                  width: 5,
                  height: 10,
                  backgroundColor: styles.ribbon,
                  transform: [{ rotate: "25deg" }],
                }}
              />
              <View
                style={{
                  width: 5,
                  height: 10,
                  backgroundColor: styles.ribbon,
                  transform: [{ rotate: "-25deg" }],
                }}
              />
            </View>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: styles.bg,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              {item.rank === null || item.rank > 3 ? (
                <Ionicons
                  name="star"
                  size={10}
                  color={styles.text}
                  style={{ marginLeft: 0.5, marginTop: 0.5 }}
                />
              ) : (
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "bold",
                    color: styles.text,
                  }}
                >
                  {item.rank}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* CENTER COLUMN: Username */}
        <View className="flex-1 items-center justify-center">
          <Text
            className={`text-[15px] font-medium text-center ${item.isMe ? "text-[#FF8D28]" : "text-white"}`}
            numberOfLines={1}
          >
            {item.isMe ? "You" : item.name}
          </Text>
        </View>

        {/* RIGHT COLUMN: Score */}
        <View className="w-[60px] items-end justify-center">
          <Text className="text-[#FF8D28] text-[15px] font-bold">
            {item.score}
          </Text>
        </View>
      </GlowCard2>
    );
  };

  return (
    <LinearGradient
      colors={["#5A1C44", "#3B0A52", "#3A0353"]}
      start={{ x: 1, y: 1 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView style={{ flex: 1 }} edges={["bottom", "left", "right"]}>
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
              {isAllTime ? "All-time Leaderboard" : "Today's Leaderboard"}{" "}
            </Text>
          </View>
        </View>

        {/* --- SUB HEADER PILL --- */}
        <GlowCard className="mx-6 mt-4 mb-5 bg-transparent border border-white/5 rounded-3xl items-center justify-center">
          <Text className="text-white font-bold text-[16px]">
            {isAllTime ? "All-time " : "Today's "}
            <Text className="text-[#FF8D28]">Leaders</Text>
          </Text>
          <Text className="text-white/50 text-[12px] mt-0.5">
            (Questions Answered)
          </Text>
        </GlowCard>

        {/* --- MAIN LIST SCROLLVIEW --- */}
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 130 }}
          showsVerticalScrollIndicator={false}
        >
          <GlowCard padding="p-4">
            {loading ? (
              <ActivityIndicator
                size="large"
                color="#FF8D28"
                className="my-10"
              />
            ) : leaders.length === 0 ? (
              <Text className="text-white/60 text-center py-6">
                No leaders yet.
              </Text>
            ) : (
              <View>
                {leaders.map((item, i) => renderItem(item, `leader-${i}`))}
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
                <View className="flex-col">
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
