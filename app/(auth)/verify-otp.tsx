import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import auth, { signInWithPhoneNumber } from "@react-native-firebase/auth"; // using RN Firebase
import { patchPhone } from "@/services/api.auth";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/slices/authSlice";
import { useAppSelector } from "@/utils/profileHelpers/profile.storeHooks";
import { authforMobile } from "./mobile-auth";
import { LinearGradient } from "expo-linear-gradient";
import { BackIcon, MyLogo } from "@/assets/logo";
import PopupModal from "@/components/Popup-modal"; // Assuming you have this component
import { OTPScrenIcon } from "@/assets/logo2";

const countries = [
  { code: "IN", dialCode: "+91", name: "India", flag: "🇮🇳" },
  { code: "US", dialCode: "+1", name: "United States", flag: "🇺🇸" },
  { code: "GB", dialCode: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", dialCode: "+1", name: "Canada", flag: "🇨🇦" },
  { code: "AU", dialCode: "+61", name: "Australia", flag: "🇦🇺" },
];

export default function OtpScreen() {
  const token = useAppSelector((s) => s.auth.token);
  const { verificationId, phone } = useLocalSearchParams<{
    verificationId: string;
    phone: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<any>(null);
  const [countdown, setCountdown] = useState(60);
  const [code, setCode] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);

  // Popup modal state
  const [popupVisible, setPopupVisible] = React.useState(false);
  const [popupHeading, setPopupHeading] = React.useState<string>("");
  const [popupContent, setPopupContent] = React.useState<string>("");
  const [popupPrimaryText, setPopupPrimaryText] = React.useState<string>("OK");
  const [popupDismissible, setPopupDismissible] = React.useState<boolean>(true);
  const dispatch = useDispatch();

  // Configuration for the glow
  const GLOW_COLOR = "rgba(255, 255, 255, 0.24)";
  const GLOW_SIZE = 12;

  React.useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const showPopup = ({
    heading,
    content,
    primaryText = "OK",
    dismissible = true,
  }: {
    heading: string;
    content: string;
    primaryText?: string;
    dismissible?: boolean;
  }) => {
    setPopupHeading(heading);
    setPopupContent(content);
    setPopupPrimaryText(primaryText);
    setPopupDismissible(dismissible);
    setPopupVisible(true);
  };

  const verify = async () => {
    try {
      if (!verificationId || !/^\d{6}$/.test(code)) return;
      setLoading(true);
      // Build credential and confirm
      const credential = auth.PhoneAuthProvider.credential(
        verificationId,
        code
      );
      await auth().signInWithCredential(credential);
      const idToken = await auth().currentUser?.getIdToken(true);
      if (!idToken) throw new Error("Could not get ID token.");

      await patchPhone(token!, {
        phone_number: String(phone),
        phone_token: idToken,
      });

      dispatch(
        setUser({
          token: token!,
          userInfo: { fullNumber: String(phone) },
        })
      );
      router.replace("/(main)/animation");
    } catch (e: any) {
      alert(e?.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
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

  const formatE164 = (dial: string, raw: string) =>
    `${dial}${raw.replace(/\D/g, "")}`;

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
      setCountdown(60); // Set countdown only after successful send
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
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View className="mt-12 items-center relative z-10">
            <TouchableOpacity
              onPress={() => router.back()}
              className="absolute left-6"
            >
              <BackIcon color="white" />
            </TouchableOpacity>

            <View className="mt-14 items-center">
              <MyLogo />
              <Text className="text-white text-[15px] font-medium mt-5">
                tagline
              </Text>
            </View>
          </View>

          {/* --- GLOW CARD CONTAINER --- */}
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className={`rounded-[24px] border border-white/10 overflow-hidden mx-6 mt-4`}
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

            {/* --- Card Content --- */}
            <View className="px-8 py-14 items-center">
              {/* Phone Icon */}
              <View className="mb-8">
                <OTPScrenIcon />
              </View>

              <Text className="text-[24px] font-bold text-white text-center mb-4">
                Verify Your Number
              </Text>

              <Text className="text-[16px] text-gray-300 text-center mb-8">
                OTP sent to{" "}
                <Text className="text-[#F59E51] font-bold">
                  {String(phone) || "+00 1234567890"}
                </Text>
              </Text>

              {/* OTP Input Field */}
              <TextInput
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
                keyboardType="number-pad"
                placeholder="Enter OTP"
                placeholderTextColor="#9CA3AF"
                className="w-full bg-[#2A1C3E]/60 border border-gray-500/30 rounded-3xl px-5 py-5 mb-8 text-white text-[16px] text-center tracking-widest"
                maxLength={6}
              />

              {/* Verify Button */}
              <TouchableOpacity
                onPress={verify}
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

              {/* Resend with countdown */}
              <TouchableOpacity onPress={handleResendOtp} activeOpacity={0.7}>
                <Text className="text-gray-400 font-medium text-[14px]">
                  Didn't receive OTP?{" "}
                  <Text className="text-[#F59E51] font-bold">
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend"}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Popup Modal */}
          <PopupModal
            isVisible={popupVisible}
            onClose={() => setPopupVisible(false)}
            heading={popupHeading}
            content={popupContent}
            primaryText={popupPrimaryText}
            dismissible={popupDismissible}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
