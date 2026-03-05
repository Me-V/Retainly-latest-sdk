import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function AddCardScreen() {
  const router = useRouter();

  // State for the form inputs
  const [nameOnCard, setNameOnCard] = useState("");

  // Separated Card Number States
  const [cardP1, setCardP1] = useState("");
  const [cardP2, setCardP2] = useState("");
  const [cardP3, setCardP3] = useState("");
  const [cardP4, setCardP4] = useState("");

  // Expiry and CVV States
  const [expM, setExpM] = useState("");
  const [expY, setExpY] = useState("");
  const [cvv, setCvv] = useState("");

  const [nickname, setNickname] = useState<string | null>(null);

  // State for Date Picker Modal
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Generate Months (01-12) and Years (Current to +20)
  const months = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, "0"),
  );
  const currentYear = new Date().getFullYear() % 100;
  const years = Array.from({ length: 20 }, (_, i) =>
    (currentYear + i).toString(),
  );

  // Refs for auto-focusing next inputs
  const p1Ref = useRef<TextInput>(null);
  const p2Ref = useRef<TextInput>(null);
  const p3Ref = useRef<TextInput>(null);
  const p4Ref = useRef<TextInput>(null);
  const cvvRef = useRef<TextInput>(null);

  // Configuration for the glow
  const GLOW_COLOR = "rgba(255, 255, 255, 0.02)";
  const GLOW_SIZE = 50;

  // Auto-focus logic handler
  const handleTextChange = (
    text: string,
    setter: any,
    nextRef: any,
    maxLength: number,
  ) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    setter(numericValue);
    if (numericValue.length === maxLength && nextRef) {
      nextRef.current?.focus();
    }
  };

  // Backspace focus handler
  const handleKeyPress = (e: any, prevRef: any, currentValue: string) => {
    if (
      e.nativeEvent.key === "Backspace" &&
      currentValue.length === 0 &&
      prevRef
    ) {
      prevRef.current?.focus();
    }
  };

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
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Glow Card Container */}
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className={`rounded-[32px] border border-white/10 overflow-hidden mt-4`}
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
              <View className="mb-7">
                <Text className="text-white/70 text-[13px] font-medium mb-2 ml-1 uppercase tracking-wider">
                  Name on Card
                </Text>
                <TextInput
                  value={nameOnCard}
                  onChangeText={setNameOnCard}
                  placeholder="e.g. John Doe"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  autoCapitalize="words"
                  // 🟢 REMOVED bg-white/5 & shadow-sm, ADDED bg-transparent & border-white/20
                  className="bg-transparent border border-white/20 rounded-[14px] px-4 py-4 text-white text-[16px] font-medium"
                />
              </View>

              {/* Input 2: Modern Card Number (4 Blanks) */}
              <View className="mb-7">
                <Text className="text-white/70 text-[13px] font-medium mb-2 ml-1 uppercase tracking-wider">
                  Card Number
                </Text>
                <View className="flex-row justify-between w-full">
                  {[
                    {
                      val: cardP1,
                      set: setCardP1,
                      ref: p1Ref,
                      next: p2Ref,
                      prev: null,
                    },
                    {
                      val: cardP2,
                      set: setCardP2,
                      ref: p2Ref,
                      next: p3Ref,
                      prev: p1Ref,
                    },
                    {
                      val: cardP3,
                      set: setCardP3,
                      ref: p3Ref,
                      next: p4Ref,
                      prev: p2Ref,
                    },
                    {
                      val: cardP4,
                      set: setCardP4,
                      ref: p4Ref,
                      next: cvvRef,
                      prev: p3Ref,
                    }, // Jumps to CVV
                  ].map((block, idx) => (
                    <TextInput
                      key={idx}
                      ref={block.ref}
                      value={block.val}
                      onChangeText={(t) =>
                        handleTextChange(t, block.set, block.next, 4)
                      }
                      onKeyPress={(e) =>
                        handleKeyPress(e, block.prev, block.val)
                      }
                      placeholder="0000"
                      placeholderTextColor="rgba(255, 255, 255, 0.2)"
                      keyboardType="number-pad"
                      maxLength={4}
                      style={{ textAlign: "center" }}
                      className="flex-1 mx-1 bg-transparent border border-white/20 rounded-[14px] h-[52px] text-white text-[17px] font-bold"
                    />
                  ))}
                </View>
              </View>

              {/* Input 3: Expiry & CVV Row */}
              <View className="flex-row justify-between mb-8">
                {/* Expiry Date (Custom Button triggering Modal) */}
                <View className="flex-1 mr-4">
                  <Text className="text-white/70 text-[13px] font-medium mb-2 ml-1 uppercase tracking-wider">
                    Expiry Date
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setShowDatePicker(true)}
                    className="flex-1 bg-transparent border border-white/20 rounded-[14px] h-[52px] items-center justify-center"
                  >
                    <Text
                      className={`text-[16px] font-semibold ${expM && expY ? "text-white" : "text-white/30"}`}
                    >
                      {`${expM || "MM"} / ${expY || "YY"}`}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* CVV */}
                <View className="flex-1 ml-2">
                  <Text className="text-white/70 text-[13px] font-medium mb-2 ml-1 uppercase tracking-wider">
                    CVV
                  </Text>
                  <TextInput
                    ref={cvvRef}
                    value={cvv}
                    onChangeText={(text) => setCvv(text.replace(/[^0-9]/g, ""))}
                    onKeyPress={(e) => handleKeyPress(e, p4Ref, cvv)}
                    placeholder="•••"
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                    style={{ textAlign: "center" }}
                    className="w-full bg-transparent border border-white/20 rounded-[14px] h-[52px] text-white text-[18px] font-bold"
                  />
                </View>
              </View>

              {/* Input 4: Nickname for card */}
              <View className="mb-8">
                <Text className="text-white/70 text-[13px] font-medium mb-3 ml-1 uppercase tracking-wider">
                  Save Card As
                </Text>

                {/* --- PILL BUTTONS SECTION --- */}
                <View className="flex-row justify-between mb-5">
                  {["Personal", "Business", "Other"].map((type) => (
                    <TouchableOpacity
                      key={type}
                      activeOpacity={0.7}
                      onPress={() => setNickname(type)}
                      className={`border rounded-[20px] py-2.5 px-6 ${
                        nickname === type
                          ? "border-[#FF8A33] bg-[#FF8A33]/15"
                          : "border-white/20 bg-transparent"
                      }`}
                    >
                      <Text
                        className={`text-[14px] font-medium ${
                          nickname === type ? "text-[#FF8A33]" : "text-white/70"
                        }`}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Bottom line under pills matching the screenshot */}
                <View className="border-b border-white/10 mt-1" />
              </View>

              {/* --- MAKE PAYMENT BUTTON --- */}
              <View className="items-center mt-2 mb-2">
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="bg-[#FF8A33] rounded-full py-4 w-full shadow-lg shadow-orange-500/40 items-center justify-center"
                >
                  <Text className="text-white text-[17px] font-bold tracking-wide">
                    Make Payment
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </ScrollView>

        {/* --- CUSTOM DATE PICKER MODAL --- */}
        <Modal visible={showDatePicker} transparent animationType="slide">
          <View className="flex-1 justify-end bg-black/60">
            <View className="bg-[#2E0C54] rounded-t-[32px] p-6 border-t border-white/10 h-2/5 shadow-2xl">
              {/* Modal Header */}
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-white font-bold text-[20px]">
                  Select Expiry
                </Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text className="text-[#FF8A33] font-bold text-[17px]">
                    Done
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Scrollable Picker Columns */}
              <View className="flex-row flex-1">
                {/* Months Column */}
                <ScrollView
                  className="flex-1 border-r border-white/10"
                  showsVerticalScrollIndicator={false}
                >
                  {months.map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setExpM(m)}
                      className={`py-3 items-center rounded-xl mx-2 ${expM === m ? "bg-white/10" : ""}`}
                    >
                      <Text
                        className={`text-[20px] font-bold ${expM === m ? "text-[#FF8A33]" : "text-white/40"}`}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <View className="h-20" />
                </ScrollView>

                {/* Years Column */}
                <ScrollView
                  className="flex-1"
                  showsVerticalScrollIndicator={false}
                >
                  {years.map((y) => (
                    <TouchableOpacity
                      key={y}
                      onPress={() => setExpY(y)}
                      className={`py-3 items-center rounded-xl mx-2 ${expY === y ? "bg-white/10" : ""}`}
                    >
                      <Text
                        className={`text-[20px] font-bold ${expY === y ? "text-[#FF8A33]" : "text-white/40"}`}
                      >
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <View className="h-20" />
                </ScrollView>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}
