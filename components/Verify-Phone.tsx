import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React from "react";
import { MobileSmsSVG } from "@/assets/logo";
import { LinearGradient } from "expo-linear-gradient";
import { OTPScrenIcon } from "@/assets/logo2";

const VerifyPhone = ({
  selectedCountry,
  phone,
  code,
  setCode,
  loading,
  verifyCode,
  handleResendOtp,
  countdown,
  updatingProfile,
}: {
  selectedCountry: any;
  phone: string;
  code: string;
  setCode: (code: string) => void;
  loading: boolean;
  verifyCode: () => void;
  handleResendOtp: () => void;
  countdown: number;
  updatingProfile: boolean;
}) => {
  return (
    <View className="w-full items-center">
      {/* Icon - Centered & Cleaned up for Dark Mode */}
      <View className="items-center mb-8">
        <OTPScrenIcon />
      </View>

      {/* Heading */}
      <Text className="text-[24px] font-bold text-white mb-4 text-center">
        Verify Your Number
      </Text>

      {/* Subtitle */}
      <Text className="text-[16px] text-gray-300 text-center mb-8 px-4">
        OTP sent to{" "}
        <Text className="text-[#F59E51] font-bold">
          {selectedCountry.dialCode} {phone}
        </Text>
      </Text>

      {/* OTP Input - Dark Theme Style */}
      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="Enter OTP"
        placeholderTextColor="#9CA3AF"
        keyboardType="number-pad"
        className="w-full bg-[#2A1C3E]/60 border border-gray-500/30 rounded-3xl px-5 py-5 mb-8 text-white text-[16px] text-center tracking-widest"
        autoFocus={true}
        maxLength={6}
      />

      {/* Confirm Button - Orange Gradient */}
      <TouchableOpacity
        onPress={verifyCode}
        disabled={loading}
        className="w-full mb-6 shadow-lg"
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        <LinearGradient
          colors={["#FF8A33", "#F59E51"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="rounded-3xl py-4"
          style={{ borderRadius: 24 }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center font-bold text-[18px]">
              Verify
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Resend OTP - Text Link Style */}
      <TouchableOpacity
        onPress={handleResendOtp}
        disabled={countdown > 0 || loading}
        className="mt-2"
      >
        <Text className="text-gray-400 font-medium text-[14px] text-center">
          {countdown > 0 ? (
            <>
              Resend OTP in{" "}
              <Text className="text-[#F59E51] font-bold">
                00:{countdown.toString().padStart(2, "0")}
              </Text>
            </>
          ) : (
            <>
              Didn't receive code?{" "}
              <Text className="text-[#F59E51] font-bold">Resend</Text>
            </>
          )}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default VerifyPhone;
