import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { BackIcon, MailSVG } from "@/assets/logo";
import { loginWithEmailPassword, getme } from "@/services/api.auth";
import { setUser } from "@/store/slices/authSlice";
import { useDispatch } from "react-redux";
import PopupModal from "@/components/Popup-modal"; // ✅ Import the modal

export default function EmailLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);

  // ✅ Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalHeading, setModalHeading] = useState("Alert");
  const [modalContent, setModalContent] = useState("");

  const dispatch = useDispatch();

  const showModal = (heading: string, content: string) => {
    setModalHeading(heading);
    setModalContent(content);
    setModalVisible(true);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showModal("Error", "Please enter both email and password");
      return;
    }

    try {
      setLoading(true);

      const res = await loginWithEmailPassword(email, password);
      const meRes = await getme(res.token);

      // Safely extract the profile regardless of backend envelope
      const profile =
        (meRes && (meRes.data?.data ?? meRes.data)) ?? meRes ?? {};

      // Normalize fields and keep original payload
      const userInfo = {
        id: profile.id ?? "",
        alias: profile.alias ?? "",
        name: profile.name ?? "",
        email: profile.email ?? "",
        phone: profile.phone_number ?? "",
        school: profile.school ?? "",
        signupMethod: profile.signup_method ?? "",
        board: profile.board ?? null,
        class: profile.student_class ?? null,
        stream: profile.stream ?? null,
        raw: profile,
      };

      // Store in Redux
      dispatch(setUser({ token: res.token, userInfo }));

      // Navigate to home (groups are not part of the URL)
      router.replace("/home");
    } catch (err: any) {
      console.log("Login error:", err);
      let message = "Invalid credentials or something went wrong";

      if (err.code === "auth/invalid-email")
        message = "Invalid email address. Please enter a valid email.";
      else if (err.code === "auth/user-not-found")
        message = "No account found with this email. Please sign up first.";
      else if (err.code === "auth/wrong-password")
        message = "Incorrect password. Please try again.";
      else if (err.code === "auth/missing-password")
        message = "Please enter your password.";
      else if (err.code === "auth/too-many-requests")
        message = "Too many failed attempts. Please try again later.";

      if (err.response?.data) {
        const data = err.response.data;
        if (data.detail) message = data.detail;
        else if (Array.isArray(data.email) && data.email[0])
          message = data.email[0];
        else if (Array.isArray(data.password) && data.password[0])
          message = data.password[0];
      }

      showModal("Login Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#FFFFFF", "#E4C7A6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1 px-6"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="ml-1 mt-4">
            <TouchableOpacity onPress={() => router.back()}>
              <BackIcon />
            </TouchableOpacity>
          </View>

          {/* Header */}
          <View className="flex-row justify-between items-center mt-32 mb-12 mx-3">
            <View>
              <Text className="text-black text-[24px] font-bold">
                Login With{" "}
              </Text>
              <Text className="text-black text-[24px] font-bold">Email</Text>
            </View>
            <View>
              <MailSVG />
            </View>
          </View>

          {/* Form */}
          <View className="bg-[#FEFCF34D] rounded-2xl px-6 py-8 mt-10">
            <Text className="text-black text-[20px] font-semibold mb-2 text-center">
              Enter Your Email Address
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              className="border border-gray-300 rounded-full px-4 py-3 mb-6 bg-white text-gray-700"
            />

            <Text className="text-black text-[20px] font-semibold mb-2 text-center">
              Enter Your Password
            </Text>
            <View className="relative">
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={isPasswordHidden}
                className="border border-gray-300 rounded-full px-4 py-3 mb-6 bg-white text-gray-700 pr-16" // Add right padding to avoid overlap
              />
              <TouchableOpacity
                onPress={() => setIsPasswordHidden((prev) => !prev)}
                className="absolute right-4 top-9 -translate-y-6"
              >
                <Text className="text-[#F98455] font-semibold">
                  {isPasswordHidden ? <AntDesign name="eye" size={24} color="#F98455" /> : <Entypo name="eye-with-line" size={24} color="#F98455" />}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className={`rounded-full py-4 mt-2 shadow-md ${
                loading ? "bg-[#f66830]" : "bg-[#F98455]"
              }`}
            >
              <Text className="text-white text-center font-semibold text-lg">
                {loading ? "Logging in..." : "Login"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(auth)/forgot-password")}
          >
            <Text className="text-[#F15D22] text-center font-semibold text-[16px] mt-8">
              Forgot Password?
            </Text>
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-black mt-32">Terms & Conditions</Text>
          </View>

          {/* ✅ Modal */}
          <PopupModal
            isVisible={modalVisible}
            onClose={() => setModalVisible(false)}
            heading={modalHeading}
            content={modalContent}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
