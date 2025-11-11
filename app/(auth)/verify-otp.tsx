import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import auth, { signInWithPhoneNumber } from "@react-native-firebase/auth"; // using RN Firebase
import { patchPhone } from "@/services/api.auth";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/slices/authSlice";
import { useAppSelector } from "@/utils/profileHelpers/profile.storeHooks";
import { authforMobile } from "./mobile-auth";
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
    <View className="flex-1 px-6 items-center justify-center bg-white">
      {/* Heading + number */}
      <Text className="text-[24px] font-extrabold text-[#7A1B1B] text-center">
        OTP has been sent to
      </Text>
      <Text className="text-[26px] font-extrabold text-[#F98455] text-center mt-1">
        {String(phone) || "+00 1234567890"}
      </Text>

      {/* OTP boxes */}
      <View className="mt-8 w-full items-center">
        <View className="flex-row justify-between w-[80%]">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              className="w-12 h-12 rounded-xl border border-[#F0C7AE] bg-[#FFF7F1] items-center justify-center"
            >
              <Text className="text-[20px] font-semibold text-[#8A6B5A]">
                {code[i] ? code[i] : ""}
              </Text>
            </View>
          ))}
        </View>

        {/* Hidden input captures all digits */}
        <TextInput
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          className="opacity-0 h-0 w-0"
          accessible={false}
        />
      </View>

      {/* Verify button */}
      <TouchableOpacity
        onPress={verify}
        disabled={loading}
        activeOpacity={0.9}
        className={`mt-10 w-72 py-4 rounded-3xl bg-[#F98455] items-center shadow-md ${
          loading ? "opacity-60" : ""
        }`}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-[18px] font-extrabold">Verify</Text>
        )}
      </TouchableOpacity>

      {/* Resend with countdown */}
      <TouchableOpacity
        onPress={handleResendOtp}
        className="mt-5"
        activeOpacity={0.7}
      >
        <Text className="text-[#F98455] font-semibold">
          {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
