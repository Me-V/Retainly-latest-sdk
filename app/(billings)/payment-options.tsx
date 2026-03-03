import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { GPayIcon, PaytmIcon, UpiIcon } from "@/assets/logo2";
import { Image } from "react-native";

// --- REUSABLE PAYMENT OPTION COMPONENT ---
interface PaymentOptionProps {
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
}

const PaymentOption: React.FC<PaymentOptionProps> = ({
  label,
  icon,
  selected,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onSelect}
      className={`flex-row items-center justify-between px-5 py-4 mb-3.5 rounded-2xl ${
        selected
          ? "bg-[#5D2B96] border border-[#FF8A33]" // Highlighted selected state
          : "bg-[#4A257B] border border-transparent" // Normal unselected state
      }`}
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 4,
      }}
    >
      <View className="flex-row items-center">
        {/* Icon Container */}
        <View className="w-10 h-8 items-center justify-center mr-3">
          {icon}
        </View>
        <Text className="text-white font-bold text-[16px] tracking-wide">
          {label}
        </Text>
      </View>

      {/* Custom Radio Button */}
      <View
        className={`w-5 h-5 rounded-full border-[2px] items-center justify-center ${
          selected ? "border-[#FF8A33]" : "border-white/30"
        }`}
      >
        {selected && <View className="w-2.5 h-2.5 bg-[#FF8A33] rounded-full" />}
      </View>
    </TouchableOpacity>
  );
};

export default function PaymentScreen() {
  const router = useRouter();
  // State to track which payment method is selected
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  return (
    <LinearGradient
      // Updated to Deep Purple Gradient
      colors={["#3B0A52", "#180323"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* --- HEADER --- */}
        <View className="flex-row justify-between items-center px-6 pb-2 w-full">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="mt-1"
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>

          {/* Top Right Logo (RetAinly Placeholder) */}
          <Image
            source={require("@/assets/AppLogo.png")}
            className="w-[90px] h-[90px] mt-6"
          />
        </View>

        {/* --- MAIN CONTENT --- */}
        <ScrollView
          className="flex-1 px-5 mt-2"
          contentContainerStyle={{ paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Glow Card Container */}
          <View
            className="bg-[#371A5E] rounded-[32px] p-6 pt-8 pb-8 shadow-2xl border border-white/5"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.3,
              shadowOffset: { width: 0, height: 10 },
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {/* Title */}
            <Text className="text-white text-[22px] font-bold mb-6 tracking-wide">
              Select Payment Method
            </Text>

            {/* --- UPI SECTION --- */}
            <Text className="text-white/80 text-[15px] font-medium mb-4 ml-1">
              UPI
            </Text>

            <PaymentOption
              label="PhonePe"
              selected={selectedMethod === "phonepe"}
              onSelect={() => setSelectedMethod("phonepe")}
              icon={
                // Temporary PhonePe Icon
                <View className="w-10 h-10 bg-[#5F259F] rounded-md items-center justify-center">
                  <Text className="text-white font-bold text-lg">पे</Text>
                </View>
              }
            />

            <PaymentOption
              label="Gpay"
              selected={selectedMethod === "gpay"}
              onSelect={() => setSelectedMethod("gpay")}
              icon={
                <View className="items-center justify-center">
                  <GPayIcon width={40} height={40} />
                </View>
              }
            />

            <PaymentOption
              label="Paytm"
              selected={selectedMethod === "paytm"}
              onSelect={() => setSelectedMethod("paytm")}
              icon={
                <View className="items-center justify-center">
                  <PaytmIcon />
                </View>
              }
            />

            <PaymentOption
              label="Enter UPI ID"
              selected={selectedMethod === "upi_id"}
              onSelect={() => setSelectedMethod("upi_id")}
              icon={
                // Temporary UPI Icon
                <View className="flex-row items-center italic">
                  <UpiIcon />
                </View>
              }
            />

            {/* --- CARDS SECTION --- */}
            <Text className="text-white/80 text-[15px] font-medium mt-6 mb-4 ml-1">
              Cards
            </Text>

            <PaymentOption
              label="Credit /Debit Card"
              selected={selectedMethod === "card"}
              onSelect={() => setSelectedMethod("card")}
              icon={<Ionicons name="card" size={26} color="white" />}
            />

            {/* --- CONTINUE BUTTON --- */}
            {/* --- CONTINUE BUTTON --- */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!selectedMethod} // Disable if nothing is selected
              // 🟢 NEW: Add onPress handler to route based on selection
              onPress={() => {
                if (selectedMethod === "card") {
                  // Replace "/card-details" with your actual route path
                  router.push("/card-details");
                } else {
                  // Handle other payment methods here (e.g., open UPI app)
                  console.log(`Proceeding with ${selectedMethod}`);
                }
              }}
              className={`py-4 rounded-[16px] items-center mt-6 shadow-lg ${
                selectedMethod
                  ? "bg-[#FF8A33] shadow-orange-500/40"
                  : "bg-white/20 shadow-none"
              }`}
            >
              <Text
                className={`font-bold text-[17px] tracking-wide ${
                  selectedMethod ? "text-white" : "text-white/50"
                }`}
              >
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
