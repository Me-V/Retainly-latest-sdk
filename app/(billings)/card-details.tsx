import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function AddCardScreen() {
  const router = useRouter();

  // State for the form inputs
  const [nameOnCard, setNameOnCard] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [nickname, setNickname] = useState<string | null>(null);

  // Configuration for the glow (from SignInScreen)
  const GLOW_COLOR = "rgba(255, 255, 255, 0.02)";
  const GLOW_SIZE = 50;

  return (
    <LinearGradient
      // Deep dark purple background matching your design
      colors={["#2E0C54", "#15022B"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* --- HEADER --- */}
        <View className="px-6 pt-6 pb-6 w-full">
          <View className="flex-row items-center mb-4">
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.8}
              className="-ml-2 pr-2"
            >
              <Ionicons name="chevron-back" size={28} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-[24px] font-bold ml-1 tracking-wide">
              Add a Card
            </Text>
          </View>

          {/* Subtitle text */}
          <Text className="text-white font-bold text-[15px] mb-1">
            All major credit and debit cards accepted
          </Text>
          <Text className="text-white/70 text-[13px]">
            (Visa, Mastercard, RuPay, American Express)
          </Text>
        </View>

        {/* --- MAIN CONTENT --- */}
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
        >
          {/* --- CARD CONTAINER (With Fixed 4-Sided Glow from Login Screen) --- */}
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className={`rounded-[24px] border border-white/10 overflow-hidden mt-4`}
          >
            {/* Top Glow */}
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
            {/* Bottom Glow */}
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
            {/* Left Glow */}
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
            {/* Right Glow */}
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

            {/* Inner Content Wrapper */}
            <View className="p-6 pt-8 pb-8 w-full relative">
              {/* Input 1: Name on Card */}
              <View className="mb-6">
                <TextInput
                  value={nameOnCard}
                  onChangeText={setNameOnCard}
                  placeholder="Name on Card"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  className="text-white text-[16px] pb-3 border-b border-white/20 font-medium"
                />
              </View>

              {/* Input 2: Card number */}
              <View className="mb-6">
                <TextInput
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  placeholder="Card number"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  keyboardType="numeric"
                  className="text-white text-[16px] pb-3 border-b border-white/20 font-medium"
                />
              </View>

              {/* Input 3: Expiry date (MM/YY) */}
              <View className="mb-8">
                <TextInput
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                  placeholder="Expiry date (MM/YY)"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  keyboardType="numeric"
                  className="text-white text-[16px] pb-3 border-b border-white/20 font-medium"
                />
              </View>

              {/* Input 4: Nickname for card */}
              <View className="mb-8">
                <Text className="text-white/50 text-[16px] font-medium mb-5">
                  Nickname for card
                </Text>

                {/* --- PILL BUTTONS SECTION --- */}
                <View className="flex-row justify-between mb-5">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setNickname("Personal")}
                    className={`border rounded-[20px] py-2.5 px-6 ${
                      nickname === "Personal"
                        ? "border-[#FF8A33] bg-[#FF8A33]/10"
                        : "border-white/20 bg-transparent"
                    }`}
                  >
                    <Text
                      className={`text-[14px] font-medium ${
                        nickname === "Personal"
                          ? "text-[#FF8A33]"
                          : "text-white/70"
                      }`}
                    >
                      Personal
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setNickname("Business")}
                    className={`border rounded-[20px] py-2.5 px-6 ${
                      nickname === "Business"
                        ? "border-[#FF8A33] bg-[#FF8A33]/10"
                        : "border-white/20 bg-transparent"
                    }`}
                  >
                    <Text
                      className={`text-[14px] font-medium ${
                        nickname === "Business"
                          ? "text-[#FF8A33]"
                          : "text-white/70"
                      }`}
                    >
                      Business
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setNickname("Other")}
                    className={`border rounded-[20px] py-2.5 px-6 ${
                      nickname === "Other"
                        ? "border-[#FF8A33] bg-[#FF8A33]/10"
                        : "border-white/20 bg-transparent"
                    }`}
                  >
                    <Text
                      className={`text-[14px] font-medium ${
                        nickname === "Other"
                          ? "text-[#FF8A33]"
                          : "text-white/70"
                      }`}
                    >
                      Other
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Bottom line under pills matching the screenshot */}
                <View className="border-b border-white/20" />
              </View>

              {/* --- MAKE PAYMENT BUTTON --- */}
              <View className="items-center mt-2 mb-2">
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="bg-[#FF8A33] rounded-[16px] py-4 px-12 shadow-lg shadow-orange-500/40"
                >
                  <Text className="text-white text-[16px] font-bold tracking-wide">
                    Make Payment
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
