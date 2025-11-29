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
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { BackIcon, MailSVG, MyLogo } from "@/assets/logo";
import { loginWithEmailPassword, getme } from "@/services/api.auth";
import { setUser } from "@/store/slices/authSlice";
import { useDispatch } from "react-redux";
import PopupModal from "@/components/Popup-modal";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function EmailLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalHeading, setModalHeading] = useState("Alert");
  const [modalContent, setModalContent] = useState("");

  const dispatch = useDispatch();

  // Configuration for the glow
  const GLOW_COLOR = "rgba(255, 255, 255, 0.24)";
  const GLOW_SIZE = 12;

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
      router.replace("/(main)/animation");
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
            paddingBottom: 40,
          }}
        >
          {/* Header Section */}
          <View className="my-12 items-center relative z-10">
            <TouchableOpacity
              onPress={() => router.back()}
              className="absolute left-6"
            >
              <Ionicons name="chevron-back" size={24} color="white" />
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
            colors={["rgba(255, 255, 255, 0.25)", "rgba(255, 255, 255, 0.05)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="mx-6 mb-10 rounded-[40px] overflow-hidden border border-gray-500/50"
          >
            {/* Glow Borders */}
            <LinearGradient
              colors={[GLOW_COLOR, "transparent"]}
              style={{ position: "absolute", top: 0, left: 0, right: 0, height: GLOW_SIZE, zIndex: 1 }}
              pointerEvents="none"
            />
            <LinearGradient
              colors={["transparent", GLOW_COLOR]}
              style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: GLOW_SIZE, zIndex: 1 }}
              pointerEvents="none"
            />
            <LinearGradient
              colors={[GLOW_COLOR, "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: GLOW_SIZE, zIndex: 1 }}
              pointerEvents="none"
            />
            <LinearGradient
              colors={["transparent", GLOW_COLOR]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: GLOW_SIZE, zIndex: 1 }}
              pointerEvents="none"
            />

            {/* --- Form Content --- */}
            <View className="px-8 py-12">
              <View className="items-start mb-4 ml-3">
                <Text className="text-center text-white text-[24px] font-bold mt-8 mb-6">
                  Login with Email
                </Text>
              </View>


              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter Your Email"
                className="border border-gray-500 rounded-3xl px-5 py-5 mb-6 text-white text-[16px]"
              />


              <View className="relative mb-8">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={isPasswordHidden}
                  placeholder="Enter Your Password"
                  className="border border-gray-500 rounded-3xl px-5 py-5 text-white text-[16px] pr-14"
                />
                <TouchableOpacity
                  onPress={() => setIsPasswordHidden((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-[12px]"
                >
                  {isPasswordHidden ? (
                    <AntDesign name="eye" size={24} color="#F98455" />
                  ) : (
                    <Entypo name="eye-with-line" size={24} color="#F98455" />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleLogin}
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
                  <Text className="text-white text-center font-bold text-[18px]">
                    {loading ? "Logging in..." : "Login"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(auth)/forgot-password")}
              >
                <Text className="text-white font-semibold text-[16px] mt-6 ml-3">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Modal */}
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