import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { GlowCard } from "@/components/Glow-Card";

type LeaderboardUser = {
  rank: number | null;
  name: string;
  score: number | string;
  isMe?: boolean;
};

type LeaderboardData = {
  top: LeaderboardUser[];
  me: LeaderboardUser | null;
};

type Props = {
  todayLeaders: LeaderboardData;
  allTimeLeaders: LeaderboardData;
};

const getMedalStyles = (rank: number | null) => {
  if (rank === 1) return { bg: "#FACC15", text: "#A16207", ribbon: "#EF4444" };
  if (rank === 2) return { bg: "#E5E7EB", text: "#4B5563", ribbon: "#22C55E" };
  if (rank === 3) return { bg: "#D97706", text: "#78350F", ribbon: "#3B82F6" };
  return { bg: "#4B5563", text: "#E5E7EB", ribbon: "#374151" };
};

const LeaderboardSection: React.FC<Props> = ({
  todayLeaders,
  allTimeLeaders,
}) => {
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
          marginBottom: 10,
        }}
      >
        <View className="flex-row items-center flex-1 pr-2 overflow-hidden">
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
                <Ionicons name="star" size={8} color={styles.text} />
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
            className={`text-[13px] font-medium flex-shrink ml-2 ${
              item.isMe ? "text-[#FF8D28]" : "text-white"
            }`}
            numberOfLines={1}
          >
            {item.isMe ? "You" : item.name}
          </Text>
        </View>

        <Text className="text-[#FF8D28] text-[13px] font-bold ml-1">
          {item.score}
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push("/(main)/LeaderboardScreen")}
    >
      <GlowCard className="p-4 py-5">
        <View className="flex-row items-start">
          {/* LEFT */}
          <TouchableOpacity
            className="flex-1 pr-2"
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: "/(main)/LeaderboardScreen",
                params: { type: "all-time" },
              })
            }
          >
            <Text className="text-white font-semibold text-[14px] text-center mb-3">
              All-time <Text className="text-[#FF8D28]">Leaders</Text>
            </Text>

            <View className="gap-y-1.5">
              {allTimeLeaders.top.map((item, index) =>
                renderItem(item, `all-${index}`),
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

              {allTimeLeaders.me && renderItem(allTimeLeaders.me, "all-me")}
            </View>
          </TouchableOpacity>

          {/* DIVIDER */}
          <View
            style={{
              width: 1,
              alignSelf: "stretch",
              backgroundColor: "rgba(255,255,255,0.15)",
              marginHorizontal: 4,
            }}
          />

          {/* RIGHT */}
          <TouchableOpacity
            className="flex-1 pl-2"
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: "/(main)/LeaderboardScreen",
                params: { type: "today" },
              })
            }
          >
            <Text className="text-white font-semibold text-[14px] text-center mb-3">
              Today's <Text className="text-[#FF8D28]">Leaders</Text>
            </Text>

            <View className="gap-y-1.5">
              {todayLeaders.top.map((item, index) =>
                renderItem(item, `today-${index}`),
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

              {todayLeaders.me && renderItem(todayLeaders.me, "today-me")}
            </View>
          </TouchableOpacity>
        </View>
      </GlowCard>
    </TouchableOpacity>
  );
};

export default LeaderboardSection;
