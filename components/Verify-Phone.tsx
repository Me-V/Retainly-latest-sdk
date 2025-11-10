import { View, Text, TextInput, TouchableOpacity } from "react-native";
import React from "react";
import { MobileSmsSVG } from "@/assets/logo";

const VerifyPhone = ({
  selectedCountry,
  phone,
  code,
  setCode,
  loading,
  verifyCode,
  handleResendOtp,
  countdown,
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
    <>
      <View className="items-center justify-center">
        <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mt-40 mb-4">
          <MobileSmsSVG />
        </View>
        <Text className="text-2xl font-bold text-gray-900 mt-8 mb-12">
          Verify Your Number
        </Text>
        <Text className="text-lg text-gray-600 text-center px-8 mt-5">
          OTP sent to{"  "}
          <Text className="text-orange-500 font-normal">
            {selectedCountry.dialCode} {phone}
          </Text>
        </Text>
      </View>
      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="Enter OTP"
        keyboardType="number-pad"
        className="border border-gray-300 rounded-xl bg-white py-3 px-5 text-lg mb-4 mt-5"
        placeholderTextColor="#cab09c"
        autoFocus={true}
        maxLength={6}
      />
      <TouchableOpacity
        className={`rounded-xl py-4 mt-2 items-center ${
          loading ? "bg-[#f7a98a]" : "bg-[#F98455]"
        }`}
        onPress={verifyCode}
        disabled={loading}
      >
        <Text className="text-white font-bold text-base">
          {loading ? "Verifying..." : "Confirm OTP"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleResendOtp}
        disabled={countdown > 0 || loading}
        className={`rounded-xl py-4 mt-2 items-center ${
          countdown > 0 ? "opacity-50" : "bg-[#F98455]"
        }`}
      >
        <Text className="text-white font-bold text-base">
          {countdown > 0
            ? `Resend OTP in 00:${countdown.toString().padStart(2, "0")}`
            : loading
            ? "Resending..."
            : "Resend OTP"}
        </Text>
      </TouchableOpacity>
    </>
  );
};

export default VerifyPhone;
