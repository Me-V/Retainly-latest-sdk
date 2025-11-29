import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal as RNModal,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { initializeApp, getApps, getApp } from "@react-native-firebase/app";
import { getAuth, signInWithPhoneNumber } from "@react-native-firebase/auth";
import { signupWithPhoneOTP } from "@/services/api.auth";
import { setUser } from "@/store/slices/authSlice";
import { useDispatch } from "react-redux";
import { router } from "expo-router";
import PopupModal from "@/components/Popup-modal";
import { BackIcon, MobileLogo2, MyLogo } from "@/assets/logo";
import VerifyPhone from "@/components/Verify-Phone";
import Ionicons from "@expo/vector-icons/Ionicons"; // Ensure you have this or use your BackIcon

// ---- Firebase config ----
if (!getApps().length) {
  initializeApp({
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID!,
  });
}
export const authforMobile = getAuth(getApp());

const countries = [
  { code: "IN", dialCode: "+91", name: "India", flag: "🇮🇳" },
  { code: "US", dialCode: "+1", name: "United States", flag: "🇺🇸" },
  { code: "GB", dialCode: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", dialCode: "+1", name: "Canada", flag: "🇨🇦" },
  { code: "AU", dialCode: "+61", name: "Australia", flag: "🇦🇺" },
];

const PHONE_RULES: Record<
  string,
  { exact?: number; min?: number; max?: number; example?: string }
> = {
  IN: { exact: 10, example: "e.g., 9876543210" },
  US: { exact: 10, example: "e.g., 4155550133" },
  CA: { exact: 10, example: "e.g., 4165550133" },
  GB: { min: 9, max: 10, example: "e.g., 7123456789" },
  AU: { exact: 9, example: "e.g., 412345678" },
};

const MobileLoginScreen = () => {
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [confirm, setConfirm] = useState<any>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  // Error/info popup
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupHeading, setPopupHeading] = useState<string>("Alert");
  const [popupContent, setPopupContent] = useState<string>("");
  const [popupPrimaryText, setPopupPrimaryText] = useState<string>("OK");
  const [popupDismissible, setPopupDismissible] = useState<boolean>(true);

  // Success popup (OTP sent)
  const [successVisible, setSuccessVisible] = useState(false);
  const [successContent, setSuccessContent] = useState<string>("");

  // Configuration for the glow
  const GLOW_COLOR = "rgba(255, 255, 255, 0.24)";
  const GLOW_SIZE = 12;

  const showPopup = (opts: {
    heading?: string;
    content: string;
    primaryText?: string;
    dismissible?: boolean;
  }) => {
    setPopupHeading(opts.heading || "Alert");
    setPopupContent(opts.content);
    setPopupPrimaryText(opts.primaryText || "OK");
    setPopupDismissible(opts.dismissible ?? true);
    setPopupVisible(true);
  };
  const hidePopup = () => setPopupVisible(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatE164 = (dial: string, raw: string) =>
    `${dial}${raw.replace(/\D/g, "")}`;

  const isPhoneValidForCountry = (countryCode: string, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const rule = PHONE_RULES[countryCode];
    if (!digits)
      return { valid: false, reason: "Please enter your phone number." };
    if (!rule) {
      if (digits.length < 6 || digits.length > 14) {
        return { valid: false, reason: "Enter a valid phone number." };
      }
      return { valid: true };
    }
    if (rule.exact && digits.length !== rule.exact) {
      return {
        valid: false,
        reason: `Enter a ${rule.exact}-digit number ${
          rule.example ? `(${rule.example})` : ""
        }`.trim(),
      };
    }
    if (rule.min && digits.length < rule.min) {
      return {
        valid: false,
        reason: `Number seems too short ${
          rule.example ? `(${rule.example})` : ""
        }`.trim(),
      };
    }
    if (rule.max && digits.length > rule.max) {
      return {
        valid: false,
        reason: `Number seems too long ${
          rule.example ? `(${rule.example})` : ""
        }`.trim(),
      };
    }
    return { valid: true };
  };

  const mapFirebaseError = (err: any) => {
    const code: string = err?.code || "";
    if (code.includes("auth/invalid-phone-number"))
      return "The phone number format is invalid.";
    if (code.includes("auth/invalid-verification-code"))
      return "The OTP you entered is incorrect. Please try again.";
    if (
      code.includes("auth/code-expired") ||
      code.includes("auth/session-expired")
    )
      return "The OTP has expired. Please request a new one.";
    if (code.includes("auth/too-many-requests"))
      return "Too many attempts. Please try again later.";
    if (code.includes("auth/quota-exceeded"))
      return "OTP quota exceeded. Try again later.";
    return err?.message || "Something went wrong. Please try again.";
  };

  const mapApiError = (err: any) => {
    const detail =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.message;
    if (typeof detail === "string") {
      if (/network error/i.test(detail))
        return "Cannot reach the server. Check your internet connection or try again.";
      return detail;
    }
    return "We couldn't complete signup. Please try again.";
  };

  const sendSMS = async () => {
    try {
      setLoading(true);
      setStatus("");
      const validation = isPhoneValidForCountry(selectedCountry.code, phone);
      if (!validation.valid) {
        showPopup({
          heading: "Invalid phone number",
          content: validation.reason!,
        });
        return;
      }
      const fullNumber = formatE164(selectedCountry.dialCode, phone);
      const confirmation = await signInWithPhoneNumber(
        authforMobile,
        fullNumber
      );
      setConfirm(confirmation);
      setCountdown(60);
    } catch (err: any) {
      showPopup({
        heading: "Failed to send OTP",
        content: mapFirebaseError(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    try {
      if (!confirm) return;
      setLoading(true);
      setStatus("");

      if (!/^\d{6}$/.test(code)) {
        showPopup({
          heading: "Invalid OTP",
          content: "Please enter the 6-digit code sent to your phone.",
        });
        return;
      }

      await confirm.confirm(code);

      const user = authforMobile.currentUser;
      const idToken = await user?.getIdToken(true);
      if (!idToken) throw new Error("Failed to get ID token from Firebase.");

      const fullNumber = formatE164(selectedCountry.dialCode, phone);
      const data = await signupWithPhoneOTP(fullNumber, idToken);

      if (data?.token) {
        dispatch(setUser({ token: data.token, userInfo: { fullNumber } }));
        router.replace("/(main)/animation");
        setStatus("Phone verified and authorized!");
      } else {
        showPopup({
          heading: "Signup incomplete",
          content: "No token received from backend. Please try again.",
        });
      }
    } catch (err: any) {
      const isAxios = !!(err?.isAxiosError || err?.response || err?.request);
      const message = isAxios ? mapApiError(err) : mapFirebaseError(err);
      showPopup({ heading: "Verification failed", content: message });
      setStatus(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) {
      return showPopup({
        heading: "Please wait",
        content: `Please wait ${countdown}s to resend`,
      });
    }
    try {
      const confirmation = await signInWithPhoneNumber(
        authforMobile,
        formatE164(selectedCountry.dialCode, phone)
      );
      setConfirm(confirmation);
      setCountdown(60);
      showPopup({
        heading: "OTP resent successfully",
        content: "OTP resent successfully",
      });
    } catch (err) {
      showPopup({
        heading: "Failed to resend OTP",
        content: mapFirebaseError(err),
      });
    }
  };

  const handleCountrySelect = (country: any) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
  };

  const renderCountryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handleCountrySelect(item)}
      className="flex-row items-center px-6 py-3 border-b border-gray-200"
    >
      <Text className="text-2xl mr-3">{item.flag}</Text>
      <View>
        <Text className="font-bold text-base">{item.name}</Text>
        <Text className="text-gray-600">{item.dialCode}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={["#3B0A52", "#180323"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 60,
          }}
        >
          {/* Header Section */}
          <View className="mt-12 mb-4 items-center relative z-10">
            <TouchableOpacity
              onPress={() => router.back()}
              className="absolute left-6"
            >
              <Ionicons name="chevron-back" size={24} color="white" />
              {/* Ensure your BackIcon accepts a color prop or is white by default */}
            </TouchableOpacity>

            <View className="mt-14 items-center">
              <MyLogo />
              <Text className="text-white text-[15px] font-medium mt-5">
                tagline
              </Text>
            </View>
          </View>

          {!confirm && (
            <Text className="text-center text-white text-[24px] font-bold mt-8 mb-6">
              Create Your Account
            </Text>
          )}

          {/* --- GLOW CARD CONTAINER --- */}
          <LinearGradient
            // Brighter start (0.3), faster fade to transparent center (0.02)
            colors={["rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 0.8 }} // Shortened end point to concentrate glow at top-left edge
            // Increased border opacity to border-white/30 for sharper edge definition
            className="mx-6 mt-10 mb-10 rounded-[40px] overflow-hidden border border-white/30"
          >
            {/* --- Card Content --- */}
            <View className="px-8 py-12">
              {!confirm ? (
                <>
                  <View className="items-center mb-8">
                    <MobileLogo2 />
                  </View>

                  <Text className="text-[18px] text-center font-medium text-gray-300 mb-6">
                    Enter Mobile Number
                  </Text>

                  {/* Input Row */}
                  <View className="flex-row items-center mb-8">
                    {/* Country Code Trigger */}
                    <TouchableOpacity
                      className="flex-row items-center bg-[#2A1C3E]/60 border border-gray-500/30 rounded-l-3xl px-4 py-5"
                      onPress={() => setShowCountryPicker(true)}
                    >
                      <Text className="text-sm mr-2 text-white">
                        {selectedCountry.flag}
                      </Text>
                      <Text className="text-white font-medium text-[16px]">
                        {selectedCountry.dialCode}
                      </Text>
                      <Text className="ml-2 text-gray-400">▼</Text>
                    </TouchableOpacity>

                    {/* Phone Input */}
                    <TextInput
                      className="flex-1 bg-[#2A1C3E]/60 border border-gray-500/30 border-l-0 rounded-r-3xl pl-4 py-5 text-white text-[16px]"
                      placeholder="Phone number"
                      placeholderTextColor="#9CA3AF"
                      value={phone}
                      onChangeText={setPhone}
                      autoComplete="tel"
                      keyboardType="phone-pad"
                    />
                  </View>

                  {/* Continue Button with Gradient */}
                  <TouchableOpacity
                    onPress={sendSMS}
                    disabled={loading}
                    className="mb-2 shadow-lg"
                    style={{ opacity: loading ? 0.7 : 1 }}
                  >
                    <LinearGradient
                      colors={["#FF8A33", "#F59E51"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      className="rounded-lg py-4"
                      style={{ borderRadius: 24 }}
                    >
                      <Text className="text-white text-center text-[18px] font-bold">
                        {loading ? "Sending..." : "Continue"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                // Verify Phone Component
                // Ensure VerifyPhone is wrapped properly. If it has its own styling, it might conflict.
                // Assuming VerifyPhone takes props and renders inputs.
                <VerifyPhone
                  selectedCountry={selectedCountry}
                  phone={phone}
                  code={code}
                  setCode={setCode}
                  loading={loading}
                  verifyCode={verifyCode}
                  handleResendOtp={handleResendOtp}
                  countdown={countdown}
                  updatingProfile={false}
                />
              )}
              {status ? (
                <Text className="text-[#E03636] text-center text-sm mt-4">
                  {status}
                </Text>
              ) : null}
            </View>
          </LinearGradient>

          {/* Country Picker Modal */}
          <RNModal
            visible={showCountryPicker}
            animationType="slide"
            transparent
          >
            <View className="flex-1 bg-black/60 justify-end">
              <View className="bg-white rounded-t-[30px] max-h-[70vh] overflow-hidden pb-10">
                <View className="flex-row justify-between items-center py-5 px-6 border-b border-gray-100">
                  <Text className="text-lg font-bold text-gray-800">
                    Select Country
                  </Text>
                  <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                    <Text className="text-base font-semibold text-[#F98455]">
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={countries}
                  keyExtractor={(item) => item.code}
                  renderItem={renderCountryItem}
                  className="mb-4"
                />
              </View>
            </View>
          </RNModal>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Popups */}
      <PopupModal
        isVisible={popupVisible}
        onClose={hidePopup}
        heading={popupHeading}
        content={popupContent}
        primaryText={popupPrimaryText}
        dismissible={popupDismissible}
      />

      <PopupModal
        isVisible={successVisible}
        onClose={() => setSuccessVisible(false)}
        heading="OTP sent"
        content={
          successContent ||
          "OTP is being sent to your mobile number successfully."
        }
        primaryText="OK"
        dismissible={true}
      />
    </LinearGradient>
  );
};

export default MobileLoginScreen;
