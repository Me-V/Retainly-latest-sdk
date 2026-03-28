import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Octicons } from "@expo/vector-icons";

// Import your API functions
import {
  getHealthPoints,
  getHealthPointsTransactions,
} from "@/services/api.auth";

// --- REUSABLE GLOW CARD COMPONENT ---
const GlowCard = ({ children, className, style, padding = "p-5" }: any) => {
  const GLOW_COLOR = "rgba(255, 255, 255, 0.04)";
  const GLOW_SIZE = 30;

  return (
    <LinearGradient
      colors={["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0.03)"]}
      className={`rounded-[28px] border border-white/10 overflow-hidden relative ${className}`}
      style={style}
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

export default function HealthActivityScreen() {
  const router = useRouter();
  const token = useSelector((s: RootState) => s.auth.token);

  const [balance, setBalance] = useState<number | string>("...");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination States
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Fetch Balance (Runs ONLY on mount)
  useEffect(() => {
    if (!token) return;
    getHealthPoints(token)
      .then((data) => {
        if (data && data.balance !== undefined) setBalance(data.balance);
      })
      .catch((err) => console.error("Error loading balance:", err));
  }, [token]);

  // Fetch Transactions (Runs on mount AND when `page` changes)
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!token || (!hasMore && page > 1)) return;

      try {
        if (page === 1) setLoading(true);
        else setLoadingMore(true);

        // Fetch using the current page state, pageSize = 10 as per your Swagger UI
        const txData = await getHealthPointsTransactions(token, page, 100);

        if (txData && txData.results) {
          if (page === 1) {
            setTransactions(txData.results);
          } else {
            // Append new results to the existing array
            setTransactions((prev) => [...prev, ...txData.results]);
          }
          // The API returns `next: "url..."` if there is another page, or `null` if it's the end
          setHasMore(txData.next !== null);
        }
      } catch (error) {
        console.error("Error loading transactions:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchTransactions();
  }, [token, page]);

  // Helper to format transaction titles
  const getTransactionLabel = (tx: any) => {
    if (tx.amount > 0) return "Purchased";
    if (tx.txn_type === "debit_ai_message") return "AI Question";
    if (tx.txn_type === "debit_penalty") return "Incorrect Penalty";
    return "Transaction";
  };

  // Group transactions for the UI using real API dates
  const groupedTransactions = useMemo(() => {
    if (!transactions.length) return [];

    // Helper to format date (e.g. "4 March 2026")
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleString("default", { month: "long" });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    };

    // Helper to format time (e.g. "02:12 PM")
    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      return `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
    };

    const groups: { date: string; data: any[] }[] = [];

    transactions.forEach((tx) => {
      if (!tx.created_at) return;

      const dateStr = formatDate(tx.created_at);
      const timeStr = formatTime(tx.created_at);

      // Find if we already have a group for this date
      let existingGroup = groups.find((g) => g.date === dateStr);

      if (!existingGroup) {
        // Create new group
        existingGroup = { date: dateStr, data: [] };
        groups.push(existingGroup);
      }

      // Add transaction to group, injecting the parsed time
      existingGroup.data.push({
        ...tx,
        mockTime: timeStr, // Reusing mockTime key so we don't have to change JSX below
      });
    });

    return groups;
  }, [transactions]);

  // Detect when user reaches the bottom of the ScrollView
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;

    // Trigger fetch 50 pixels before they actually hit the bottom
    const paddingToBottom = 50;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    if (isCloseToBottom && !loading && !loadingMore && hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  return (
    <LinearGradient
      // Deep dark purple background matching the screenshot
      colors={["#2E0C54", "#15022B"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["bottom", "left", "right"]}>
        {/* --- HEADER --- */}
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2 w-full mt-2">
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
          <View className="absolute inset-0 items-center justify-center pt-2 pointer-events-none">
            <Text className="text-white text-[19px] font-bold tracking-wide">
              Health Points Activity
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1 mt-4"
          contentContainerStyle={{ paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
          // Attach the scroll listener
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* --- CURRENT HP CARD --- */}
          <View className="px-5 mb-8">
            <GlowCard className="relative" padding="p-5">
              {/* Buy More Button (Absolute Top Right) */}
              <View className="absolute top-4 right-4 z-10">
                <TouchableOpacity
                  className="flex-row items-center bg-[#FF8A33] rounded-xl px-3 py-1.5 shadow-lg"
                  activeOpacity={0.8}
                  onPress={() => router.push("/payment-options")}
                >
                  <MaterialCommunityIcons
                    name="heart-pulse"
                    size={14}
                    color="white"
                  />
                  <Text className="text-white font-bold text-[11px] ml-1.5 uppercase tracking-wider">
                    Buy More
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center pt-2">
                {/* Heart Icon */}
                <View className="mr-2">
                  <MaterialCommunityIcons
                    name="heart-pulse"
                    size={90}
                    color="#EF4444"
                  />
                </View>

                {/* Text Details */}
                <View className="flex-1">
                  <Text className="text-white/80 text-[13px] font-medium tracking-wide mb-1.5">
                    Current HP
                  </Text>
                  <View className="flex-row items-end">
                    <Text className="text-white font-extrabold text-[36px] leading-10">
                      {balance}
                    </Text>
                  </View>
                </View>
              </View>
            </GlowCard>
          </View>

          {/* --- RECENT TRANSACTIONS --- */}
          <View>
            <Text className="text-white text-[17px] font-medium px-6 mb-4">
              Recent Transactions
            </Text>

            <View className="px-5">
              <GlowCard padding="pb-4 pt-2">
                {loading ? (
                  <ActivityIndicator
                    size="large"
                    color="#FF8A33"
                    className="my-10"
                  />
                ) : transactions.length === 0 ? (
                  <Text className="text-white/60 text-center py-6">
                    No recent transactions
                  </Text>
                ) : (
                  <>
                    {/* Your mapped transactions */}
                    {groupedTransactions.map((group, groupIdx) => (
                      <View key={`group-${groupIdx}`}>
                        {/* --- Date Separator --- */}
                        <View className="flex-row items-center justify-center py-3 px-2">
                          <View className="h-[1px] bg-white/10 flex-1" />
                          <View className="bg-white/5 rounded-full px-4 py-1 mx-3">
                            <Text className="text-white/60 text-[12px] font-medium tracking-wider">
                              {group.date}
                            </Text>
                          </View>
                          <View className="h-[1px] bg-white/10 flex-1" />
                        </View>

                        {/* --- Transaction Cluster (Inner Box) --- */}
                        <View className="bg-white/5 rounded-[20px] mx-5 mb-2">
                          {group.data.map((tx: any, txIdx: number) => {
                            const isCredit = tx.amount > 0;
                            const isLastInGroup =
                              txIdx === group.data.length - 1;

                            return (
                              <View
                                key={tx.id}
                                className={`flex-row items-center justify-between px-5 py-4 ${
                                  !isLastInGroup
                                    ? "border-b border-white/5"
                                    : ""
                                }`}
                              >
                                {/* Left: Amount & Title */}
                                <View className="flex-row items-center flex-1">
                                  <Text
                                    className={`font-bold text-[16px] w-[75px] ${
                                      isCredit
                                        ? "text-[#4ADE80]"
                                        : "text-[#FF8A33]"
                                    }`}
                                  >
                                    {isCredit ? "+" : ""}
                                    {tx.amount} HP
                                  </Text>
                                  <Text className="text-white/90 text-[15px] font-medium ml-1">
                                    {getTransactionLabel(tx)}
                                  </Text>
                                </View>

                                {/* Right: Time */}
                                <Text className="text-white/40 text-[11px] font-medium">
                                  {tx.mockTime}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    ))}
                    {/* Small loading spinner at the bottom while fetching page 2, 3, etc. */}
                    {loadingMore && (
                      <View className="py-4 items-center justify-center">
                        <ActivityIndicator size="small" color="#FF8A33" />
                      </View>
                    )}
                  </>
                )}
              </GlowCard>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
