import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
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

  const handleSignup = async () => {
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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await sendEmailVerification(userCredential.user);

      setPopupHeading("Email Sent!");
      setPopupContent("Please check your email for the verification code.");
      setPopupVisible(true);
    } catch (err: any) {
      // <-- This is where you replace Alert.alert with the popup
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
      <>
        <LinearGradient
          colors={["#FFFFFF", "#E4C7A6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="flex-1 px-6"
        >
          <View className="ml-1 mt-3">
            <TouchableOpacity onPress={() => router.back()}>
              <BackIcon />
            </TouchableOpacity>
          </View>

          {/* Email Icon */}
          <View className="items-center mt-16">
            <MailOpenSVG />
          </View>

          {/* Message Box */}
          <View className="bg-[#FEFCF3] rounded-3xl px-6 py-8 mt-10 shadow-md">
            <Text className="text-center text-black font-medium leading-6 text-[20px]">
              we have sent you a verification link on{" "}
              <Text className="text-orange-500 font-semibold">{email}</Text>{" "}
              <Text>please verify to continue</Text>
            </Text>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={() => handleCheckVerification()}
              className="bg-orange-500 rounded-full py-4 mt-8 shadow-md"
            >
              <Text className="text-white text-center font-semibold text-base">
                Once verified click continue
              </Text>
            </TouchableOpacity>

            {/* Resend Code */}
            <TouchableOpacity
              onPress={() => console.log("Resend Code Pressed")}
            >
              <Text className="text-orange-500 text-center font-medium text-[16px] mt-4">
                Resend Code
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text className="text-black font-medium text-xs text-center mt-20">
            Terms & Conditions
          </Text>
        </LinearGradient>
      </>
    );
  }
  return (
    <LinearGradient
      colors={["#FFFFFF", "#E4C7A6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0} // ✅ helps on iOS
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
          }}
        >
          <View className="ml-6 mt-6">
            <TouchableOpacity onPress={() => router.back()}>
              <BackIcon />
            </TouchableOpacity>
          </View>

          {/* Header */}
          <View className="items-center mt-10 mb-12">
            <MyLogo />
          </View>

          {/* Form */}
          <View className="px-8 mt-8">
            <Text className="text-center text-black text-[24px] mb-8 font-bold">
              Sign Up with Email
            </Text>
            <Text className="text-center text-black text-[20px] mb-2 mt-4">
              Email Address
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              className="border border-gray-300 rounded-3xl px-4 py-3 mb-4 bg-white text-gray-700"
            />
            <Text className="text-center text-black text-[20px] mb-2 mt-4">
              Password
            </Text>
            <View className="relative">
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={isPasswordHidden}
                className="border border-gray-300 rounded-3xl px-4 py-3 mb-6 bg-white text-gray-700 pr-16" // right padding for toggle
              />
              <TouchableOpacity
                onPress={() => setIsPasswordHidden((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-6"
              >
                <Text className="text-[#F98455] font-semibold">
                  {isPasswordHidden ? (
                    <AntDesign name="eye" size={24} color="#F98455" />
                  ) : (
                    <Entypo name="eye-with-line" size={24} color="#F98455" />
                  )}
                </Text>
              </TouchableOpacity>
            </View>
            <Text className="text-center text-black text-[20px] mb-2 mt-4">
              Confirm Password
            </Text>
            <View className="relative">
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={isConfirmPasswordHidden}
                className="border border-gray-300 rounded-3xl px-4 py-3 mb-6 bg-white text-gray-700 pr-16"
              />
              <TouchableOpacity
                onPress={() => setIsConfirmPasswordHidden((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-6"
              >
                <Text className="text-[#F98455] font-semibold">
                  {isConfirmPasswordHidden ? (
                    <AntDesign name="eye" size={24} color="#F98455" />
                  ) : (
                    <Entypo name="eye-with-line" size={24} color="#F98455" />
                  )}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              className="bg-[#F98455] border border-gray-300 rounded-3xl py-4 my-4"
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              <Text className="font-medium text-white text-base text-center">
                {loading ? "Signing Up..." : "Sign Up"}
              </Text>
            </TouchableOpacity>
            {/* Footer */}
            <Text className="text-black font-medium text-base text-center mt-20">
              Terms & Conditions
            </Text>
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
