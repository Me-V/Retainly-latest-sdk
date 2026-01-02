import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/slices/authSlice";
import { firebaseConfig } from "@/services/config";
import { signupWithEmailPassword } from "@/services/api.auth";
import { LinearGradient } from "expo-linear-gradient";
import { BackIcon, MailOpenSVG, MyLogo } from "@/assets/logo";
import PopupModal from "@/components/Popup-modal";
import { router } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function EmailSignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // keep confirm password
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  // Popup state
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupHeading, setPopupHeading] = useState("");
  const [popupContent, setPopupContent] = useState("");
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = useState(true);

  // Configuration for the glow
  const GLOW_COLOR = "rgba(255, 255, 255, 0.24)";
  const GLOW_SIZE = 12;

  const handleSignup = async () => {
    // 1. Validation Checks (Keep showing popup for errors)
    if (!email || !password || !confirmPassword) {
      setPopupHeading("Error");
      setPopupContent("Please fill in all fields");
      setPopupVisible(true);
      return;
    }

    if (password !== confirmPassword) {
      setPopupHeading("Error");
      setPopupContent("Passwords do not match");
      setPopupVisible(true);
      return;
    }

    setLoading(true);
    try {
      // 2. Create User
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // 3. Send Verification Email
      await sendEmailVerification(userCredential.user);

      // --- CHANGE IS HERE ---
      // Instead of showing the popup, we directly switch the screen state
      setEmailSent(true);
    } catch (err: any) {
      console.log(err);
      let message = "Something went wrong. Please try again.";

      if (err.code === "auth/invalid-email") {
        message = "Invalid email address. Please enter a valid email.";
      } else if (err.code === "auth/email-already-in-use") {
        message =
          "This email is already registered. Please login or use another email.";
      } else if (err.code === "auth/weak-password") {
        message = "Password is too weak. Please use at least 6 characters.";
      }

      // Keep popup for API errors
      setPopupHeading("Signup Error");
      setPopupContent(message);
      setPopupVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No logged in user");

      const idToken = await user.getIdToken(true);
      const res = await signupWithEmailPassword(email, password, idToken);

      dispatch(setUser({ token: res?.token, userInfo: { email } }));

      setPopupHeading("Success");
      setPopupContent("Email verified! You are now logged in.");
      setPopupVisible(true);
    } catch (err: any) {
      console.log(err);
      const backendMsg =
        err.response?.data?.detail ||
        "Please check your email for verification.";
      setPopupHeading("Email not verified");
      setPopupContent(backendMsg);
      setPopupVisible(true);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <LinearGradient
        colors={["#3B0A52", "#180323"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header - Uniform mt-12 */}
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
          {/* Using the "Edge Glow" settings: brighter start, sharper fade, stronger border */}
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className={`rounded-[24px] border border-white/10 overflow-hidden mx-6`}
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
            <View className="px-8 py-14 items-center">
              {/* Email Icon */}
              <View className="mb-8">
                <MailOpenSVG />
              </View>

              {/* Message Text */}
              <Text className="text-center text-white font-bold leading-8 text-[21px] mb-4">
                A verification link was sent to {"\n"}
                <Text className="text-[#F59E51] font-bold">{email}</Text>
                {"\n"}
                <Text className="font-normal text-[16px] text-[#FFFFFFB2]">
                  Check your inbox and verify your email, then tap "Continue".
                </Text>
              </Text>

              {/* Verify Button - Orange Gradient */}
              <TouchableOpacity
                onPress={() => handleCheckVerification()}
                className="w-full mb-6 shadow-lg"
              >
                <LinearGradient
                  colors={["#FF8A33", "#F59E51"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  className="rounded-3xl py-4"
                  style={{ borderRadius: 24 }}
                >
                  <Text className="text-white text-center font-bold text-[16px] py-0.5">
                    Once verified click continue
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Resend Code Link */}
              <TouchableOpacity
                onPress={() => console.log("Resend Code Pressed")}
              >
                <Text className="text-[#F59E51] text-center font-medium text-[16px]">
                  Resend Code
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Footer */}
          <View className="mb-10 mt-auto">
            <Text className="text-gray-400 font-medium text-xs text-center">
              Terms & Conditions
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      // Warm tint at top-left (#5A1C44) fading to dark purple
      colors={["#5A1C44", "#3B0A52", "#3A0353"]}
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
          }}
        >
          {/* Header Section */}
          <View className="mt-12 items-center relative z-10">
            {/* Back Button positioned absolutely within header area */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="absolute left-6"
            >
              <Ionicons name="chevron-back" size={24} color="white" />
              {/* Ensure your BackIcon accepts a color prop or is white by default */}
            </TouchableOpacity>

            <View className="mt-14">
              <MyLogo />
              <Text className="text-white text-center text-[15px] font-medium mt-5">
                tagline
              </Text>
            </View>
          </View>

          <Text className="text-center text-white text-[24px] font-bold mt-8 mb-6">
            Sign Up with Email
          </Text>

          {/* --- GLOW CARD CONTAINER --- */}
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className={`rounded-[24px] border border-white/10 overflow-hidden mx-6`}
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
            {/* --- Form Content --- */}
            <View className="px-8 py-12">
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="Enter Your Email"
                className="border border-gray-500 rounded-3xl px-5 py-5 mb-8 text-white text-[14px]"
              />

              <View className="relative mb-8">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={isPasswordHidden}
                  placeholder="Create Password"
                  className="border border-gray-500 rounded-3xl px-5 py-5 text-white text-[14px] pr-14"
                />
                <TouchableOpacity
                  onPress={() => setIsPasswordHidden((prev) => !prev)}
                  className="absolute right-4 top-[30px] -translate-y-[12px]" // Adjusted centering
                >
                  {isPasswordHidden ? (
                    <AntDesign name="eye" size={24} color="#F98455" />
                  ) : (
                    <Entypo name="eye-with-line" size={24} color="#F98455" />
                  )}
                </TouchableOpacity>
              </View>

              <View className="relative mb-8">
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={isConfirmPasswordHidden}
                  placeholder="Confirm Password"
                  className="border border-gray-500 rounded-3xl px-5 py-5 text-white text-[14px] pr-14"
                />
                <TouchableOpacity
                  onPress={() => setIsConfirmPasswordHidden((prev) => !prev)}
                  className="absolute right-4 top-[30px] -translate-y-[12px]"
                >
                  {isConfirmPasswordHidden ? (
                    <AntDesign name="eye" size={24} color="#F98455" />
                  ) : (
                    <Entypo name="eye-with-line" size={24} color="#F98455" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                onPress={handleSignup}
                disabled={loading}
                className="mb-2 shadow-lg"
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                <LinearGradient
                  colors={["#FF8A33", "#F59E51"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  className="rounded-lg py-4" // Changed from rounded-full to rounded-lg
                  style={{ borderRadius: 24 }}
                >
                  <Text className="font-bold text-white text-[18px] text-center">
                    {loading ? "Signing Up..." : "Sign Up"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Popup Modal */}
          <PopupModal
            isVisible={popupVisible}
            onClose={() => {
              setPopupVisible(false);
              if (popupHeading === "Email Sent!") setEmailSent(true);
            }}
            heading={popupHeading}
            content={popupContent}
            cancelShow={false}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
