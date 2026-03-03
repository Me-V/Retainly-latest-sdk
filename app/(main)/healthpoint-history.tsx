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
import Svg, { Path } from "react-native-svg";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { SafeAreaView } from "react-native-safe-area-context";

// Import your API functions
import {
  getHealthPoints,
  getHealthPointsTransactions,
} from "@/services/api.auth";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// --- CUSTOM HEART ICON (Matching Screenshot) ---
const HeartIcon = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill="#E11D48" // Red color
    />
    <Path
      d="M11 11H8v2h3v3h2v-3h3v-2h-3V8h-2v3z"
      fill="#FCA5A5" // Light red/pink plus sign
    />
  </Svg>
);

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

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        // Fetch Balance
        const balanceData = await getHealthPoints(token);
        if (balanceData && balanceData.balance !== undefined) {
          setBalance(balanceData.balance);
        }

        // Fetch Transactions
        const txData = await getHealthPointsTransactions(token, 1, 100);
        if (txData && txData.results) {
          setTransactions(txData.results);
        }
      } catch (error) {
        console.error("Error loading health data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Helper to format transaction titles based on your JSON response
  const getTransactionLabel = (tx: any) => {
    if (tx.amount > 0) return "Purchased";
    if (tx.txn_type === "debit_ai_message") return "AI Question";
    if (tx.txn_type === "debit_penalty") return "Incorrect Penalty";
    return "Transaction";
  };

  return (
    <LinearGradient
      // Deep dark purple background matching the screenshot
      colors={["#2E0C54", "#15022B"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* --- HEADER --- */}
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2 w-full">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="p-2 -ml-2 z-10"
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <View className="absolute inset-0 items-center justify-center pt-4 pointer-events-none">
            <Text className="text-white text-[20px] font-bold tracking-wide">
              Health Points Activity
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1 mt-4"
          contentContainerStyle={{ paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
        >
          {/* --- CURRENT HP CARD --- */}
          <View className="px-5 mb-8">
            <GlowCard
              className="flex-row items-center justify-between"
              padding="p-5"
            >
              {/* Left Side: Icon and Balance */}
              <View className="flex-row items-center flex-shrink pr-2">
                <MaterialCommunityIcons
                  name="heart-pulse"
                  size={90}
                  color="#EF4444"
                />
                <View className="ml-4">
                  <Text className="text-white/80 text-[16px] font-medium tracking-wide">
                    Current HP
                  </Text>
                  <Text className="text-white font-extrabold text-[24px] mt-0.5">
                    {balance} HP
                  </Text>
                </View>

                {/* Right Side: Source Info */}
                <View className="items-start flex-shrink-0 ml-8 mt-4">
                  <Text className="text-[#FF8A33] text-[12px] font-medium mb-0.5">
                    +20 From
                  </Text>
                  <Text className="text-[#FF8A33] text-[12px] font-medium">
                    Practice Session
                  </Text>
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
              <GlowCard padding="p-5">
                {loading ? (
                  <ActivityIndicator
                    size="large"
                    color="#FF8A33"
                    className="my-10"
                  />
                ) : transactions.length === 0 ? (
                  <Text className="text-white/60 text-center py-4">
                    No recent transactions
                  </Text>
                ) : (
                  transactions.map((tx, index) => {
                    const isCredit = tx.amount > 0;

                    // Note: Your JSON didn't include a date field, so we format based on index for the UI mockup exactly like the screenshot.
                    // Replace this with real date parsing when your backend returns timestamps!
                    const mockedDates = [
                      "Yesterday",
                      "Today",
                      "2 days ago",
                      "6 Day ago",
                    ];
                    const dateText = mockedDates[index % 4];

                    return (
                      <View
                        key={tx.id}
                        className="flex-row items-center justify-between bg-white/5 border border-white/10 rounded-[20px] px-6 py-5 mb-4"
                        style={{
                          shadowColor: "#000",
                          shadowOpacity: 0.1,
                          shadowOffset: { width: 0, height: 2 },
                          shadowRadius: 4,
                        }}
                      >
                        {/* Amount - dynamically colored based on debit/credit */}
                        <Text
                          className={`font-extrabold text-[24px] ${
                            isCredit ? "text-[#FF8A33]" : "text-white"
                          }`}
                        >
                          {isCredit ? "+" : ""}
                          {tx.amount} HP
                        </Text>

                        {/* Title and Date */}
                        <View className="items-end">
                          <Text className="text-white text-[16px] font-medium mb-1">
                            {getTransactionLabel(tx)}
                          </Text>
                          <Text className="text-white/50 text-[12px]">
                            {dateText}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </GlowCard>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
